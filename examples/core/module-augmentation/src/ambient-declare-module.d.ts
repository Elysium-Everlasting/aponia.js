/**
 * Example of augmenting the core module by targeting the original types file.
 *
 * This file must be an ambient declaration, i.e. NOT a module,
 * so no imports or exports are allowed.
 */

/**
 * The augmented properties can either be used to extend the original interface,
 * or declared in the interface itself.
 */
interface Extension {
  ambient_declare_module: boolean
}

declare global {
  declare module '@aponia.js/core/types' {
    interface AponiaRequest extends Extension { }

    interface AponiaAuthenticatedResponse extends Extension { }

    interface AponiaResponse extends Extension { }

    interface AponiaUser extends Extension { }

    interface AponiaAccount extends Extension { }

    interface AponiaSession extends Extension { }

    interface AponiaRefresh extends Extension { }
  }
}
