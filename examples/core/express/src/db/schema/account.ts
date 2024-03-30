import { mysqlTable, varchar } from 'drizzle-orm/mysql-core'

import { user } from './user'

export const account = mysqlTable('account', {
  userId: varchar('user_id', { length: 128 })
    .primaryKey()
    .references(() => user.id),

  providerId: varchar('provider_id', { length: 128 }).primaryKey(),

  providerType: varchar('provider_type', { length: 128 }),

  providerAccountId: varchar('provider_account_id', { length: 128 }),
})
