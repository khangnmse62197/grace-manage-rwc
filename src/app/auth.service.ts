import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, catchError, map, Observable, tap, throwError} from 'rxjs';
import {ApiResponse, LoginResponse, RefreshResponse, User} from './shared/models/api-response.model';

// Re-export User for backward compatibility
export type {User} from './shared/models/api-response.model';

// localStorage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const CURRENT_USER_KEY = 'currentUser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/v1/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user data exists in localStorage on init
    this.loadStoredUser();
  }

  /**
   * Login user via backend API
   * Returns access token and refresh token in response body
   */
  login(username: string, password: string): Observable<LoginResponse> {
    const loginRequest = {username, password};

    return this.http.post<ApiResponse<LoginResponse>>(`${this.baseUrl}/login`, loginRequest).pipe(
      map(response => response.data),
      tap(data => {
        // Store tokens in localStorage
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

        // Calculate and store token expiry time
        const expiryTime = Date.now() + (data.expiresIn * 1000);
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

        // Store user data
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
        this.currentUserSubject.next(data.user);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<ApiResponse<RefreshResponse>> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${refreshToken}`);

    return this.http.post<ApiResponse<RefreshResponse>>(`${this.baseUrl}/refresh`, {}, {headers}).pipe(
      tap(response => {
        if (response.status === 'success' && response.data) {
          // Update access token and expiry
          localStorage.setItem(ACCESS_TOKEN_KEY, response.data.accessToken);
          const expiryTime = Date.now() + (response.data.expiresIn * 1000);
          localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
        }
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        // If refresh fails, clear all tokens
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user - client-only (clear localStorage)
   * No server call needed since tokens will naturally expire
   */
  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Check if access token is expired
   */
  isTokenExpired(): boolean {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true;

    // Add 30 second buffer before actual expiry
    return Date.now() >= (parseInt(expiry, 10) - 30000);
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    // User is authenticated if they have at least a refresh token
    // (access token can be refreshed if expired)
    return !!(accessToken || refreshToken) && this.currentUserSubject.value !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.role === role;
  }

  /**
   * Load stored user from localStorage
   */
  private loadStoredUser(): void {
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (storedUser && accessToken) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }
}
