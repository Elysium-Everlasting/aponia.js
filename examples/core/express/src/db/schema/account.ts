import { mysqlTable, varchar } from 'drizzle-orm/mysql-core'

import { user } from './user'

export const accounts = mysqlTable('account', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 })
    .notNull()
    .references(() => user.id),
  providerId: varchar('provider_id', { length: 255 }),
})
