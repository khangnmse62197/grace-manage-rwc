import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {environment} from '../environments/environment';

export interface CheckInOutRecord {
  id: number;
  employeeId: number;
  type: 'in' | 'out';
  timestamp: Date;
}

export interface Employee {
  id: number;
  fullName: string;
  age: number;
  roleId: number;
  lastCheckInTime: Date | null;
  lastCheckOutTime: Date | null;
  username?: string;
  password?: string;
  // Backend fields
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/api/v1/users`;

  constructor(private http: HttpClient) {
  }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<ApiResponse<Employee[]>>(this.apiUrl)
      .pipe(
        // Map the ApiResponse to return just the data array
        // We need to import 'map' from rxjs/operators
        map(response => response.data)
      );
  }

  getEmployeeById(id: number): Observable<Employee> {
    return this.http.get<ApiResponse<Employee>>(`${this.apiUrl}/${id}`)
      .pipe(map(response => response.data));
  }

  addEmployee(employee: Omit<Employee, 'id'>): Observable<Employee> {
    return this.http.post<ApiResponse<Employee>>(this.apiUrl, employee)
      .pipe(map(response => response.data));
  }

  updateEmployee(id: number, updates: Partial<Employee>): Observable<Employee> {
    return this.http.patch<ApiResponse<Employee>>(`${this.apiUrl}/${id}`, updates)
      .pipe(map(response => response.data));
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(map(() => void 0));
  }
}
