import { DurableObject } from 'cloudflare:workers'

export class StreamDurableObject extends DurableObject<Env> {
  private topics = new Map<string, Set<WebSocket>>()

  // oxlint-disable-next-line no-useless-constructor
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
  }

  override fetch(_request: Request): Response {
    const pair = new WebSocketPair()
    const [client, server] = [pair[0], pair[1]]

    this.ctx.acceptWebSocket(server)
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
      const data = JSON.parse(raw)
      const { action, topic, payload } = data

      if (!topic) return

      switch (action) {
        case 'subscribe':
          if (!this.topics.has(topic)) this.topics.set(topic, new Set())

          this.topics.get(topic)?.add(ws)
          ws.send(JSON.stringify({ status: 'subscribed', topic }))
          break

        case 'unsubscribe':
          if (this.topics.has(topic)) {
            this.topics.get(topic)?.delete(ws)
            if (this.topics.get(topic)?.size === 0) this.topics.delete(topic)
          }

          ws.send(JSON.stringify({ status: 'unsubscribed', topic }))
          break

        case 'publish': {
          const subscribers = this.topics.get(topic)
          if (subscribers) {
            const outgoingMessage = JSON.stringify({ topic, payload })
            for (const clientWs of subscribers) clientWs.send(outgoingMessage)
          }
          break
        }

        default:
          ws.send(JSON.stringify({ error: 'Unknown action' }))
          break
      }
    } catch {
      // noop
    }
  }
}
