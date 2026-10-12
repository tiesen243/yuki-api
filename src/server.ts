import * as HttpApiBuilder from 'effect/http-api/HttpApiBuilder'
import * as HttpApiScalar from 'effect/http-api/HttpApiScalar'
import * as OpenApi from 'effect/http-api/OpenApi'
import * as Layer from 'effect/Layer'

import { Api } from '@/contract'
import { homeController } from '@/presentation/http/home.controller'
import { postController } from '@/presentation/http/post.controller'

import pkg from '../package.json' with { type: 'json' }

const ApiRoutes = HttpApiBuilder.layer(Api, {
  openapiPath: '/openapi.json',
}).pipe(Layer.provide([homeController, postController]))

const DocsRoutes = HttpApiScalar.layer(
  Api.annotateMerge(
    OpenApi.annotations({ title: pkg.name, version: pkg.version })
  ),
  { path: '/docs', scalar: { theme: 'kepler' } }
)

export const Routes = Layer.merge(ApiRoutes, DocsRoutes)
