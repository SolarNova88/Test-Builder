# Databases / Queries / Schemas

## What They Are (Simple Terms)

Think of a database like a filing cabinet:
- **Database** = The entire filing cabinet
- **Table** = A drawer in the cabinet (e.g., "Users" drawer, "Orders" drawer)
- **Row** = One file in the drawer (one user, one order)
- **Column** = A field on the file (name, email, date)
- **Query** = Asking the filing cabinet to find specific files ("Show me all users from New York")
- **Schema** = The layout/organization of the cabinet (what drawers exist, what fields each file has)

## Why This Matters

- **Data persistence**: Data survives server restarts (unlike variables in memory)
- **Efficient search**: Databases are optimized to find data quickly (even millions of records)
- **Data integrity**: Rules prevent bad data (e.g., "email must be unique")
- **Relationships**: Connect related data (users have orders, orders have items)
- **Concurrent access**: Multiple users can read/write simultaneously safely

## Real-World Example

**An e-commerce site**:
- `users` table: Stores customer info (name, email, password hash)
- `products` table: Stores product info (name, price, description)
- `orders` table: Stores orders (user_id, total, date)
- `order_items` table: Links orders to products (order_id, product_id, quantity)

**Query example**: "Show me all orders for user #5"
```sql
SELECT * FROM orders WHERE user_id = 5;
```

## Relational (SQL)

**SQL** = Structured Query Language (the language databases speak)

- Tables (rows/columns), relations (FKs), transactions (ACID)
  - Tables are like spreadsheets with rows (records) and columns (fields)
  - Relations connect tables (foreign keys): `orders.user_id` references `users.id`
  - Transactions ensure "all or nothing" (ACID): if one part fails, everything rolls back
- Normalization vs denormalization trade-offs
  - **Normalized**: Data split across multiple tables (no duplication, but needs JOINs)
  - **Denormalized**: Some duplication for speed (faster reads, but more storage)
- Indexing: B-tree, hash, composite; watch write overhead
  - Indexes = like a book's index: faster to find things, but takes space and slows writes

**Query examples**:

```sql
-- Find users
SELECT * FROM users WHERE email LIKE '%@example.com' LIMIT 50;

-- Create user
INSERT INTO users(name,email) VALUES ('Alice','alice@example.com') RETURNING id;

-- Update user
UPDATE users SET email='a2@example.com' WHERE id=1;

-- Delete user
DELETE FROM users WHERE id=1;
```

**Common SQL databases**: PostgreSQL, MySQL, SQLite, MariaDB

## NoSQL

**NoSQL** = "Not only SQL" - different ways to store data

- Document (MongoDB), Key-Value (Redis), Columnar (Cassandra), Graph (Neo4j)
- Flexible schemas; eventual consistency (BASE) common in distributed systems

**Types**:
1. **Document** (MongoDB): Store JSON-like documents
   - Good for: Flexible structures, rapid development
   - Example: User document with nested addresses array
2. **Key-Value** (Redis): Simple key → value pairs
   - Good for: Caching, session storage, real-time features
   - Example: `user:123:session` → `{data: "..."}`
3. **Columnar** (Cassandra): Store data in columns (not rows)
   - Good for: Time-series data, analytics
4. **Graph** (Neo4j): Store relationships as first-class citizens
   - Good for: Social networks, recommendation engines

**Why NoSQL?**
- Faster for specific use cases (caching, real-time)
- More flexible schemas (change structure easily)
- Better for distributed systems (can handle millions of writes)

## Schemas

**Schema** = The structure/blueprint of your data

- SQL: DDL defines tables/columns/types/constraints
```
CREATE TABLE users (
  id SERIAL PRIMARY KEY,              -- Auto-incrementing ID
  name VARCHAR(50) NOT NULL,          -- Name (required, max 50 chars)
  email VARCHAR(100) UNIQUE NOT NULL  -- Email (required, must be unique)
);
```

- App-level schema: validation with JSON Schema/ORM models
  - Even with NoSQL, validate data in your application code
  - Prevents invalid data from entering the system

**Why schemas matter**:
- **Data integrity**: Can't store invalid data (e.g., email must be unique)
- **Type safety**: Numbers are numbers, strings are strings
- **Documentation**: Schema shows what data structure to expect
- **Evolution**: Migrations change schema safely over time

## Common Pitfalls

- **No indexing**: Slow queries on large tables (indexes speed up searches)
- **N+1 queries**: Loading users, then querying orders for each user separately (use JOINs)
- **SQL injection**: Not using parameterized queries (always use `?` or `$1` placeholders)
- **Ignoring transactions**: Multiple operations that should succeed/fail together
- **Choosing wrong database**: Using SQL for cache, or NoSQL for complex relationships

## When to Use What

**Use SQL (PostgreSQL/MySQL) when**:
- You need complex relationships (users → orders → items)
- Data integrity is critical (transactions, constraints)
- You need complex queries (JOINs, aggregations)
- Team is familiar with SQL

**Use NoSQL when**:
- Caching (Redis)
- Simple, high-volume reads (MongoDB for logs)
- Flexible schema (don't know structure upfront)
- Real-time features (Redis pub/sub)
- Graph relationships (Neo4j for social networks)

## Best Practices

- **Index frequently queried columns**: Speeds up searches
- **Use transactions for related operations**: All-or-nothing updates
- **Normalize first, denormalize for performance**: Start clean, optimize later
- **Validate at app level AND database level**: Double protection
- **Use migrations**: Version your schema changes
- **Backup regularly**: Databases contain critical data
