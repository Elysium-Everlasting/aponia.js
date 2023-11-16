/**
 * An auth page / endpoint that a provider manages.
 */
export interface PageEndpoint {
  /**
   * The route (url pathname) to the page.
   */
  route: string

  /**
   * The accepted HTTP methods for the page.
   */
  methods: string[]

  /**
   * The redirect url after visiting the page.
   */
  redirect?: string
}

/**
 * Pages handled by providers.
 */
export type ProviderPages = {
  /**
   * The provider's login page.
   */
  login: PageEndpoint

  /**
   * The provider's callback page. Mostly applicable for OAuth providers.
   */
  callback: PageEndpoint
}
