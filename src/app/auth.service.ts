import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: User | null = null;

  // Mocked users database
  private mockUsers = [
    {id: 1, username: 'admin', password: 'admin123', email: 'admin@example.com', role: 'admin'},
    {id: 2, username: 'user', password: 'user123', email: 'user@example.com', role: 'user'},
    {id: 3, username: 'demo', password: 'demo123', email: 'demo@example.com', role: 'viewer'}
  ];

  constructor() {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }
  }

  /**
   * Mock login - simulates API call to backend
   * @param username
   * @param password
   * @returns Observable with user data or error
   */
  login(username: string, password: string): Observable<User> {
    // Simulate network delay (500ms)
    return new Observable(observer => {
      setTimeout(() => {
        const user = this.mockUsers.find(
          u => u.username === username && u.password === password
        );

        if (user) {
          // Remove password from user object before storing
          const {password, ...userWithoutPassword} = user;
          this.currentUser = userWithoutPassword;
          localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
          observer.next(userWithoutPassword);
          observer.complete();
        } else {
          observer.error({message: 'Invalid username or password'});
        }
      }, 500);
    });
  }

  /**
   * Logout user
   */
  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }
}
