import * as Effect from 'effect/Effect'
import * as Schema from 'effect/Schema'

export class PostNotFound extends Schema.Error<PostNotFound>('PostNotFound')(
  {
    status: Schema.Literal(404).pipe(
      Schema.withConstructorDefault(Effect.succeed(404))
    ),
    message: Schema.String.pipe(
      Schema.withConstructorDefault(Effect.succeed('Post not found'))
    ),
  },
  { httpApiStatus: 404 }
) {}
