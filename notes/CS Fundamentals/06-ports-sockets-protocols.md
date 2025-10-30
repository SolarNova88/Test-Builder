# Ports / Sockets / Protocols

## What They Are (Simple Terms)

Think of a computer like an apartment building:

- **Protocol** = The language people speak (English, Spanish, etc.)
  - Computers need to agree on a "language" (protocol) to understand each other
- **Port** = The apartment number (80, 443, 22, etc.)
  - Different services live in different "apartments" (ports)
  - Web traffic goes to port 80, secure web to 443, SSH to 22
- **Socket** = The actual door you knock on (`192.168.1.10:443`)
  - It's the combination of the building address (IP) + apartment number (port) + language (protocol)

## Why This Matters

- **Security**: Firewalls can block specific ports, protecting services
- **Organization**: Multiple services can run on one machine (web server on 80, database on 5432, SSH on 22)
- **Debugging**: When something doesn't work, check if the port is open and listening
- **Networking**: Understanding ports helps you configure routers, load balancers, and firewalls

## Real-World Example

When you visit `https://github.com`:
1. Your browser (client) wants to talk to GitHub's server
2. It uses the **HTTPS protocol** (secure version of HTTP)
3. It connects to **port 443** (standard HTTPS port)
4. The **socket** is `github.com:443` (IP address + port)
5. GitHub's web server listens on port 443 and responds

If GitHub's server wasn't listening on port 443, your browser couldn't connect, even though the server is running.

## Protocols

**Protocol** = The rules for how data is transmitted

- **HTTP/HTTPS** (app layer): web APIs and pages
  - HTTP = regular web traffic (port 80)
  - HTTPS = encrypted web traffic (port 443)
- **TCP** (transport): reliable, ordered, connection-oriented
  - Like registered mail: guaranteed delivery, in order
  - Used by HTTP, databases, most web services
- **UDP** (transport): connectionless, low latency, no ordering/ack
  - Like shouting across a room: fast, but no guarantee they heard you
  - Used by video streaming, DNS, online games

**Why different protocols?** 
- **TCP** when you need reliability (web pages, API calls)
- **UDP** when you need speed (live video, real-time games)

## Ports

**Port** = A numbered channel where services listen

- Well-known ports: 80 (HTTP), 443 (HTTPS), 22 (SSH), 5432 (Postgres), 6379 (Redis)
- Services listen on ports; firewalls may restrict exposure

**Common ports you'll encounter**:
- **22**: SSH (remote server access)
- **80**: HTTP (web)
- **443**: HTTPS (secure web)
- **3306**: MySQL database
- **5432**: PostgreSQL database
- **8080**: Often used for development web servers
- **3000**: Common for Node.js development servers

**Why ports matter**: A single computer can run multiple services because each listens on a different port. Your laptop might have:
- A web server on port 3000
- A database on port 5432
- An SSH server on port 22

All running simultaneously on the same machine!

## Sockets

**Socket** = The complete connection endpoint

- A socket identifies a communication endpoint: `IP : Port` (+ protocol)
- Client connects to server's listening socket; kernel hands off to a new socket per connection (TCP)

**Example**: `192.168.1.10:443` (TCP) means:
- IP address: 192.168.1.10
- Port: 443
- Protocol: TCP

When you connect, the server creates a NEW socket for your connection, so multiple clients can connect simultaneously.

## Common Pitfalls

- **Port conflicts**: Trying to run two services on the same port (one will fail)
- **Firewall blocking**: Port is open on your machine but blocked by firewall
- **Wrong port**: Connecting to port 80 when service runs on 8080
- **Security**: Exposing database ports (5432, 3306) to the internet (should only be accessible internally)

## Practical Tips

- Check listeners: `lsof -i :8080` to see what's using port 8080
- Test reachability: `nc -zv host 5432` to check if you can connect to a port
- Diagnose TLS: `openssl s_client -connect host:443 -servername host` to debug HTTPS issues
- Find what's using a port: `netstat -an | grep 8080` or `lsof -i :8080`

## How They Work Together

1. **Protocol** defines the rules: "We'll speak HTTP"
2. **Port** defines where: "I'm listening on port 80"
3. **Socket** connects them: Client connects to `192.168.1.10:80` using HTTP protocol
4. Server receives the connection and processes the HTTP request

**In one sentence**: Protocols define the rules, ports identify the service, and sockets tie the IP + port + protocol together to establish a connection.
