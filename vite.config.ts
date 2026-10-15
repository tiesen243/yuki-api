import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite-plus'

import fmt from './oxfmt.config'
import lint from './oxlint.config'

export default defineConfig({
  plugins: [cloudflare() as never],
  resolve: { tsconfigPaths: true },
  fmt,
  lint,
})
