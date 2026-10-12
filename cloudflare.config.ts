import { bindings, defineConfig, exports } from 'cf/config'

import * as entrypoint from './src/index.ts' with { type: 'cf-worker' }

export default defineConfig({
  worker: {
    name: 'yuki-api',
    compatibilityDate: '2026-09-28',
    entrypoint,
    env: {
      DB: bindings.d1({ name: 'yuki-db' }),
      Stream: bindings.durableObject({
        exportName: 'StreamDurableObject',
        worker: 'yuki-api',
      }),
    },
    exports: {
      StreamDurableObject: exports.durableObject({ storage: 'sqlite' }),
    },
  },
})
