// @ts-check

/**
 * @type { import("drizzle-kit").Config }
 */
const config = {
  driver: 'better-sqlite',
  schema: './src/db/schema/',
  dbCredentials: {
    url: 'sqlite.db',
  },
}

export default config
