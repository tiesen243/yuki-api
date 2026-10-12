import { sql } from 'drizzle-orm'
import { snakeCase } from 'drizzle-orm/sqlite-core'

import type { PostId } from '@/domain/post.entity'

export const posts = snakeCase.table('posts', (t) => ({
  id: t.integer().primaryKey({ autoIncrement: true }).$type<PostId>(),

  title: t.text().notNull(),
  content: t.text().notNull(),

  createdAt: t
    .integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: t
    .integer({ mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => sql`(unixepoch())`),
}))
