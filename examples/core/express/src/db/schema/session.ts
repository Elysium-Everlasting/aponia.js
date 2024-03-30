import { createId } from '@paralleldrive/cuid2'
import { sql, type InferSelectModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { user } from './user'

export const session = sqliteTable('session', {
  id: text('id').primaryKey().$defaultFn(createId),

  userId: text('user_id')
    .references(() => user.id)
    .notNull(),

  expires: integer('expires').default(sql`CURRENT_TIMESTAMP`),

  status: text('status').default('active'),

  refreshToken: text('id').primaryKey().$defaultFn(createId),
})

export type Session = InferSelectModel<typeof session>
