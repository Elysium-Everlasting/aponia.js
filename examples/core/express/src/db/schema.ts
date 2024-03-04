import { int, text, mysqlSchema } from 'drizzle-orm/mysql-core'

export const schema = mysqlSchema('my_schema')

export const users = schema.table('users', {
  id: int('id').primaryKey().autoincrement(),
  name: text('name'),
})
