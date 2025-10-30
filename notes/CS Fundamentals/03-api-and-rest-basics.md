# API and REST Basics

## What They Are (Simple Terms)

**API** = A menu at a restaurant
- It tells you what you can order (endpoints)
- How to order it (methods: GET, POST, etc.)
- What you'll get back (response format)

**REST** = A way of organizing that menu
- Uses standard verbs (GET, POST, PUT, DELETE) that everyone understands
- Organizes things by "resources" (like `/users` or `/products`)
- Makes APIs predictable and easy to use

## Why This Matters

- **Consistency**: Everyone uses the same pattern, so once you learn it, you understand most APIs
- **Scalability**: REST principles make systems easier to scale and cache
- **Developer experience**: Other developers can quickly understand your API
- **Future-proofing**: REST APIs are easier to evolve and change over time

## Real-World Example

Instead of having random endpoints like:
- `/getUser?id=123`
- `/createUser`
- `/updateUser`
- `/deleteUser?id=123`

REST organizes them as:
- `GET /users/123` (get user)
- `POST /users` (create user)
- `PUT /users/123` (update user)
- `DELETE /users/123` (delete user)

Notice how they all start with `/users`? That's the "resource" (thing you're working with).

## API

An Application Programming Interface defines how software systems communicate: inputs, outputs, contracts, and error semantics.

**Think of it as a contract**: "If you send me this format, I'll send you back that format."

## REST (Representational State Transfer)

- Architectural style leveraging HTTP's semantics
- Resources identified by URLs; representations (JSON) transfer resource state
- Stateless interactions; cache-friendly; uniform interface

Common resource endpoints:

- `/users` (collection - all users)
- `/users/{id}` (item - one specific user)
- `/users/{id}/posts` (sub-resource - posts belonging to a user)

## HTTP ↔ CRUD Mapping

**CRUD** = Create, Read, Update, Delete (the four basic database operations)

REST maps these to HTTP verbs:

- **GET** → Read (safe, idempotent) - "Show me"
- **POST** → Create (non-idempotent) - "Make a new one"
- **PUT** → Full update/replace (idempotent) - "Replace this entire thing"
- **PATCH** → Partial update (idempotent by effect) - "Change just this part"
- **DELETE** → Remove (idempotent) - "Delete this"

**Example workflow**:
1. `GET /users` - See all users
2. `POST /users` - Create a new user
3. `GET /users/5` - See user #5
4. `PATCH /users/5` - Update user #5's email
5. `DELETE /users/5` - Delete user #5

## Why REST Over Alternatives?

**REST is simple and universal**: Almost every programming language has HTTP libraries, and REST APIs work the same everywhere.

**Other options exist for special cases**:
- **GraphQL**: When you need flexibility in what data to fetch (avoid fetching too much or too little)
- **gRPC**: When you need extreme performance (internal microservices)
- **SOAP**: Old XML-based protocol (mostly legacy systems)

For most web APIs, REST is the sweet spot of simplicity and power.

## Contracts & Versioning

- Use clear request/response schemas (OpenAPI/Swagger)
- Prefer backward-compatible changes; version via `/v1` or Accept headers

**Why versioning matters**: When you change your API, old clients might break. Versioning lets you:
- Keep old API working for existing apps (`/v1/users`)
- Create new API for new apps (`/v2/users`)

## Alternatives & Complements

- **GraphQL**: single endpoint; client specifies fields; avoids over/under-fetch
- **gRPC**: HTTP/2 + Protocol Buffers; high performance RPC; strong typing
- **OData**: REST extension with query conventions (`$filter`, `$select`)
- **JSON:API/HAL/HATEOAS**: conventions for linking, pagination, and metadata

## Common Mistakes

- **Not following REST patterns**: Using `/getUser` instead of `GET /users/{id}`
- **Using wrong HTTP methods**: Using GET to create something (GET should never change data)
- **Not returning proper status codes**: Always return 201 for created, 404 for not found, etc.
- **Not versioning**: Breaking existing clients when you update the API

## Best Practices

- Consistent naming and status codes; meaningful error bodies
- Pagination, filtering, sorting; rate limits; idempotency keys for POST when needed
- AuthN/AuthZ at the edge; audit logs; correlation IDs
