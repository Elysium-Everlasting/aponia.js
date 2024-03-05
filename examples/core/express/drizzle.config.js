// @ts-check

/**
 * @type { import("drizzle-kit").Config }
 */
const config = {
  schema: './src/db/schema/',
  driver: 'mysql2',
  dbCredentials: {
    uri: 'mysql://root:root@localhost:3306/drizzle',
  },
}

export default config
