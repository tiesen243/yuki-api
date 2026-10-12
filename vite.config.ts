import type { Plugin } from 'vite-plus'

import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite-plus'

import fmt from './oxfmt.config'
import lint from './oxlint.config'

export default defineConfig({
  plugins: [cloudflare() as unknown as Plugin],
  resolve: { tsconfigPaths: true },
  fmt,
  lint,
})
