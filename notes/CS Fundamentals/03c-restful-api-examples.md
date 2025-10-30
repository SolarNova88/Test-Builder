# RESTful API Examples

## Users Resource

Create:
```
POST /users
Content-Type: application/json

{"name":"Alice","email":"alice@example.com"}
```
Response:
```
201 Created
{"id":1,"name":"Alice","email":"alice@example.com"}
```

Read:
```
GET /users/1
→ 200 OK {"id":1,"name":"Alice","email":"alice@example.com"}
```

Replace:
```
PUT /users/1
{"name":"Alice","email":"a2@example.com"}
→ 200 OK
```

Partial Update:
```
PATCH /users/1
{"email":"a3@example.com"}
→ 200 OK
```

Delete:
```
DELETE /users/1
→ 204 No Content
```

## Pagination & Filtering

```
GET /users?limit=50&cursor=eyJpZCI6MX0=
GET /orders?status=shipped&from=2025-01-01&to=2025-01-31
```

## Errors

```
400 Bad Request {"error":"invalid_email","message":"Email format is invalid"}
404 Not Found {"error":"user_not_found"}
409 Conflict {"error":"email_taken"}
422 Unprocessable Entity {"error":"validation_failed","fields":{"email":"invalid"}}
```
