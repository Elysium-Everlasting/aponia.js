import { createId } from '@paralleldrive/cuid2'
import type { InferSelectModel } from 'drizzle-orm'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const user = sqliteTable('user', {
  id: text('id').primaryKey().$defaultFn(createId),

  name: text('name'),
})

export type User = InferSelectModel<typeof user>
