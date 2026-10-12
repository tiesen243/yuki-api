import * as Schema from 'effect/Schema'

export const PostId = Schema.Number.pipe(Schema.brand('PostId'))
export type PostId = typeof PostId.Type

export class Post extends Schema.Class<Post>('Post')({
  id: PostId,
  title: Schema.String,
  content: Schema.String,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}) {}
