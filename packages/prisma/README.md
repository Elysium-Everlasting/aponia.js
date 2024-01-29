Implementation needs these methods defined by the user.

9 methods minimum!

1. Find account.
2. Get user from account.
3. Find user.
4. Create user.
5. Find user accounts.
6. Create account.
7. Link account.
8. Create session.
9. Encode session.
10. Handle duplicate account
11. Handle unlinked account

4 optional methods for enabling refresh.

1. Get session from request.
2. Refresh session.
3. Get refresh from request.
4. Encode refresh.
5. Decode refresh.
6. Renew session.

Methods you implement yourself.
1. Decode session - parsing the session data from a string retrieved from a cookie or header.
2. Invalidate session - logging out.
