model Account {
  id String  @id @default(cuid()) Uniquely identifies an account. REQUIRED.
  userId String Associates the account with a user. REQUIRED.
  provider String ID of the provider that's responsible for the account. e.g. "Google", "GitHub", Credentials", etc. REQUIRED.
  providerAccountId  String ID used by the provider to identify the account. REQUIRED

  type String A terse description of the kind of account. e.g. Credentials (username/password), Email, OAuth, OIDC. OPTIONAL.

  -- EVERYTHING BELOW THIS LINE IS SUPERFLUOUS --

  I'm pretty sure these basically only exist depending on the provider.
  For example, Google will provide you all three when you go through the full login cycle.
  However, you don't need to preserve this data.

  refresh_token String?  @db.Text
  access_token       String?  @db.Text
  id_token           String?  @db.Text

  -- I think these are describing the access token, which isn't required.
  expires_at         Int?
  token_type         String?

  -- I'm not sure why this is stored.
  scope              String?

  -- I'm not sure why this is stored.
  session_state      String?
}


In order to be logged in, a user must have a valid session.
A valid session can be obtained by logging in with an account.
The verification will be done by the account's designated provider.


A user is logged in if they provide a session token that's associated with their user ID and isn't expired.
model Session {
  id String @id @default(cuid()) Uniquely identifies the session ID. REQUIRED.

  sessionToken String @unique
  A session token that's used to uniquely identify the session.
  I guess technically this isn't required, since the ID uniquely identifies it.
  But ChatGPT mentions the concept of "identifier and token separation" that's
  presumably applicable. So we'll just keep them separate :shrug:

  Oh, but ZotMeet doesn't have it. Ok so we won't do it.

  userId String Associates the session with a user, allowing them to login. REQUIRED

  expires DateTime Indicates when the session is no longer valid. The user must create a new session in order to login.
}

model User {
  id String @id @default(cuid())
  name String? Descriptive info about the user. OPTIONAL.
  image String? Descriptive info about the user. OPTIONAL.
}

# Notes
User is the smallest atomic unit.
Each registered person will be associated with exactly one user entry.

Users can make multiple accounts.
For instance, a user can login with Google and with GitHub.
They have one user entry, but multiple account entries.

Users can login multiple times, each time is recorded by a session.


## Refresh Tokens
The default strategy of refreshing sessions is to send a refresh token to the client to store.
For example, as a cookie accompanying the access token's JWT cookie.
During a request, if the access token is missing or invalid, but a refresh token is available:
the server will decode the refresh token and verify that it hasn't expired.

The strategy is that the act of successfully decoding a refresh token
ensures its validity, so use it to create a new session.
The refresh token should contain the user's ID at the very minimum.
The refresh token is not stored in any database, it is only preserved by the client,
and consumed by the server when needed.
