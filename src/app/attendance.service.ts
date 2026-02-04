import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, catchError, Observable, of, tap} from 'rxjs';
import {map} from 'rxjs/operators';
import {environment} from '../environments/environment';

export interface CheckInRequest {
  userId: number;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
}

export interface CheckInRecordResponse {
  id: number;
  userId: number;
  type: 'IN' | 'OUT';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
}

export interface AttendanceStatusResponse {
  isCheckedIn: boolean;
  lastCheckInTime: string | null;
  lastCheckOutTime: string | null;
  todayCheckInCount: number;
  todayCheckOutCount: number;
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
export class AttendanceService {
  private apiUrl = `${environment.apiUrl}/api/v1/attendance`;

  private statusSubject = new BehaviorSubject<AttendanceStatusResponse | null>(null);
  public status$ = this.statusSubject.asObservable();

  private todayRecordsSubject = new BehaviorSubject<CheckInRecordResponse[]>([]);
  public todayRecords$ = this.todayRecordsSubject.asObservable();

  constructor(private http: HttpClient) {
  }

  /**
   * Record a check-in for a user
   */
  checkIn(request: CheckInRequest): Observable<CheckInRecordResponse> {
    return this.http.post<ApiResponse<CheckInRecordResponse>>(`${this.apiUrl}/check-in`, request)
      .pipe(
        map(response => response.data),
        tap(() => {
          // Refresh status and today's records after check-in
          this.refreshStatus(request.userId);
          this.refreshTodayRecords(request.userId);
        }),
        catchError(error => {
          console.error('Check-in failed:', error);
          throw error;
        })
      );
  }

  /**
   * Record a check-out for a user
   */
  checkOut(request: CheckInRequest): Observable<CheckInRecordResponse> {
    return this.http.post<ApiResponse<CheckInRecordResponse>>(`${this.apiUrl}/check-out`, request)
      .pipe(
        map(response => response.data),
        tap(() => {
          // Refresh status and today's records after check-out
          this.refreshStatus(request.userId);
          this.refreshTodayRecords(request.userId);
        }),
        catchError(error => {
          console.error('Check-out failed:', error);
          throw error;
        })
      );
  }

  /**
   * Get current attendance status for a user
   */
  getStatus(userId: number): Observable<AttendanceStatusResponse> {
    return this.http.get<ApiResponse<AttendanceStatusResponse>>(`${this.apiUrl}/status/${userId}`)
      .pipe(
        map(response => response.data),
        tap(status => this.statusSubject.next(status)),
        catchError(error => {
          console.error('Failed to get status:', error);
          // Return default status on error (offline mode fallback)
          return of({
            isCheckedIn: false,
            lastCheckInTime: null,
            lastCheckOutTime: null,
            todayCheckInCount: 0,
            todayCheckOutCount: 0
          });
        })
      );
  }

  /**
   * Get today's attendance records for a user
   */
  getTodayRecords(userId: number): Observable<CheckInRecordResponse[]> {
    return this.http.get<ApiResponse<CheckInRecordResponse[]>>(`${this.apiUrl}/today/${userId}`)
      .pipe(
        map(response => response.data),
        tap(records => this.todayRecordsSubject.next(records)),
        catchError(error => {
          console.error('Failed to get today records:', error);
          return of([]);
        })
      );
  }

  /**
   * Get attendance history for a user within a date range
   */
  getHistory(userId: number, startDate?: Date, endDate?: Date): Observable<CheckInRecordResponse[]> {
    let url = `${this.apiUrl}/history/${userId}`;
    const params: string[] = [];

    if (startDate) {
      params.push(`startDate=${startDate.toISOString().split('T')[0]}`);
    }
    if (endDate) {
      params.push(`endDate=${endDate.toISOString().split('T')[0]}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<ApiResponse<CheckInRecordResponse[]>>(url)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Failed to get history:', error);
          return of([]);
        })
      );
  }

  /**
   * Refresh status from server
   */
  refreshStatus(userId: number): void {
    this.getStatus(userId).subscribe();
  }

  /**
   * Refresh today's records from server
   */
  refreshTodayRecords(userId: number): void {
    this.getTodayRecords(userId).subscribe();
  }

  /**
   * Get cached status
   */
  getCachedStatus(): AttendanceStatusResponse | null {
    return this.statusSubject.value;
  }

  /**
   * Get cached today's records
   */
  getCachedTodayRecords(): CheckInRecordResponse[] {
    return this.todayRecordsSubject.value;
  }
}
