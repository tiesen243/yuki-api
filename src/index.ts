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
    Layer.provide(Layer.succeed(References.TracerEnabled)(false))
  ),
  { disableLogger: true }
)

export default {
  fetch: (request) => handler(request, {} as never),
} satisfies ExportedHandler
