/**
 * Standard API response wrapper from backend
 */
export interface ApiResponse<T> {
  status: string;
  data: T;
  message: string;
}

/**
 * User entity from backend
 */
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * Login response containing tokens and user info
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: User;
}

/**
 * Refresh token response
 */
export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  username: string;
  password: string;
}

