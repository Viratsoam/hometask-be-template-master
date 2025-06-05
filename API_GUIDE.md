# API Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [System Architecture](#system-architecture)
3. [Security Features](#security-features)
4. [API Versioning](#api-versioning)
5. [Rate Limiting](#rate-limiting)
6. [Database Schema](#database-schema)
7. [Authentication](#authentication)
8. [API Endpoints](#api-endpoints)
9. [Request/Response Formats](#requestresponse-formats)
10. [Error Handling](#error-handling)
11. [Troubleshooting](#troubleshooting)
12. [Examples](#examples)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- SQLite3

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Seed the database:
   ```bash
   npm run seed
   ```
4. Start the server:
   ```bash
   npm start
   ```

The server will start on port 3001 by default. If port 3001 is in use, the server will automatically try the next available port.

## System Architecture

The application follows a RESTful architecture with the following components:

- **Express.js** - Web framework
- **Sequelize** - ORM for database operations
- **SQLite3** - Database
- **Middleware** - Authentication and request processing

### Directory Structure
```
├── src/
│   ├── app.js          # Express application setup
│   ├── model.js        # Database models
│   ├── server.js       # Server initialization
│   ├── middleware/     # Custom middleware
│   └── routes/         # API route handlers
├── tests/              # Test files
└── scripts/            # Utility scripts
```

## Security Features

The API implements several security measures:

1. **Helmet.js**
   - Sets various HTTP headers for security
   - Prevents common web vulnerabilities
   - Configures Content Security Policy

2. **Rate Limiting**
   - Limits requests per IP address
   - Prevents abuse and DoS attacks
   - Configurable time windows and limits

3. **Input Validation**
   - Validates all incoming requests
   - Sanitizes user input
   - Prevents injection attacks

## API Versioning

The API uses versioning to maintain backward compatibility:

- Current version: v1
- Base URL: `/api/v1`
- Example: `http://localhost:3001/api/v1/contracts`

## Rate Limiting

The API implements rate limiting to prevent abuse:

- 100 requests per 15 minutes per IP address
- Custom error message when limit is exceeded
- Headers included in response:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

## Database Schema

### Profiles Table
```sql
CREATE TABLE Profiles (
    id INTEGER PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    profession TEXT,
    balance DECIMAL(10,2),
    type TEXT CHECK(type IN ('client', 'contractor')),
    createdAt DATETIME,
    updatedAt DATETIME
);
```

### Contracts Table
```sql
CREATE TABLE Contracts (
    id INTEGER PRIMARY KEY,
    terms TEXT,
    status TEXT CHECK(status IN ('new', 'in_progress', 'terminated')),
    ClientId INTEGER,
    ContractorId INTEGER,
    createdAt DATETIME,
    updatedAt DATETIME,
    FOREIGN KEY (ClientId) REFERENCES Profiles(id),
    FOREIGN KEY (ContractorId) REFERENCES Profiles(id)
);
```

### Jobs Table
```sql
CREATE TABLE Jobs (
    id INTEGER PRIMARY KEY,
    description TEXT,
    price DECIMAL(10,2),
    paid BOOLEAN DEFAULT false,
    paymentDate DATETIME,
    ContractId INTEGER,
    createdAt DATETIME,
    updatedAt DATETIME,
    FOREIGN KEY (ContractId) REFERENCES Contracts(id)
);
```

## Authentication

All API requests require authentication using a `profile_id` header. This header should contain the ID of the profile making the request.

Example:
```bash
curl -H "profile_id: 1" http://localhost:3001/api/v1/contracts/1
```

## API Endpoints

### 1. Contracts

#### Get Contract by ID
- **Endpoint:** `GET /api/v1/contracts/:id`
- **Headers:** `profile_id: <profile_id>`
- **Description:** Returns a specific contract by ID if the profile has access to it
- **Response:**
  ```json
  {
    "id": 16,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2025-06-05T15:27:34.491Z",
    "updatedAt": "2025-06-05T15:27:34.491Z",
    "ContractorId": 20,
    "ClientId": 17
  }
  ```

#### Get All Non-Terminated Contracts
- **Endpoint:** `GET /api/v1/contracts`
- **Headers:** `profile_id: <profile_id>`
- **Description:** Returns all non-terminated contracts for the profile
- **Response:**
  ```json
  [
    {
      "id": 16,
      "terms": "bla bla bla",
      "status": "in_progress",
      "createdAt": "2025-06-05T15:27:34.491Z",
      "updatedAt": "2025-06-05T15:27:34.491Z",
      "ContractorId": 20,
      "ClientId": 17
    }
  ]
  ```

### 2. Jobs

#### Get Unpaid Jobs
- **Endpoint:** `GET /api/v1/jobs/unpaid`
- **Headers:** `profile_id: <profile_id>`
- **Description:** Returns all unpaid jobs for active contracts
- **Response:**
  ```json
  [
    {
      "id": 30,
      "description": "work",
      "price": 200,
      "paid": false,
      "paymentDate": null,
      "createdAt": "2025-06-05T15:27:34.492Z",
      "updatedAt": "2025-06-05T15:27:34.492Z",
      "ContractId": 17,
      "Contract": {
        "id": 17,
        "terms": "bla bla bla",
        "status": "in_progress",
        "createdAt": "2025-06-05T15:27:34.491Z",
        "updatedAt": "2025-06-05T15:27:34.491Z",
        "ContractorId": 21,
        "ClientId": 18
      }
    }
  ]
  ```

#### Pay for a Job
- **Endpoint:** `POST /api/v1/jobs/:job_id/pay`
- **Headers:** `profile_id: <profile_id>`
- **Description:** Pays for a job if the client has sufficient balance
- **Response:**
  ```json
  {
    "id": 30,
    "description": "work",
    "price": 200,
    "paid": true,
    "paymentDate": "2025-06-05T15:30:00.000Z",
    "createdAt": "2025-06-05T15:27:34.492Z",
    "updatedAt": "2025-06-05T15:30:00.000Z",
    "ContractId": 17
  }
  ```

### 3. Balances

#### Deposit Money
- **Endpoint:** `POST /api/v1/balances/deposit/:userId`
- **Headers:** `profile_id: <profile_id>`
- **Body:** `{ "amount": 100 }`
- **Description:** Deposits money into a client's account (max 25% of unpaid jobs)
- **Response:**
  ```json
  {
    "balance": 1250
  }
  ```

### 4. Admin

#### Get Best Profession
- **Endpoint:** `GET /api/v1/admin/best-profession`
- **Headers:** `profile_id: <profile_id>`
- **Query Parameters:** 
  - `start`: Start date (YYYY-MM-DD)
  - `end`: End date (YYYY-MM-DD)
- **Description:** Returns the profession that earned the most money in the given time period
- **Response:**
  ```json
  {
    "profession": "Pokemon Trainer",
    "totalEarned": 2221
  }
  ```

#### Get Best Clients
- **Endpoint:** `GET /api/v1/admin/best-clients`
- **Headers:** `profile_id: <profile_id>`
- **Query Parameters:** 
  - `start`: Start date (YYYY-MM-DD)
  - `end`: End date (YYYY-MM-DD)
  - `limit`: Number of clients to return (default: 2)
- **Description:** Returns the clients who paid the most in the given time period
- **Response:**
  ```json
  [
    {
      "id": 17,
      "fullName": "Harry Potter",
      "paid": 2421
    },
    {
      "id": 24,
      "fullName": "Aragorn II Elessar Telcontarvalds",
      "paid": 400
    }
  ]
  ```

## Request/Response Formats

### Request Headers
All requests must include:
```
profile_id: <profile_id>
```

### Response Format
Successful responses are returned with status code 200 and JSON body:
```json
{
  "data": {
    // Response data
  }
}
```

Error responses include status code and error message:
```json
{
  "error": "Error message description",
  "status": 400
}
```

## Error Handling

The API uses standard HTTP status codes and returns error messages in JSON format:

```json
{
  "error": "Error message description",
  "status": 400
}
```

Common error scenarios:
- 401: Unauthorized - Profile not found
- 404: Not Found - Resource not found
- 400: Bad Request - Invalid input
- 403: Forbidden - Insufficient permissions
- 429: Too Many Requests - Rate limit exceeded

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - The server will automatically try the next available port
   - To manually kill a process using port 3001:
     ```bash
     lsof -i :3001
     kill <PID>
     ```

2. **Database Connection Issues**
   - Ensure SQLite3 is installed
   - Check database file permissions
   - Run `npm run seed` to reset the database

3. **Authentication Errors**
   - Verify the profile_id header is set
   - Check if the profile exists in the database
   - Ensure the profile has the correct type (client/contractor)

4. **Job Payment Issues**
   - Verify client has sufficient balance
   - Check if the job is unpaid
   - Ensure the contract is active

5. **Rate Limiting Issues**
   - Check X-RateLimit headers in response
   - Wait for rate limit window to reset
   - Consider implementing request caching

## Examples

### Example 1: Get Contract
```bash
curl -H "profile_id: 1" http://localhost:3001/api/v1/contracts/1
```

### Example 2: Get Best Profession
```bash
curl -H "profile_id: 1" "http://localhost:3001/api/v1/admin/best-profession?start=2020-01-01&end=2025-12-31"
```

### Example 3: Get Best Clients
```bash
curl -H "profile_id: 1" "http://localhost:3001/api/v1/admin/best-clients?start=2020-01-01&end=2025-12-31&limit=2"
```

### Example 4: Pay for a Job
```bash
curl -X POST -H "profile_id: 1" http://localhost:3001/api/v1/jobs/1/pay
```

### Example 5: Deposit Money
```bash
curl -X POST -H "profile_id: 1" http://localhost:3001/api/v1/balances/deposit/1
```

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id header is missing or invalid
  ```json
  {
    "error": "Unauthorized: profile not found",
    "status": 401
  }
  ```

- 404 Not Found: When the requested resource is not found
  ```json
  {
    "error": "Not Found",
    "status": 404
  }
  ```

- 400 Bad Request: When the request parameters are invalid
  ```json
  {
    "error": "Cannot deposit more than 25% of jobs to pay",
    "status": 400
  }
  ```

- 403 Forbidden: When the user doesn't have permission
  ```json
  {
    "error": "Access denied",
    "status": 403
  }
  ```

- 500 Internal Server Error: When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "status": 500
  }
  ```

## Example Profile IDs

For testing the API, you can use these profile IDs:

- 17: Harry Potter (client)
- 18: Mr Robot (client)
- 19: John Snow (contractor)
- 20: Ash Ketchum (contractor)
- 21: John Lenon (contractor)
- 22: Linus Torvalds (contractor)
- 23: Alan Turing (contractor)
- 24: Aragorn II Elessar Telcontarvalds (client)

This guide provides examples of how to use the API endpoints.

## Authentication

All endpoints require a `profile_id` header for authentication. The profile_id should be a valid user ID from the database.

Example:
```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 1"
```

## Endpoints

### Contracts

#### Get all non-terminated contracts for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/contracts -H "profile_id: 2"
```

Response:
```json
[
  {
    "id": 1,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 6,
    "ClientId": 2
  },
  {
    "id": 2,
    "terms": "bla bla bla",
    "status": "in_progress",
    "createdAt": "2024-03-19T12:00:00.000Z",
    "updatedAt": "2024-03-19T12:00:00.000Z",
    "ContractorId": 7,
    "ClientId": 2
  }
]
```

#### Get contract by id

```bash
curl -X GET http://localhost:3001/api/v1/contracts/1 -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "terms": "bla bla bla",
  "status": "in_progress",
  "createdAt": "2024-03-19T12:00:00.000Z",
  "updatedAt": "2024-03-19T12:00:00.000Z",
  "ContractorId": 6,
  "ClientId": 1
}
```

### Jobs

#### Get all unpaid jobs for the authenticated profile

```bash
curl -X GET http://localhost:3001/api/v1/jobs/unpaid -H "profile_id: 2"
```

Response:
```json
[]
```

#### Pay for a job

```bash
curl -X POST http://localhost:3001/api/v1/jobs/1/pay -H "profile_id: 1"
```

Response:
```json
{
  "id": 1,
  "description": "work",
  "price": 200,
  "paid": true,
  "paymentDate": "2024-03-19T12:00:00.000Z",
  "ContractId": 1
}
```

### Balances

#### Deposit money into the the balance of a client

```bash
curl -X POST http://localhost:3001/api/v1/balances/deposit/2 -H "profile_id: 2" -H "Content-Type: application/json" -d '{"amount": 100}'
```

Response:
```json
{
  "error": "Cannot deposit more than 25% of jobs to pay (0)"
}
```

Note: The deposit amount cannot exceed 25% of the total of jobs to pay.

### Admin

#### Get best profession in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-profession?start=2019-12-31&end=2025-12-30" -H "profile_id: 1"
```

Response:
```json
{
  "profession": "Programmer",
  "totalEarned": 2683
}
```

#### Get best clients in a date range

```bash
curl -X GET "http://localhost:3001/api/v1/admin/best-clients?start=2019-12-31&end=2025-12-30&limit=2" -H "profile_id: 1"
```

Response:
```json
[
  {
    "id": 4,
    "fullName": "Ash Ketchum",
    "paid": 2020
  },
  {
    "id": 2,
    "fullName": "Mr Robot",
    "paid": 442
  }
]
```

## Error Responses

The API may return the following error responses:

- 401 Unauthorized: When the profile_id