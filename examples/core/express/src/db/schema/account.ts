import type { InferSelectModel } from 'drizzle-orm'
import { primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { user } from './user'

export const account = sqliteTable(
  'account',
  {
    userId: text('user_id')
      .references(() => user.id)
      .notNull(),

    providerId: text('provider_id').notNull(),

    providerAccountId: text('provider_account_id').notNull(),

    providerType: text('provider_type'),
  },
  (table) => {
    return {
      primaryKey: primaryKey({
        columns: [table.userId, table.providerId, table.providerAccountId],
      }),
    }
  },
)

export type Account = InferSelectModel<typeof account>
