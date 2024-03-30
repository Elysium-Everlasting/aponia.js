// @ts-check

/**
 * @type { import("drizzle-kit").Config }
 */
const config = {
  driver: 'mysql2',
  schema: './src/db/schema/',
  dbCredentials: {
    uri: 'mysql://root:root@localhost:3306/drizzle',
  },
}

export default config
