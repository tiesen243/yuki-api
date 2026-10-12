import * as D1Client from '@effect/sql-d1/D1Client'
import { env } from 'cloudflare:workers'
import * as D1Drizzle from 'drizzle-orm/effect-d1'
import * as Context from 'effect/Context'
import * as Effect from 'effect/Effect'
import * as Layer from 'effect/Layer'

const D1ClientLayer = D1Client.layer({ db: env.DB })

export class DrizzleClient extends Context.Service<
  DrizzleClient,
  D1Drizzle.EffectSQLiteD1Database
>()('DrizzleClient', {
  make: D1Drizzle.make({}).pipe(Effect.provide(D1Drizzle.DefaultServices)),
}) {
  public static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(D1ClientLayer)
  )
}
