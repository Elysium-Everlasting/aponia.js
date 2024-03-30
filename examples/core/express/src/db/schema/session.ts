import { createId } from '@paralleldrive/cuid2'
import { sql } from 'drizzle-orm'
import { datetime, mysqlTable, varchar } from 'drizzle-orm/mysql-core'

import { user } from './user'

export const session = mysqlTable('session', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(createId),

  userId: varchar('user_id', { length: 128 }).references(() => user.id),

  expires: datetime('expires').default(sql`CURRENT_TIMESTAMP`),

  status: varchar('status', { length: 128 }).default('active'),

  refreshToken: varchar('id', { length: 128 }).primaryKey().$defaultFn(createId),
})
