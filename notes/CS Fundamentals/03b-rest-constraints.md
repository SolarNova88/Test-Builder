# REST Constraints

## What They Are (Simple Terms)

REST has 6 "rules" that make APIs better:
1. **Client-Server**: Frontend and backend are separate (can evolve independently)
2. **Stateless**: Each request stands alone (like ordering at a counter, not a restaurant table)
3. **Cacheable**: Responses can be stored/reused (like caching web pages)
4. **Uniform Interface**: Everyone uses the same format (like everyone speaking English)
5. **Layered System**: You can put things between client and server (like proxies, CDNs)
6. **Code on Demand**: Server can send code to run (like sending JavaScript)

## Why This Matters

Following these rules makes your API:
- **Scalable**: Easy to add more servers (stateless)
- **Reliable**: Caching makes it faster
- **Maintainable**: Consistent interface makes it easier to understand
- **Flexible**: Can add layers (proxies, load balancers) without changing code

## Detailed Explanations

1) **Client–Server**: separation of concerns; clients aren't tied to server storage/UI
   - **What it means**: Frontend (client) and backend (server) are separate
   - **Why it matters**: You can change the backend without changing the frontend (and vice versa)
   - **Example**: Switch from React to Vue without changing the API

2) **Stateless**: no client context stored on server; each request is self-contained
   - **What it means**: Server doesn't remember previous requests
   - **Why it matters**: Makes it easy to scale (any server can handle any request)
   - **Example**: Instead of "user logged in" state, send auth token with every request

3) **Cacheable**: responses declare cacheability to improve performance (ETag, Cache-Control)
   - **What it means**: Responses can say "this is valid for 1 hour, cache it"
   - **Why it matters**: Faster responses (don't hit server if data hasn't changed)
   - **Example**: User list might be cached for 5 minutes

4) **Uniform Interface**: consistent resource identification, representations, HATEOAS optional
   - **What it means**: All APIs work the same way (GET, POST, PUT, DELETE)
   - **Why it matters**: Once you learn REST, you understand most APIs
   - **Example**: `/users/{id}` works the same way in every REST API

5) **Layered System**: intermediaries (proxies, gateways, CDNs) can sit between client and server
   - **What it means**: You can put things in between (load balancer, cache, firewall)
   - **Why it matters**: Can optimize performance without changing code
   - **Example**: CDN caches images, reducing load on server

6) **Code on Demand (optional)**: server can send executable code (e.g., JS) to extend client behavior
   - **What it means**: Server can send JavaScript to run in browser
   - **Why it matters**: Can add features without redeploying app
   - **Example**: Rarely used, mostly theoretical

## Implications

- Horizontal scalability (statelessness)
  - **What it means**: Can add more servers easily (no shared state)
  - **Example**: Instagram has thousands of servers, all serving the same API
  
- Evolvability and portability (uniform interface)
  - **What it means**: APIs can evolve without breaking clients
  - **Example**: Can add new fields to response without breaking old clients
  
- Performance (caching and layering)
  - **What it means**: Caching and CDNs make APIs faster
  - **Example**: CDN caches static assets, reducing server load

## Common Mistakes

- **Storing session state**: Violates stateless (should use tokens instead)
- **Not using proper status codes**: Makes it hard to cache (can't tell if request failed)
- **Inconsistent URLs**: Breaks uniform interface (`/users` vs `/getUsers`)
- **No caching headers**: Misses performance benefits
