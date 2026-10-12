import * as Effect from 'effect/Effect'
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder'

import { Api } from '@/contract'

export const homeController = HttpApiBuilder.group(Api, 'home', (handlers) =>
  handlers.handle('index', () =>
    Effect.succeed({
      message: 'Welcome to the Effect + Drizzle + D1 + Cloudflare Workers API!',
    })
  )
)
