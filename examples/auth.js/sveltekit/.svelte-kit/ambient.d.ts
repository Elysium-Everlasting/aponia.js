// this file is generated — do not edit it

/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 *
 * _Unlike_ [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 *
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 *
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 *
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 *
 * You can override `.env` values from the command line like so:
 *
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
  export const SHELL: string
  export const npm_command: string
  export const LESS: string
  export const WSL2_GUI_APPS_ENABLED: string
  export const FNM_ARCH: string
  export const CONFIG_PROTECT_MASK: string
  export const WSL_DISTRO_NAME: string
  export const NODE: string
  export const npm_package_devDependencies__sveltejs_adapter_node: string
  export const SSH_AUTH_SOCK: string
  export const npm_package_private: string
  export const FNM_NODE_DIST_MIRROR: string
  export const npm_package_dependencies_better_sqlite3: string
  export const npm_package_devDependencies_drizzle_kit: string
  export const EDITOR: string
  export const NAME: string
  export const NPIPERELAY: string
  export const PWD: string
  export const CONFIG_PROTECT: string
  export const npm_package_devDependencies_vite: string
  export const LOGNAME: string
  export const npm_package_dependencies_drizzle_orm: string
  export const MANPATH: string
  export const npm_package_dependencies__auth_core: string
  export const npm_package_devDependencies_rimraf: string
  export const HOME: string
  export const LANG: string
  export const WSL_INTEROP: string
  export const FNM_COREPACK_ENABLED: string
  export const npm_package_devDependencies_typescript: string
  export const LS_COLORS: string
  export const npm_package_version: string
  export const STARSHIP_SHELL: string
  export const WAYLAND_DISPLAY: string
  export const npm_package_dependencies_express: string
  export const APPDATA: string
  export const INIT_CWD: string
  export const STARSHIP_SESSION_KEY: string
  export const INFOPATH: string
  export const npm_lifecycle_script: string
  export const npm_package_description: string
  export const npm_package_devDependencies__sveltejs_vite_plugin_svelte: string
  export const TERM: string
  export const npm_package_name: string
  export const npm_package_dependencies__aponia_js_core: string
  export const LESSOPEN: string
  export const npm_package_type: string
  export const USER: string
  export const npm_config_frozen_lockfile: string
  export const MANPAGER: string
  export const DISPLAY: string
  export const npm_lifecycle_event: string
  export const SHLVL: string
  export const WSL_GUEST_IP: string
  export const PAGER: string
  export const LEX: string
  export const FNM_VERSION_FILE_STRATEGY: string
  export const npm_config_user_agent: string
  export const PNPM_SCRIPT_SRC_DIR: string
  export const npm_execpath: string
  export const npm_package_devDependencies_svelte: string
  export const LC_CTYPE: string
  export const XDG_RUNTIME_DIR: string
  export const GCC_SPECS: string
  export const FNM_RESOLVE_ENGINES: string
  export const NODE_PATH: string
  export const WSLENV: string
  export const BUN_INSTALL: string
  export const npm_package_scripts_dev: string
  export const PATH: string
  export const npm_config_node_gyp: string
  export const npm_package_scripts_db_push: string
  export const npm_package_devDependencies__sveltejs_kit: string
  export const npm_package_scripts_postinstall: string
  export const WSL_HOST_IP: string
  export const npm_package_devDependencies__types_better_sqlite3: string
  export const npm_config_registry: string
  export const HOSTTYPE: string
  export const FNM_DIR: string
  export const FNM_MULTISHELL_PATH: string
  export const npm_package_dependencies__paralleldrive_cuid2: string
  export const PULSE_SERVER: string
  export const npm_package_dependencies__aponia_js_auth_js: string
  export const npm_node_execpath: string
  export const npm_config_engine_strict: string
  export const FNM_LOGLEVEL: string
  export const OLDPWD: string
  export const NODE_ENV: string
}

