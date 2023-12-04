import type { User } from '@auth/core/types'

declare module '@auth/core/providers/oauth' {
  interface OAuth2Config<Profile> {
    /**
     * 1. Attempt to find a duplicate account.
     */
    findDuplicateAccount?: (profile: Profile) => boolean | PromiseLike<boolean>

    /**
     * 2. If no duplicate account, attempt to find the user associated with the profile.
     *
     * @returns The user if they exist.
     *
     * This user is passed to the session controller to create a session.
     */
    findUser?: (profile: Profile) => User | PromiseLike<User>

    /**
     * 3. If no user, attempt to create the user.
     *
     * @returns The newly created user.
     *
     * This user is passed to the session controller to create a session.
     */
    createUser?: (profile: Profile) => User | PromiseLike<User>
  }
}
