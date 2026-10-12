// oxlint-disable max-classes-per-file

import * as HttpApi from 'effect/http-api/HttpApi'
import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint'
import * as HttpApiGroup from 'effect/http-api/HttpApiGroup'
import * as Schema from 'effect/Schema'

import { Post, PostId } from '@/domain/post.entity'
import { PostNotFound } from '@/domain/post.error'

class HomeApi extends HttpApiGroup.make('home').add(
  HttpApiEndpoint.get('index', '/', {
    success: Schema.Struct({
      message: Schema.String,
    }),
  })
) {}

class PostApi extends HttpApiGroup.make('post')
  .add(
    HttpApiEndpoint.get('list', '/', {
      success: Schema.Struct({
        posts: Schema.Array(Post),
      }),
    })
  )

  .add(
    HttpApiEndpoint.get('get', '/:id', {
      params: Schema.Struct({
        id: PostId,
      }),
      success: Post,
      error: PostNotFound,
    })
  )

  .add(
    HttpApiEndpoint.post('create', '/', {
      payload: Schema.Struct({
        title: Schema.String,
        content: Schema.String,
      }),
      success: Post,
    })
  )

  .prefix('/api/posts') {}

export class Api extends HttpApi.make('api').add(HomeApi).add(PostApi) {}