/**
 * Similar to [`$env/static/private`](https://kit.svelte.dev/docs/modules#$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 *
 * Values are replaced statically at build time.
 *
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://kit.svelte.dev/docs/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://kit.svelte.dev/docs/configuration#env) (if configured).
 *
 * This module cannot be imported into client-side code.
 *
 * Dynamic environment variables cannot be used during prerendering.
 *
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 *
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
  export const env: {
    SHELL: string
    npm_command: string
    LESS: string
    WSL2_GUI_APPS_ENABLED: string
    FNM_ARCH: string
    CONFIG_PROTECT_MASK: string
    WSL_DISTRO_NAME: string
    NODE: string
    npm_package_devDependencies__sveltejs_adapter_node: string
    SSH_AUTH_SOCK: string
    npm_package_private: string
    FNM_NODE_DIST_MIRROR: string
    npm_package_dependencies_better_sqlite3: string
    npm_package_devDependencies_drizzle_kit: string
    EDITOR: string
    NAME: string
    NPIPERELAY: string
    PWD: string
    CONFIG_PROTECT: string
    npm_package_devDependencies_vite: string
    LOGNAME: string
    npm_package_dependencies_drizzle_orm: string
    MANPATH: string
    npm_package_dependencies__auth_core: string
    npm_package_devDependencies_rimraf: string
    HOME: string
    LANG: string
    WSL_INTEROP: string
    FNM_COREPACK_ENABLED: string
    npm_package_devDependencies_typescript: string
    LS_COLORS: string
    npm_package_version: string
    STARSHIP_SHELL: string
    WAYLAND_DISPLAY: string
    npm_package_dependencies_express: string
    APPDATA: string
    INIT_CWD: string
    STARSHIP_SESSION_KEY: string
    INFOPATH: string
    npm_lifecycle_script: string
    npm_package_description: string
    npm_package_devDependencies__sveltejs_vite_plugin_svelte: string
    TERM: string
    npm_package_name: string
    npm_package_dependencies__aponia_js_core: string
    LESSOPEN: string
    npm_package_type: string
    USER: string
    npm_config_frozen_lockfile: string
    MANPAGER: string
    DISPLAY: string
    npm_lifecycle_event: string
    SHLVL: string
    WSL_GUEST_IP: string
    PAGER: string
    LEX: string
    FNM_VERSION_FILE_STRATEGY: string
    npm_config_user_agent: string
    PNPM_SCRIPT_SRC_DIR: string
    npm_execpath: string
    npm_package_devDependencies_svelte: string
    LC_CTYPE: string
    XDG_RUNTIME_DIR: string
    GCC_SPECS: string
    FNM_RESOLVE_ENGINES: string
    NODE_PATH: string
    WSLENV: string
    BUN_INSTALL: string
    npm_package_scripts_dev: string
    PATH: string
    npm_config_node_gyp: string
    npm_package_scripts_db_push: string
    npm_package_devDependencies__sveltejs_kit: string
    npm_package_scripts_postinstall: string
    WSL_HOST_IP: string
    npm_package_devDependencies__types_better_sqlite3: string
    npm_config_registry: string
    HOSTTYPE: string
    FNM_DIR: string
    FNM_MULTISHELL_PATH: string
    npm_package_dependencies__paralleldrive_cuid2: string
    PULSE_SERVER: string
    npm_package_dependencies__aponia_js_auth_js: string
    npm_node_execpath: string
    npm_config_engine_strict: string
    FNM_LOGLEVEL: string
    OLDPWD: string
    NODE_ENV: string
    [key: `PUBLIC_${string}`]: undefined
    [key: `${string}`]: string | undefined
  }
}

/**
 * Similar to [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 *
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 *
 * Dynamic environment variables cannot be used during prerendering.
 *
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
  export const env: {
    [key: `PUBLIC_${string}`]: string | undefined
  }
}
