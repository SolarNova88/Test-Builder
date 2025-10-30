# Request / Response

## What They Are (Simple Terms)

Think of requests and responses like a conversation:
- **Request** = You asking a question or making a request ("Can I have a hamburger?")
- **Response** = The answer you get back ("Here's your hamburger" or "Sorry, we're out of hamburgers")

Every web interaction works this way: your browser **requests** a webpage, and the server **responds** with HTML, data, or an error message.

## Why This Matters

Understanding requests/responses helps you:
- **Debug API issues**: See exactly what you're sending and what you're getting back
- **Build better APIs**: Know what format requests should be in and what responses should contain
- **Understand errors**: HTTP status codes tell you what went wrong (404 = not found, 500 = server error)
- **Optimize performance**: Understand what data is being sent back and forth

## Real-World Example

When you log into Gmail:
1. **Request**: Your browser sends `POST /login` with your email and password
2. **Server checks**: Validates your credentials in the database
3. **Response**: Returns `200 OK` with a session cookie, or `401 Unauthorized` if wrong password

When you load your inbox:
1. **Request**: `GET /inbox`
2. **Response**: `200 OK` with JSON containing all your emails

## HTTP Request Anatomy

- **Method**: GET, POST, PUT, PATCH, DELETE
  - GET = "Give me this" (like asking for a menu)
  - POST = "Create this" (like placing an order)
  - PUT/PATCH = "Update this" (like modifying your order)
  - DELETE = "Remove this" (like canceling an order)
- **URL**: Path + query string, e.g., `/users?limit=50`
- **Headers**: Metadata (e.g., `Authorization: Bearer <token>`, `Content-Type: application/json`)
  - Headers are like extra instructions: "Make it spicy" or "I'm allergic to nuts"
- **Body**: Optional payload (JSON, form-data, etc.) for non-GET operations
  - The body contains the actual data you're sending (like your order details)

Example (create user):

```
POST /users HTTP/1.1
Content-Type: application/json

{"name":"Alice","email":"alice@example.com"}
```

## HTTP Response Anatomy

- **Status Line**: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`
  - These numbers tell you if everything worked (200s = success, 400s = your mistake, 500s = server's mistake)
- **Headers**: e.g., `Cache-Control`, `Content-Type: application/json`
  - Response headers give extra info, like "this data is valid for 1 hour" (caching)
- **Body**: Payload (JSON, HTML, file stream)
  - The actual data you asked for

Example:

```
HTTP/1.1 201 Created
Content-Type: application/json

{"id":1,"name":"Alice","email":"alice@example.com"}
```

## Idempotency & Safety

This is about **what happens if you do the same thing twice**:

- **GET** is safe and idempotent; should not change server state
  - Asking for the menu twice doesn't change anything
- **PUT** and **DELETE** are idempotent (repeating yields same state)
  - Deleting something twice has the same result as deleting it once
- **POST** is not idempotent (repeat may create duplicates)
  - Submitting an order twice creates TWO orders!

**Why it matters**: If your internet is slow and you click "Submit" twice, idempotent operations won't cause problems, but POST operations might create duplicates.

## Common Pitfalls

- **Not checking status codes**: A 200 response doesn't always mean success—check the response body
- **Sending sensitive data in GET requests**: URLs are logged everywhere; use POST for passwords
- **Not handling errors**: Always check if the status code is 200-299 before assuming success
- **Forgetting content types**: Tell the server what format you're sending (JSON, XML, etc.)

## Practical Checks

- Validate inputs server-side; return clear error codes/messages
- Include correlation/request IDs for tracing across services
- Use pagination (`limit`,`cursor`) and filtering on list endpoints

## Tools

- cURL, HTTPie, Postman for manual requests
- Browser DevTools → Network tab for client-side inspection
