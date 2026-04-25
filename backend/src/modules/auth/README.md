# Module 1: Authentication - Developer Guide

## 👨‍💻 Developer: Dev 1
## 📦 Module: Authentication & User Management
## ✅ Status: Complete & Ready for Integration

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [API Endpoints](#api-endpoints)
4. [Database Schema](#database-schema)
5. [Setup Instructions](#setup-instructions)
6. [Testing](#testing)
7. [Integration with Frontend](#integration-with-frontend)

---

## 🎯 Overview

This module handles all authentication and user management functionality including:
- User registration
- User login/logout
- JWT token management
- Password reset flow
- Profile management
- Token verification

### Tech Stack Used:
- **TypeScript** - Type safety
- **Express.js** - HTTP server
- **Prisma ORM** - Database operations
- **JWT** - Authentication tokens
- **Zod** - Request validation
- **bcryptjs** - Password hashing

---

## 📁 File Structure

```
backend/src/modules/auth/
├── auth.controller.ts      # HTTP request handlers
├── auth.service.ts         # Business logic
├── auth.routes.ts          # Route definitions
└── auth.validation.ts      # Zod schemas for validation
```

### File Responsibilities:

#### `auth.controller.ts`
- Handles HTTP requests and responses
- Calls service methods
- Manages error handling
- Returns formatted responses

#### `auth.service.ts`
- Contains business logic
- Database operations via Prisma
- Password hashing/comparison
- JWT token generation
- User validation

#### `auth.routes.ts`
- Defines API routes
- Applies middleware (auth, rate limiting)
- Swagger/OpenAPI documentation
- Route organization

#### `auth.validation.ts`
- Zod schemas for request validation
- Type definitions (TypeScript interfaces)
- Validation rules and error messages

---

## 🛣️ API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "department": "Engineering" // optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "MEMBER",
      "department": "Engineering",
      "avatar": null,
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "MEMBER",
      "department": "Engineering",
      "avatar": null,
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "If your email is registered, you will receive a password reset link",
  "resetToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Only in dev mode
}
```

#### 4. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "NewSecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### 5. Verify Token
```http
POST /api/auth/verify-token
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "MEMBER"
  }
}
```

---

### Protected Endpoints (Authentication Required)

All protected endpoints require JWT token in header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 6. Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "MEMBER",
    "department": "Engineering",
    "avatar": null,
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 7. Update Profile
```http
PATCH /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "department": "Product",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Smith",
    "role": "MEMBER",
    "department": "Product",
    "avatar": "https://example.com/avatar.jpg",
    "status": "ACTIVE",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 8. Change Password
```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### 9. Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 🗄️ Database Schema

### User Model (Prisma Schema)

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String   // Hashed with bcrypt
  name          String
  role          Role     @default(MEMBER)
  avatar        String?
  department    String?
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  ownedGoals    Goal[]   @relation("GoalOwner")
  assignedTasks Task[]   @relation("TaskAssignee")

  @@map("users")
}

enum Role {
  ADMIN
  MANAGER
  MEMBER
  VIEWER
}

enum UserStatus {
  ACTIVE
  INACTIVE
}
```

---

## 🚀 Setup Instructions

### 1. Environment Variables

Create/update `.env` file in backend directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/flowbit"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:5173"
```

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Server will start at: `http://localhost:5000`
API Docs available at: `http://localhost:5000/api-docs`

---

## 🧪 Testing

### Manual Testing with cURL

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "name": "Test User",
    "department": "Engineering"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

#### Get Current User (use token from login response)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Testing with Postman

1. Import the Postman collection: `FlowBit_API_Postman_Collection.json`
2. Set environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `auth_token`: (will be set automatically after login)
3. Run the "Authentication" folder tests

### Unit Testing with Jest

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 🔗 Integration with Frontend

### 1. Setup Axios Instance

Create `frontend/src/services/api.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export default api;
```

### 2. Create Auth Service

Create `frontend/src/services/authService.ts`:

```typescript
import api from './api';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  department?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  avatar?: string;
  status: string;
}

class AuthService {
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response;
  }

  async login(data: LoginData) {
    const response = await api.post('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response;
  }

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>) {
    const response = await api.patch('/auth/profile', data);
    return response;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response;
  }

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  }

  async resetPassword(token: string, password: string) {
    const response = await api.post('/auth/reset-password', { token, password });
    return response;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();
```

### 3. Usage in React Components

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## 🔐 Security Features

1. **Password Hashing**: bcrypt with salt rounds of 10
2. **JWT Tokens**: Signed with secret, 7-day expiration
3. **Rate Limiting**: 5 requests per 15 minutes for auth endpoints
4. **Input Validation**: Zod schemas with strict rules
5. **Error Handling**: No sensitive information leaked
6. **CORS Protection**: Configured for specific origins
7. **Helmet.js**: Security headers

---

## 📝 Validation Rules

### Password Requirements:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

### Email Requirements:
- Valid email format
- Unique in database

### Name Requirements:
- Minimum 2 characters

---

## ❌ Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Your account has been deactivated"
}
```

### Conflict (409)
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

### Rate Limit (429)
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later."
}
```

---

## 🔄 JWT Token Structure

**Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "MEMBER",
  "iat": 1234567890,
  "exp": 1234999999
}
```

**Usage:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📚 Additional Resources

- API Documentation: `http://localhost:5000/api-docs`
- Postman Collection: `FlowBit_API_Postman_Collection.json`
- OpenAPI Spec: `FlowBit_API_OpenAPI_3.0.yaml`

---

## ✅ Module Status

- [x] User Registration
- [x] User Login
- [x] JWT Token Generation
- [x] Password Hashing
- [x] Get Current User
- [x] Update Profile
- [x] Change Password
- [x] Forgot Password
- [x] Reset Password
- [x] Token Verification
- [x] Logout
- [x] Rate Limiting
- [x] Input Validation
- [x] Error Handling
- [x] Swagger Documentation

---

## 🤝 Integration Points with Other Modules

This module provides authentication for:
- **Module 2 (Goals)**: User ownership of goals
- **Module 3 (Milestones)**: User permissions
- **Module 4 (Tasks)**: Task assignment to users
- **Module 5 (Dashboard)**: User-specific analytics

All other modules should use the `authenticate` middleware to protect routes and access `req.user` for user information.

---

## 💡 Tips for Other Developers

1. Always use the `authenticate` middleware for protected routes
2. Use `authorize(...roles)` middleware for role-based access
3. Import types from `auth.validation.ts` for type safety
4. Follow the same pattern for creating other modules
5. Use the error handling utilities from `errorHandler.ts`
6. Test endpoints using Swagger UI at `/api-docs`

---

**Module 1 (Authentication) is complete and ready for integration! 🎉**
