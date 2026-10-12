import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/infrastructure/persistence/drizzle/schema.ts',
  out: './migrations',
})
