# Deel Backend Task - Project Summary

## Project Overview
This is a backend application that manages contracts, jobs, and payments between clients and contractors. The system allows clients to create contracts with contractors, assign jobs, and make payments while maintaining proper balance management and access control.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)
- SQLite3

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```

### Database Setup
The project uses SQLite3 as the database. The database will be automatically created and synced when you start the application.

### Running the Application
1. Start the server:
```bash
npm start
```
The server will start on port 3001.

## API Documentation

### Authentication
All API endpoints require a `profile_id` header for authentication. This header should contain the ID of the profile making the request.

### Available Endpoints

#### Contracts
1. **Get Contract by ID**
   - `GET /api/v1/contracts/:id`
   - Returns a specific contract if the profile has access to it
   - Example Response:
   ```json
   {
     "id": 1,
     "terms": "bla bla bla",
     "status": "in_progress",
     "createdAt": "2025-06-05T15:27:34.491Z",
     "updatedAt": "2025-06-05T15:27:34.491Z",
     "ContractorId": 5,
     "ClientId": 2
   }
   ```

2. **Get All Contracts**
   - `GET /api/v1/contracts`
   - Returns all non-terminated contracts for the profile
   - Example Response:
   ```json
   [
     {
       "id": 1,
       "terms": "bla bla bla",
       "status": "in_progress",
       "createdAt": "2025-06-05T15:27:34.491Z",
       "updatedAt": "2025-06-05T15:27:34.491Z",
       "ContractorId": 5,
       "ClientId": 2
     }
   ]
   ```

#### Jobs
1. **Get Unpaid Jobs**
   - `GET /api/v1/jobs/unpaid`
   - Returns all unpaid jobs for active contracts
   - Example Response:
   ```json
   [
     {
       "id": 1,
       "description": "work",
       "price": 200,
       "paid": false,
       "paymentDate": null,
       "ContractId": 1
     }
   ]
   ```

2. **Pay for a Job**
   - `POST /api/v1/jobs/:job_id/pay`
   - Pays for a job if the client has sufficient balance
   - Example Response:
   ```json
   {
     "id": 1,
     "description": "work",
     "price": 200,
     "paid": true,
     "paymentDate": "2025-06-05T15:27:34.491Z",
     "ContractId": 1
   }
   ```

#### Balances
1. **Deposit Money**
   - `POST /api/v1/balances/deposit/:userId`
   - Deposits money into a client's account (max 25% of unpaid jobs)
   - Example Response:
   ```json
   {
     "id": 1,
     "firstName": "John",
     "lastName": "Doe",
     "balance": 1150,
     "type": "client"
   }
   ```

#### Admin
1. **Get Best Profession**
   - `GET /api/v1/admin/best-profession?start=<date>&end=<date>`
   - Returns the profession that earned the most money in a given time period
   - Example Response:
   ```json
   {
     "profession": "Programmer",
     "totalEarned": 2683
   }
   ```

2. **Get Best Clients**
   - `GET /api/v1/admin/best-clients?start=<date>&end=<date>&limit=<number>`
   - Returns the clients who paid the most in a given time period
   - Example Response:
   ```json
   [
     {
       "id": 4,
       "fullName": "Ash Ketchum",
       "paid": 2020
     },
     {
       "id": 1,
       "fullName": "Harry Potter",
       "paid": 442
     }
   ]
   ```

## Project Requirements

### Functional Requirements
1. **Authentication**
   - All endpoints require profile authentication
   - Different access levels for clients, contractors, and admins

2. **Contract Management**
   - Create and manage contracts between clients and contractors
   - Track contract status (new, in_progress, terminated)

3. **Job Management**
   - Create and assign jobs to contracts
   - Track job status and payments
   - Ensure jobs can only be paid by the contract's client

4. **Payment System**
   - Process payments for jobs
   - Maintain balance for clients and contractors
   - Implement deposit limits (25% of unpaid jobs)

5. **Admin Features**
   - Generate reports on best performing professions
   - Track highest paying clients
   - Access to all contracts and jobs

### Technical Requirements
1. **Database**
   - Use SQLite3 for data storage
   - Implement proper relationships between tables
   - Maintain data integrity

2. **API Design**
   - RESTful API design
   - Proper error handling
   - Input validation
   - Consistent response format

3. **Security**
   - Authentication for all endpoints
   - Authorization checks for sensitive operations
   - Input sanitization
   - Protection against common vulnerabilities

4. **Performance**
   - Efficient database queries
   - Proper indexing
   - Response time optimization

## Test Coverage
The project includes comprehensive test coverage for all major functionalities:
- Unit tests for individual components
- Integration tests for API endpoints
- Error handling tests
- Authentication and authorization tests

## Error Handling
The API implements proper error handling with appropriate HTTP status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Development Guidelines
1. Follow RESTful API design principles
2. Implement proper error handling
3. Write comprehensive tests
4. Document all API endpoints
5. Follow security best practices
6. Maintain code quality and consistency 