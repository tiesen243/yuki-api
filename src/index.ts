import { env } from 'cloudflare:workers'
import * as HttpRouter from 'effect/http/HttpRouter'
import * as HttpServer from 'effect/http/HttpServer'
import * as Layer from 'effect/Layer'
import * as References from 'effect/References'

import { DrizzleClient } from '@/infrastructure/persistence/drizzle'
import { Routes } from '@/server'

const { handler } = HttpRouter.toWebHandler(
  Routes.pipe(
    Layer.provide(DrizzleClient.layer),
    Layer.provide(HttpServer.layerServices),
    Layer.provide(
      HttpRouter.cors({
        allowedOrigins: ['*'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'traceparent', 'b3'],
      })
    ),
    Layer.provide(Layer.succeed(References.TracerEnabled)(false))
  ),
  { disableLogger: true }
)

export { StreamDurableObject } from '@/stream-durable-object'
export default {
  fetch: (request) => {
    const url = new URL(request.url)
    if (url.pathname === '/ws') {
      const id = env.Stream.idFromName(url.pathname)
      const stub = env.Stream.get(id)
      return stub.fetch(request)
    }

    return handler(request, {} as never)
  },
} satisfies ExportedHandler<Env>
