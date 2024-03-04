// @ts-check

/**
 * @type { import("drizzle-kit").Config }
 */
const config = {
  schema: './src/db/schema.ts',
  driver: 'mysql2',
  dbCredentials: {
    host: 'localhost',
    user: 'root',
    database: 'test',
    password: 'root',
  },
}

export default config
