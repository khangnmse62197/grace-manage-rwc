# Storage Management - API Specification

## Overview

This document defines the REST API endpoints for the Storage Management system. Currently, the system uses localStorage for mock persistence, but these specifications outline the target API design for production implementation.

## Base URL

```
/api/storage
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer {token}
```

## Response Format

All endpoints return JSON responses with the following structure:

### Success Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": "Error details"
  }
}
```

## Categories Endpoints

### GET /api/storage/categories

Get all categories.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "cat_1234567890abc",
      "name": "Computers",
      "createdAt": "2024-01-10T10:30:00Z",
      "updatedAt": "2024-01-10T10:30:00Z"
    }
  ]
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden

---

### GET /api/storage/categories/{categoryId}

Get a specific category by ID.

**Parameters:**

- `categoryId` (string, path) - The ID of the category

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cat_1234567890abc",
    "name": "Computers",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-10T10:30:00Z"
  }
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized
- `404` - Category not found

---

### POST /api/storage/categories

Create a new category.

**Request Body:**

```json
{
  "name": "Furniture"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cat_1234567890abc",
    "name": "Furniture",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-10T10:30:00Z"
  },
  "message": "Category created successfully"
}
```

**Status Codes:**

- `201` - Created
- `400` - Bad request (invalid input)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)

**Validation:**

- `name` is required and must be unique
- Maximum length: 255 characters

---

### PUT /api/storage/categories/{categoryId}

Update an existing category.

**Parameters:**

- `categoryId` (string, path) - The ID of the category

**Request Body:**

```json
{
  "name": "Office Furniture"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "cat_1234567890abc",
    "name": "Office Furniture",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-10T11:00:00Z"
  },
  "message": "Category updated successfully"
}
```

**Status Codes:**

- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `404` - Category not found

---

### DELETE /api/storage/categories/{categoryId}

Delete a category.

**Parameters:**

- `categoryId` (string, path) - The ID of the category

**Response:**

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized
- `404` - Category not found
- `409` - Conflict (category has equipment)

---

## Equipment Endpoints

### GET /api/storage/equipment

Get all equipment.

**Query Parameters:**

- `categoryId` (optional) - Filter by category ID
- `status` (optional) - Filter by status
- `userId` (optional) - Filter by assigned user

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "eq_1234567890abc",
      "name": "Dell Laptop",
      "price": 1200.00,
      "status": "in_use",
      "expirationDate": "2025-12-31T23:59:59Z",
      "assignedTo": "emp_123",
      "pictureUrl": "https://example.com/laptop.jpg",
      "categoryId": "cat_1234567890abc",
      "createdAt": "2024-01-10T10:30:00Z",
      "updatedAt": "2024-01-10T10:30:00Z"
    }
  ]
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized

---

### GET /api/storage/equipment/{equipmentId}

Get a specific equipment by ID.

**Parameters:**

- `equipmentId` (string, path) - The ID of the equipment

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "eq_1234567890abc",
    "name": "Dell Laptop",
    "price": 1200.00,
    "status": "in_use",
    "expirationDate": "2025-12-31T23:59:59Z",
    "assignedTo": "emp_123",
    "pictureUrl": "https://example.com/laptop.jpg",
    "categoryId": "cat_1234567890abc",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-10T10:30:00Z"
  }
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized
- `404` - Equipment not found

---

### POST /api/storage/equipment

Create new equipment.

**Request Body:**

```json
{
  "name": "HP Monitor",
  "price": 350.00,
  "status": "new",
  "expirationDate": "2026-01-10T23:59:59Z",
  "assignedTo": null,
  "pictureUrl": "https://example.com/monitor.jpg",
  "categoryId": "cat_1234567890abc"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "eq_1234567890abc",
    "name": "HP Monitor",
    "price": 350.00,
    "status": "new",
    "expirationDate": "2026-01-10T23:59:59Z",
    "assignedTo": null,
    "pictureUrl": "https://example.com/monitor.jpg",
    "categoryId": "cat_1234567890abc",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-10T10:30:00Z"
  },
  "message": "Equipment created successfully"
}
```

**Status Codes:**

- `201` - Created
- `400` - Bad request
- `401` - Unauthorized

**Validation:**

- `name` is required, max 255 characters
- `price` is required, must be >= 0
- `status` must be one of: `new`, `in_use`, `expired`, `assigned_to`
- `expirationDate` must be a valid ISO 8601 date and in the future
- `categoryId` must exist

---

### PUT /api/storage/equipment/{equipmentId}

Update existing equipment.

**Parameters:**

- `equipmentId` (string, path) - The ID of the equipment

**Request Body:**

```json
{
  "name": "HP Monitor 27 inch",
  "price": 375.00,
  "status": "in_use",
  "assignedTo": "emp_123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "eq_1234567890abc",
    "name": "HP Monitor 27 inch",
    "price": 375.00,
    "status": "in_use",
    "expirationDate": "2026-01-10T23:59:59Z",
    "assignedTo": "emp_123",
    "pictureUrl": "https://example.com/monitor.jpg",
    "categoryId": "cat_1234567890abc",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-10T11:00:00Z"
  },
  "message": "Equipment updated successfully"
}
```

**Status Codes:**

- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `404` - Equipment not found

---

### DELETE /api/storage/equipment/{equipmentId}

Delete equipment.

**Parameters:**

- `equipmentId` (string, path) - The ID of the equipment

**Response:**

```json
{
  "success": true,
  "message": "Equipment deleted successfully"
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized
- `404` - Equipment not found

---

### POST /api/storage/equipment/{equipmentId}/assign

Assign equipment to a user.

**Parameters:**

- `equipmentId` (string, path) - The ID of the equipment

**Request Body:**

```json
{
  "userId": "emp_123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "eq_1234567890abc",
    "name": "HP Monitor 27 inch",
    "price": 375.00,
    "status": "assigned_to",
    "expirationDate": "2026-01-10T23:59:59Z",
    "assignedTo": "emp_123",
    "pictureUrl": "https://example.com/monitor.jpg",
    "categoryId": "cat_1234567890abc",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-10T11:00:00Z"
  },
  "message": "Equipment assigned to user"
}
```

**Status Codes:**

- `200` - Success
- `400` - Bad request
- `401` - Unauthorized
- `404` - Equipment or user not found

---

### POST /api/storage/equipment/{equipmentId}/unassign

Unassign equipment from a user.

**Parameters:**

- `equipmentId` (string, path) - The ID of the equipment

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "eq_1234567890abc",
    "name": "HP Monitor 27 inch",
    "price": 375.00,
    "status": "in_use",
    "expirationDate": "2026-01-10T23:59:59Z",
    "assignedTo": null,
    "pictureUrl": "https://example.com/monitor.jpg",
    "categoryId": "cat_1234567890abc",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-10T11:00:00Z"
  },
  "message": "Equipment unassigned from user"
}
```

**Status Codes:**

- `200` - Success
- `401` - Unauthorized
- `404` - Equipment not found

---

## Status Codes Reference

| Code | Meaning                                          |
|------|--------------------------------------------------|
| 200  | OK - Request succeeded                           |
| 201  | Created - Resource successfully created          |
| 400  | Bad Request - Invalid input data                 |
| 401  | Unauthorized - Missing or invalid authentication |
| 403  | Forbidden - Insufficient permissions             |
| 404  | Not Found - Resource does not exist              |
| 409  | Conflict - Operation violates business rules     |
| 500  | Server Error - Internal server error             |

---

## Implementation Notes

### Date Format

All dates in API requests and responses use ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`

### Pagination (Future Enhancement)

For large datasets, implement pagination:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 150,
    "totalPages": 8
  }
}
```

### Rate Limiting (Future Enhancement)

Implement rate limiting headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1610252459
```

