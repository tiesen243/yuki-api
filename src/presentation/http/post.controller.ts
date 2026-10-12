import { eq } from 'drizzle-orm'
import * as Effect from 'effect/Effect'
import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder'

import { Api } from '@/contract'
import { Post } from '@/domain/post.entity'
import { PostNotFound } from '@/domain/post.error'
import { DrizzleClient } from '@/infrastructure/persistence/drizzle'
import { posts } from '@/infrastructure/persistence/drizzle/schema'

export const postController = HttpApiBuilder.group(
  Api,
  'post',
  Effect.fn(function* postController(handlers) {
    const db = yield* DrizzleClient

    return handlers
      .handle('list', () =>
        db
          .select()
          .from(posts)
          .pipe(
            Effect.orDie,
            Effect.map((rows) => ({
              posts: rows.map((row) => new Post(row)),
            }))
          )
      )

      .handle('get', ({ params }) =>
        db
          .select()
          .from(posts)
          .where(eq(posts.id, params.id))
          .limit(1)
          .pipe(
            Effect.orDie,
            Effect.flatMap(([row]) =>
              row
                ? Effect.succeed(new Post(row))
                : Effect.fail(new PostNotFound())
            )
          )
      )

      .handle('create', ({ payload }) =>
        db
          .insert(posts)
          .values(payload)
          .returning()
          .pipe(
            Effect.orDie,
            Effect.flatMap(([post]) => {
              if (post) return Effect.succeed(new Post(post))
              return Effect.die('Failed to create post')
            })
          )
      )
  })
)
