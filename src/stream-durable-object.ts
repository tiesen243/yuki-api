import { DurableObject } from 'cloudflare:workers'

interface WebSocketAttachment {
  connectionId: string
}

interface Message {
  action: 'subscribe' | 'unsubscribe' | 'publish'
  topic?: string
  payload?: unknown
}

export class StreamDurableObject extends DurableObject<Env> {
  private readonly topics = new Map<string, Set<WebSocket>>()

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)

    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS topics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        topic_id INTEGER NOT NULL,
        connection_id TEXT NOT NULL,
        PRIMARY KEY (topic_id, connection_id),
        FOREIGN KEY (topic_id)
          REFERENCES topics(id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_subscriptions_topic
      ON subscriptions(topic_id);

      CREATE INDEX IF NOT EXISTS idx_subscriptions_connection
      ON subscriptions(connection_id);
    `)

    // Restore all WebSocket connections after hibernation.
    for (const ws of this.ctx.getWebSockets()) {
      const attachment =
        ws.deserializeAttachment() as WebSocketAttachment | null

      if (!attachment) continue

      const rows = this.ctx.storage.sql
        .exec<{ name: string }>(
          `
            SELECT topics.name
            FROM subscriptions
            INNER JOIN topics
              ON topics.id = subscriptions.topic_id
            WHERE subscriptions.connection_id = ?
          `,
          attachment.connectionId
        )
        .toArray()

      for (const row of rows) {
        this.addToMemory(row.name, ws)
      }
    }

    // Cloudflare can answer ping/pong while the DO is hibernating.
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair('ping', 'pong')
    )
  }

  override fetch(_request: Request): Response {
    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]

    const connectionId = crypto.randomUUID()

    this.ctx.acceptWebSocket(server)

    server.serializeAttachment({
      connectionId,
    } satisfies WebSocketAttachment)

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  override webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    try {
      const raw =
        typeof message === 'string'
          ? message
          : new TextDecoder().decode(message)

      const data = JSON.parse(raw) as Message

      switch (data.action) {
        case 'subscribe':
          if (data.topic === undefined || data.topic === '') return

          this.subscribe(ws, data.topic)
          break

        case 'unsubscribe':
          if (data.topic === undefined || data.topic === '') return

          this.unsubscribe(ws, data.topic)
          break

        case 'publish':
          if (data.topic === undefined || data.topic === '') return

          this.publish(data.topic, data.payload)
          break

        default:
          ws.send(
            JSON.stringify({
              error: 'Unknown action',
            })
          )
      }
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error)

      try {
        ws.send(
          JSON.stringify({
            error: 'Invalid message',
          })
        )
      } catch {
        // Socket is already closed.
      }
    }
  }

  override webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ) {
    const attachment = ws.deserializeAttachment() as WebSocketAttachment | null

    if (attachment) {
      this.ctx.storage.sql.exec(
        `
          DELETE FROM subscriptions
          WHERE connection_id = ?
        `,
        attachment.connectionId
      )
    }

    this.removeSocketFromMemory(ws)

    console.log('WebSocket closed', {
      code,
      reason,
      wasClean,
    })
  }

  private subscribe(ws: WebSocket, topic: string) {
    const attachment = ws.deserializeAttachment() as WebSocketAttachment | null

    if (!attachment) return

    // Create topic if it does not exist.
    this.ctx.storage.sql.exec(
      `
        INSERT INTO topics (name)
        VALUES (?)
        ON CONFLICT(name) DO NOTHING
      `,
      topic
    )

    // Get topic ID.
    const topicRow = this.ctx.storage.sql
      .exec<{ id: number | null }>(
        `
          SELECT id
          FROM topics
          WHERE name = ?
        `,
        topic
      )
      .one()

    if (topicRow.id === null) return

    // Store durable subscription.
    this.ctx.storage.sql.exec(
      `
        INSERT INTO subscriptions (
          topic_id,
          connection_id
        )
        VALUES (?, ?)
        ON CONFLICT(topic_id, connection_id) DO NOTHING
      `,
      topicRow.id,
      attachment.connectionId
    )

    // Update runtime cache.
    this.addToMemory(topic, ws)

    ws.send(
      JSON.stringify({
        status: 'subscribed',
        topic,
      })
    )
  }

  private unsubscribe(ws: WebSocket, topic: string) {
    const attachment = ws.deserializeAttachment() as WebSocketAttachment | null

    if (!attachment) return

    this.ctx.storage.sql.exec(
      `
        DELETE FROM subscriptions
        WHERE connection_id = ?
          AND topic_id = (
            SELECT id
            FROM topics
            WHERE name = ?
          )
      `,
      attachment.connectionId,
      topic
    )

    this.removeFromMemory(topic, ws)

    ws.send(
      JSON.stringify({
        status: 'unsubscribed',
        topic,
      })
    )

    this.cleanupTopic(topic)
  }

  private publish(topic: string, payload: unknown) {
    const subscribers = this.topics.get(topic)

    if (!subscribers) return

    const outgoingMessage = JSON.stringify({
      topic,
      payload,
    })

    for (const ws of subscribers) {
      if (ws.readyState !== WebSocket.OPEN) {
        this.removeFromMemory(topic, ws)
        continue
      }

      try {
        ws.send(outgoingMessage)
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)

        this.removeFromMemory(topic, ws)
      }
    }

    this.cleanupTopic(topic)
  }

  private addToMemory(topic: string, ws: WebSocket) {
    let subscribers = this.topics.get(topic)

    if (!subscribers) {
      subscribers = new Set()
      this.topics.set(topic, subscribers)
    }

    subscribers.add(ws)
  }

  private removeFromMemory(topic: string, ws: WebSocket) {
    const subscribers = this.topics.get(topic)

    if (!subscribers) return

    subscribers.delete(ws)

    if (subscribers.size === 0) {
      this.topics.delete(topic)
    }
  }

  private removeSocketFromMemory(ws: WebSocket) {
    for (const [topic, subscribers] of this.topics) {
      subscribers.delete(ws)

      if (subscribers.size === 0) {
        this.topics.delete(topic)
      }
    }
  }

  private cleanupTopic(topic: string) {
    const subscribers = this.topics.get(topic)

    if (subscribers && subscribers.size > 0) {
      return
    }

    this.ctx.storage.sql.exec(
      `
        DELETE FROM topics
        WHERE name = ?
          AND NOT EXISTS (
            SELECT 1
            FROM subscriptions
            WHERE subscriptions.topic_id = topics.id
          )
      `,
      topic
    )

    this.topics.delete(topic)
  }
}
