import { createId } from '@paralleldrive/cuid2'
import { mysqlTable, text, varchar } from 'drizzle-orm/mysql-core'

export const user = mysqlTable('user', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(createId),

  name: text('name'),
})
