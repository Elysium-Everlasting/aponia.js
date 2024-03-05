import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'drizzle',
  password: 'root',
})

export const db = drizzle(connection)
