# API Documentation

Complete API reference for the Tamper-Proof Academic Records System backend.

## Base URL

```
https://api.your-domain.com/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Wallet Login
```http
POST /auth/wallet/login
```

**Request Body:**
```json
{
  "address": "0x...",
  "signature": "...",
  "message": "..."
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "student": {
    "id": "uuid",
    "walletAddress": "0x...",
    "fullName": "John Doe",
    "matricNumber": "MAT123456"
  }
}
```

#### Admin Login
```http
POST /auth/admin/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "jwt_token",
  "admin": {
    "id": "uuid",
    "username": "admin",
    "fullName": "Admin User",
    "role": "registry_staff"
  }
}
```

#### Generate Wallet Message
```http
POST /auth/wallet/message
```

**Request Body:**
```json
{
  "address": "0x..."
}
```

**Response:**
```json
{
  "message": "Please sign this message..."
}
```

### Student Endpoints

#### Get Dashboard
```http
GET /students/dashboard
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "student": {
    "id": "uuid",
    "fullName": "John Doe",
    "matricNumber": "MAT123456",
    "department": "Computer Science",
    "level": 400
  },
  "results": [...],
  "totalRecords": 10
}
```

#### Get Records
```http
GET /students/records?page=1&limit=20&semester=1&session=2023/2024
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "results": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

#### Get Specific Record
```http
GET /students/records/:recordId
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "uuid",
  "course_code": "CSC301",
  "course_title": "Data Structures",
  "grade": "A",
  "credit_units": 3,
  "semester": "First",
  "academic_session": "2023/2024",
  "ipfs_hash": "...",
  "blockchain_verified": true,
  "blockchain_record": {...}
}
```

#### Verify Record
```http
POST /students/records/:recordId/verify
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "verified": true,
  "recordId": "uuid",
  "ipfsHash": "...",
  "blockchainTxHash": "..."
}
```

### Admin Endpoints

#### Get Dashboard
```http
GET /admin/dashboard
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "admin": {...},
  "statistics": {
    "totalStudents": 1000,
    "totalResults": 5000,
    "pendingResults": 50
  },
  "recentResults": [...]
}
```

#### Search Students
```http
GET /admin/students/search?query=john&department=Computer Science&level=400
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "students": [...]
}
```

#### Upload Result
```http
POST /admin/results/upload
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "uuid",
  "courseCode": "CSC301",
  "courseTitle": "Data Structures",
  "grade": "A",
  "creditUnits": 3,
  "semester": "First",
  "academicSession": "2023/2024"
}
```

**Response:**
```json
{
  "result": {...},
  "message": "Result uploaded successfully. Blockchain submission in progress."
}
```

#### Batch Upload Results
```http
POST /admin/results/batch-upload
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
FormData with 'csvFile' field
```

**Response:**
```json
{
  "success": true,
  "processed": 50,
  "errors": 2,
  "errorDetails": [...]
}
```

#### Get Transaction Status
```http
GET /admin/transactions/:txHash
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "txHash": "...",
  "results": [...],
  "status": "confirmed"
}
```

### Verification Endpoints (Public)

#### Verify Record
```http
POST /verification/verify
```

**Request Body:**
```json
{
  "studentId": "uuid",
  "recordHash": "ipfs_hash"
}
```

**Response:**
```json
{
  "verified": true,
  "student": {...},
  "record": {...},
  "blockchainRecord": {...},
  "verificationTimestamp": "2024-01-01T00:00:00Z"
}
```

#### Verify Hash
```http
POST /verification/verify-hash
```

**Request Body:**
```json
{
  "recordHash": "ipfs_hash"
}
```

**Response:**
```json
{
  "exists": true,
  "recordHash": "...",
  "verificationTimestamp": "2024-01-01T00:00:00Z"
}
```

#### Get Verification Certificate
```http
GET /verification/certificate/:studentId/:recordHash
```

**Response:**
```json
{
  "verified": true,
  "student": {...},
  "record": {...},
  "blockchain": {...},
  "verificationDate": "2024-01-01T00:00:00Z",
  "institution": "University of Benin",
  "certificateId": "TAMPER-PROOF-..."
}
```

### IPFS Endpoints

#### Upload File
```http
POST /ipfs/upload
```

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
FormData with 'file' field
```

**Response:**
```json
{
  "ipfsHash": "...",
  "filename": "...",
  "size": 1024,
  "uploadedAt": "2024-01-01T00:00:00Z"
}
```

#### Retrieve File
```http
GET /ipfs/retrieve/:hash
```

**Response:**
```
Binary file content
```

### Blockchain Endpoints

#### Verify Record
```http
POST /blockchain/verify
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "studentAddress": "0x...",
  "ipfsHash": "..."
}
```

**Response:**
```json
{
  "verified": true,
  "studentAddress": "0x...",
  "ipfsHash": "...",
  "verifiedAt": "2024-01-01T00:00:00Z"
}
```

#### Get Record
```http
GET /blockchain/record/:studentAddress/:ipfsHash
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ipfsHash": "...",
  "metadataHash": "...",
  "timestamp": "1234567890",
  "submittedBy": "0x...",
  "exists": true
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15 minutes per IP address.

## WebSocket Events

The backend supports WebSocket connections for real-time updates:

### Subscribe to Transaction
```javascript
socket.emit('subscribe-transaction', 'tx_hash');
```

### Transaction Update Event
```javascript
socket.on('transaction-update', (data) => {
  // Handle transaction update
});
```

