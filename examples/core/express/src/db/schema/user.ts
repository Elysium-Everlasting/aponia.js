import { mysqlTable, text, varchar } from 'drizzle-orm/mysql-core'

export const user = mysqlTable('user', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: text('name'),
})

