# Proxy / Gateway / Router

## What They Are (Simple Terms)

Think of them like mail delivery:

- **Proxy** = Mail forwarding service
  - Receives mail, forwards it to the right place
  - Can also cache mail (keep copies for faster delivery)
  
- **Reverse Proxy** = Receptionist at a company
  - Receives all mail for the company
  - Forwards to the right department internally
  - Protects internal departments from external access
  
- **API Gateway** = Smart receptionist
  - Receives all API requests
  - Routes to correct service (Auth Service, Task Service, etc.)
  - Also handles security, rate limiting, logging
  
- **Gateway** = Translation service
  - Connects different systems that speak different languages
  - Example: Translates between your network and the internet
  
- **Router** = Postal system
  - Directs mail based on addresses (IP addresses)
  - Finds the best path for packets to reach their destination

## Why This Matters

- **Security**: Hide internal services from the internet (reverse proxy)
- **Performance**: Cache responses, reduce server load
- **Organization**: One entry point for all requests (gateway)
- **Scalability**: Route traffic to multiple servers (load balancing)
- **Reliability**: If one server fails, route to another

## Real-World Example

**Accessing Instagram**:

1. Your browser → **Router** (your home router) → Internet
2. Internet → **API Gateway** (Instagram's gateway) receives request
3. **API Gateway** checks authentication, rate limiting, routes to correct service
4. Request goes to **Auth Service** or **Feed Service** or **Photo Service**
5. Response comes back through gateway → router → your browser

**If you use a VPN**:
- Your request → **Proxy** (VPN server) → Internet
- Proxy forwards your request, hides your real IP address

## Proxy

**Proxy** = Intermediary that forwards requests

- Acts as middleman between client and server
- Can cache responses (store copies for faster delivery)
- Can filter content (block certain sites)
- Can provide anonymity (hide client's IP address)

**Forward Proxy** (client-side):
- Client → Proxy → Internet
- Used by: VPNs, corporate firewalls

**Reverse Proxy** (server-side):
- Internet → Proxy → Internal servers
- Used by: Load balancers, CDNs, API gateways

**Why proxies matter**:
- **Performance**: Cache responses (don't hit server if data is cached)
- **Security**: Hide internal servers from internet
- **Load balancing**: Distribute traffic across multiple servers
- **SSL termination**: Handle HTTPS, forward HTTP internally (faster)

**Common proxies**:
- **NGINX**: Popular reverse proxy and web server
- **HAProxy**: Load balancer and proxy
- **CloudFlare**: CDN and proxy service

## Gateway

**Gateway** = Connects different networks/systems

- Connects networks with different protocols
- Example: Connects your home network (LAN) to the internet (WAN)

**API Gateway** = Special gateway for APIs

- Receives all API requests
- Routes to correct microservice
- Handles: Authentication, rate limiting, logging, monitoring
- Single entry point for all API traffic

**Why gateways matter**:
- **Single entry point**: All requests go through one place
- **Security**: Centralized authentication/authorization
- **Monitoring**: See all API traffic in one place
- **Versioning**: Route `/v1/*` to old version, `/v2/*` to new version

**Example API Gateway**:
```
Client → API Gateway → {
  /auth/* → Auth Service
  /users/* → User Service
  /tasks/* → Task Service
}
```

**Common gateways**:
- **AWS API Gateway**: Managed gateway service
- **Kong**: Open-source API gateway
- **NGINX**: Can also act as API gateway

## Router

**Router** = Directs network traffic based on IP addresses

- Reads IP addresses and finds best path
- Example: Home router connects your devices to the internet
- Uses routing tables (like a map) to find paths

**Why routers matter**:
- **Network connectivity**: Devices can talk to each other and internet
- **Traffic management**: Route packets efficiently
- **Security**: Firewall rules, port forwarding

**How routers work**:
1. Receives packet with destination IP
2. Looks up routing table (which path is fastest?)
3. Forwards packet along that path

**Example**: Your computer (192.168.1.10) wants to reach Google (172.217.1.1)
- Router checks routing table
- Finds path: Your network → ISP → Internet → Google
- Forwards packet

## Common Pitfalls

- **Misconfigured proxy**: Blocking legitimate traffic
- **Gateway as single point of failure**: If gateway goes down, everything breaks (need redundancy)
- **Not caching**: Missing performance benefits of caching
- **Router firewall too strict**: Blocking necessary traffic
- **No load balancing**: All traffic to one server (overloads it)

## Best Practices

**Proxy**:
- Cache static assets (images, CSS, JS)
- Use reverse proxy to hide internal services
- Monitor cache hit rates (how often cache is used)

**Gateway**:
- Centralize authentication/authorization
- Rate limit per user/IP
- Log all requests for debugging
- Version APIs (`/v1/`, `/v2/`)

**Router**:
- Keep firmware updated (security patches)
- Configure firewall rules properly
- Use strong passwords (prevent unauthorized access)

## How They Work Together

**Typical setup**:
```
Internet
  ↓
Router (your router or cloud router)
  ↓
Reverse Proxy / Load Balancer (NGINX, HAProxy)
  ↓
API Gateway (routes to services)
  ↓
Services (Auth, Task, Photo, etc.)
  ↓
Databases (PostgreSQL, Redis)
```

Each layer has a purpose:
- **Router**: Gets packets to the right network
- **Reverse Proxy**: Caches, load balances, terminates SSL
- **API Gateway**: Routes to correct service, handles auth
- **Services**: Handle business logic
- **Databases**: Store data
