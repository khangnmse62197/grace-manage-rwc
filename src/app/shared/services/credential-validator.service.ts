import {Injectable} from '@angular/core';
import {EmployeeService} from '../../employee.service';

export interface PasswordStrengthResult {
  isValid: boolean;
  errors: string[];
}

export interface UsernameValidationResult {
  isAvailable: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CredentialValidatorService {
  private readonly MIN_PASSWORD_LENGTH = 6;
  private readonly MIN_USERNAME_LENGTH = 3;
  private readonly MAX_USERNAME_LENGTH = 30;

  constructor(private employeeService: EmployeeService) {
  }

  /**
   * Validate password strength
   * @param password The password to validate
   * @returns PasswordStrengthResult with validation details
   */
  validatePasswordStrength(password: string): PasswordStrengthResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < this.MIN_PASSWORD_LENGTH) {
        errors.push(`Password must be at least ${this.MIN_PASSWORD_LENGTH} characters long`);
      }

      // Check for uppercase
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }

      // Check for lowercase
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }

      // Check for numbers
      if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
      }

      // Check for special characters
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character (!@#$%^&* etc.)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate username format and availability
   * @param username The username to validate
   * @param excludeEmployeeId Optional: employee ID to exclude from uniqueness check (for updates)
   * @returns UsernameValidationResult with validation details
   */
  validateUsername(username: string, excludeEmployeeId?: number | null): UsernameValidationResult {
    const errors: string[] = [];

    if (!username) {
      errors.push('Username is required');
    } else {
      if (username.length < this.MIN_USERNAME_LENGTH) {
        errors.push(`Username must be at least ${this.MIN_USERNAME_LENGTH} characters long`);
      }

      if (username.length > this.MAX_USERNAME_LENGTH) {
        errors.push(`Username must not exceed ${this.MAX_USERNAME_LENGTH} characters`);
      }

      // Check for valid characters (alphanumeric and underscores only)
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
      }

      // Check uniqueness
      if (!this.isUsernameUnique(username, excludeEmployeeId)) {
        errors.push('Username is already taken');
      }
    }

    return {
      isAvailable: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a username is unique across all employees
   * @param username The username to check
   * @param excludeEmployeeId Optional: employee ID to exclude from check
   * @returns True if username is unique
   */
  private isUsernameUnique(username: string, excludeEmployeeId?: number | null): boolean {
    const allEmployees = this.employeeService.getAllEmployees();
    return !allEmployees.some(emp =>
      emp.username?.toLowerCase() === username.toLowerCase() &&
      emp.id !== excludeEmployeeId
    );
  }
}

