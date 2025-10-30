# Authentication / Authorization

## What They Are (Simple Terms)

Think of it like a nightclub:

- **Authentication (AuthN)** = Proving who you are (showing your ID at the door)
  - "Are you really Alice?"
  - Username/password, fingerprint, face recognition
- **Authorization (AuthZ)** = Proving what you're allowed to do (VIP area, backstage)
  - "Is Alice allowed to delete users?"
  - Even if you're authenticated, you might not have permission

**Remember**: Authentication is WHO you are, Authorization is WHAT you can do.

## Why This Matters

- **Security**: Only authorized users can access sensitive data
- **User experience**: Users stay logged in (sessions, tokens)
- **Compliance**: Required for GDPR, HIPAA (tracking who accessed what)
- **Multi-user systems**: Different users have different permissions
- **Audit trails**: Who did what, when (for security investigations)

## Real-World Example

**Logging into Gmail**:
1. **AuthN**: Enter email + password → Google verifies you're really you
2. **Token**: Google gives you a session cookie or JWT token
3. **Request**: Every email request includes the token
4. **AuthZ**: Google checks "Can this user read this email?" (you can only read YOUR emails)
5. **Response**: You see your inbox (but not someone else's)

**Admin panel example**:
- **Regular user**: Can view their own data (AuthN: yes, AuthZ: limited)
- **Admin**: Can view/edit all users (AuthN: yes, AuthZ: full access)
- **Not logged in**: Can't access anything (AuthN: no)

## AuthN (Authentication)

**Authentication** = Verifying identity

- Proves identity (passwords, OAuth, SSO, MFA)
  - **Passwords**: Traditional (email + password)
  - **OAuth**: "Sign in with Google" (Google verifies you)
  - **SSO**: Single Sign-On (one login for multiple services)
  - **MFA**: Multi-Factor Auth (password + text code, or fingerprint)
- Sessions (server-stored) vs Tokens (JWT, opaque)
  - **Sessions**: Server stores "User #5 is logged in" (traditional, server-side)
  - **Tokens**: Client holds proof "I'm User #5" (JWT = JSON Web Token, stateless)
- Prefer HTTP-only, Secure cookies for browser tokens; avoid localStorage for JWTs (XSS risk)
  - **HTTP-only cookies**: JavaScript can't access them (protects against XSS attacks)
  - **localStorage**: Vulnerable to XSS (malicious scripts can steal tokens)

**How passwords should work**:
1. User creates password: `"mypassword123"`
2. Server hashes it: `bcrypt("mypassword123")` → `$2a$10$abcd...`
3. Store hash in database (NOT the plain password!)
4. Login: Hash user's input, compare to stored hash
5. If match → authenticated!

**Never store plain passwords** - always hash them (bcrypt, Argon2).

## AuthZ (Authorization)

**Authorization** = What you're allowed to do

- **RBAC**: roles → permissions (admin/editor/viewer)
  - Roles: `admin`, `editor`, `viewer`
  - Permissions: `can_delete_users`, `can_edit_posts`, `can_view_posts`
  - User has role → role has permissions → user has permissions
- **ABAC**: attributes (user, resource, environment, time) → policy decision
  - More flexible: "User can edit post IF they own it AND it's not archived AND it's before deadline"
  - Policy engine decides based on multiple attributes

**RBAC Example**:
```
Role: admin
  Permissions:
    - can_delete_users
    - can_edit_all_posts
    - can_view_logs

Role: editor
  Permissions:
    - can_edit_own_posts
    - can_view_all_posts

Role: viewer
  Permissions:
    - can_view_posts
```

## Flows

**Complete authentication flow**:

1) Login → AuthN verifies credentials
   - User submits email + password
   - Server checks database, verifies password hash
   - If correct → proceed, if wrong → 401 Unauthorized

2) Server issues session cookie or JWT
   - **Session**: Server creates session ID, stores in database, sends cookie
   - **JWT**: Server signs token with secret, sends token (no database lookup needed)

3) Client sends on each request; server validates; AuthZ checks permissions per endpoint
   - Request includes token/cookie
   - Server validates token (checks signature, expiration)
   - Server checks permissions: "Can this user access `/admin/users`?" → No → 403 Forbidden

4) Refresh tokens rotate access tokens securely
   - Access token: Short-lived (15 minutes), used for API calls
   - Refresh token: Long-lived (7 days), used to get new access tokens
   - When access token expires, use refresh token to get a new one

## Security Considerations

- Hash passwords with bcrypt/Argon2 + salt; never store plaintext
  - **Salt**: Random data added before hashing (prevents rainbow table attacks)
  - Example: `hash(password + salt)` instead of `hash(password)`
- CSRF defense (same-site cookies + anti-CSRF tokens)
  - **CSRF**: Attacker tricks you into making requests (e.g., "click here" → deletes your account)
  - **Same-site cookies**: Browser only sends cookie to same domain (protects against CSRF)
  - **CSRF tokens**: Random token in form, server verifies it matches
- Short access-token TTL; revoke refresh tokens; detect anomalies
  - Access tokens expire quickly (if stolen, only valid for 15 minutes)
  - Refresh tokens can be revoked (logout, change password → invalidates all refresh tokens)
  - Detect anomalies: Login from new location? Send email alert

## Common Pitfalls

- **Storing passwords in plaintext**: Biggest security mistake!
- **Not hashing passwords**: Use bcrypt/Argon2, not MD5/SHA1 (those are too fast, vulnerable to brute force)
- **JWTs in localStorage**: Vulnerable to XSS (use HTTP-only cookies)
- **No token expiration**: Stolen token works forever (set expiration!)
- **Authorization logic in frontend only**: Always check permissions on server (client can be modified)
- **Session fixation**: Attacker forces victim to use their session ID (regenerate session on login)

## Best Practices

- **Always hash passwords**: Never store plaintext
- **Use strong hashing**: bcrypt (cost factor 10+), Argon2
- **Short token expiration**: 15 minutes for access tokens
- **Refresh token rotation**: New refresh token every time you use it
- **Same-site cookies**: Protects against CSRF
- **Rate limiting**: Prevent brute force attacks (lock account after 5 failed attempts)
- **Audit logs**: Track who logged in, when, from where
- **MFA for sensitive operations**: Require second factor for admin actions

## Example Implementation

**Login endpoint**:
```javascript
POST /login
{
  "email": "alice@example.com",
  "password": "mypassword"
}

// Server:
1. Find user by email
2. Compare password hash: bcrypt.compare(inputPassword, storedHash)
3. If match:
   - Create JWT token (expires in 15 min)
   - Create refresh token (expires in 7 days)
   - Return both tokens
4. If no match:
   - Return 401 Unauthorized
```

**Protected endpoint**:
```javascript
GET /api/users
Headers: Authorization: Bearer <token>

// Server:
1. Verify JWT token (signature, expiration)
2. Extract user ID from token
3. Check permissions: can user read users?
4. If yes: return users
5. If no: return 403 Forbidden
```
