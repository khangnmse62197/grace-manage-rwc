import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {AuthService, User} from '../auth.service';
import {CheckInOutLocation, LocationData, LocationService} from '../location.service';
import {LocationMapComponent} from '../location-map/location-map.component';
import {AttendanceService, CheckInRecordResponse, CheckInRequest} from '../attendance.service';
import {Subscription} from 'rxjs';

interface CheckRecord {
  id: number;
  type: 'in' | 'out';
  timestamp: Date;
  location?: LocationData;
}

@Component({
  selector: 'app-check-in-out',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './check-in-out.component.html',
  styleUrl: './check-in-out.component.scss'
})
export class CheckInOutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isCheckedIn: boolean = false;
  lastCheckInTime: Date | null = null;
  lastCheckOutTime: Date | null = null;
  todayHistory: CheckRecord[] = [];
  isLoadingLocation: boolean = false;
  locationError: string | null = null;
  checkInOutLocations: CheckInOutLocation[] = [];
  showLocationMap: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private locationService: LocationService,
    private attendanceService: AttendanceService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadCheckInStatusFromServer();
    this.loadCheckInOutLocations();

    // Subscribe to location updates for real-time changes
    const locationSub = this.locationService.checkInOutLocations$.subscribe(locations => {
      this.checkInOutLocations = locations;
    });
    this.subscriptions.push(locationSub);

    // Subscribe to attendance status updates
    const statusSub = this.attendanceService.status$.subscribe(status => {
      if (status) {
        this.isCheckedIn = status.isCheckedIn;
        this.lastCheckInTime = status.lastCheckInTime ? new Date(status.lastCheckInTime) : null;
        this.lastCheckOutTime = status.lastCheckOutTime ? new Date(status.lastCheckOutTime) : null;
      }
    });
    this.subscriptions.push(statusSub);

    // Subscribe to today's records updates
    const recordsSub = this.attendanceService.todayRecords$.subscribe(records => {
      this.todayHistory = records.map(r => ({
        id: r.id,
        type: r.type === 'IN' ? 'in' : 'out',
        timestamp: new Date(r.timestamp),
        location: r.latitude && r.longitude ? {
          latitude: r.latitude,
          longitude: r.longitude,
          accuracy: r.accuracy || 0,
          timestamp: new Date(r.timestamp),
          address: r.address
        } : undefined
      }));
    });
    this.subscriptions.push(recordsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load status from server, fallback to localStorage if offline
   */
  loadCheckInStatusFromServer(): void {
    const userId = this.currentUser?.id;
    if (!userId) return;

    // First load from localStorage for immediate display
    this.loadCheckInStatusFromLocalStorage();

    // Then fetch from server
    this.attendanceService.getStatus(userId).subscribe({
      next: (status) => {
        this.isCheckedIn = status.isCheckedIn;
        this.lastCheckInTime = status.lastCheckInTime ? new Date(status.lastCheckInTime) : null;
        this.lastCheckOutTime = status.lastCheckOutTime ? new Date(status.lastCheckOutTime) : null;

        // Update localStorage cache
        this.saveStatusToLocalStorage();
      },
      error: () => {
        // Server unavailable, using localStorage data (already loaded)
        console.log('Using cached status from localStorage');
      }
    });

    // Also load today's records from server
    this.attendanceService.getTodayRecords(userId).subscribe();
  }

  /**
   * Load status from localStorage (cache/offline fallback)
   */
  loadCheckInStatusFromLocalStorage(): void {
    const userId = this.currentUser?.id;
    const storedStatus = localStorage.getItem(`checkInStatus_${userId}`);
    const storedHistory = localStorage.getItem(`checkInHistory_${userId}`);

    if (storedStatus) {
      const status = JSON.parse(storedStatus);
      this.isCheckedIn = status.isCheckedIn;
      this.lastCheckInTime = status.lastCheckInTime ? new Date(status.lastCheckInTime) : null;
      this.lastCheckOutTime = status.lastCheckOutTime ? new Date(status.lastCheckOutTime) : null;
    }

    if (storedHistory) {
      const history = JSON.parse(storedHistory);
      this.todayHistory = history.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));
      this.todayHistory = this.todayHistory.filter(record => {
        const today = new Date();
        const recordDate = new Date(record.timestamp);
        return recordDate.toDateString() === today.toDateString();
      });
    }
  }

  loadCheckInOutLocations(): void {
    this.checkInOutLocations = this.locationService.getTodayLocations();
  }

  toggleCheckInOut(): void {
    this.isLoadingLocation = true;
    this.locationError = null;

    // Get current location
    this.locationService.getCurrentLocation().subscribe({
      next: (location: LocationData) => {
        this.performCheckInOut(location);
      },
      error: (error: any) => {
        console.error('Location error:', error);

        // Handle different error codes
        if (error.code === 3) {
          this.locationError = 'Location request timed out. Using check-in without location.';
        } else if (error.code === 1) {
          this.locationError = 'Location permission denied. Using check-in without location.';
        } else if (error.code === 2) {
          this.locationError = 'Location unavailable. Using check-in without location.';
        } else {
          this.locationError = 'Failed to get location. Using check-in without location.';
        }

        // Still allow check-in without location
        this.performCheckInOut(undefined);

        // Show error message
        this.snackBar.open(this.locationError, 'Close', {duration: 5000});
      }
    });
  }

  /**
   * Perform check-in/out via API with fallback to localStorage
   */
  private performCheckInOut(location?: LocationData): void {
    const userId = this.currentUser?.id;
    if (!userId) {
      this.isLoadingLocation = false;
      return;
    }

    const request: CheckInRequest = {
      userId: userId,
      latitude: location?.latitude,
      longitude: location?.longitude,
      accuracy: location?.accuracy,
      address: location?.address
    };

    const isCheckingIn = !this.isCheckedIn;
    const apiCall = isCheckingIn
      ? this.attendanceService.checkIn(request)
      : this.attendanceService.checkOut(request);

    apiCall.subscribe({
      next: (record: CheckInRecordResponse) => {
        this.isLoadingLocation = false;

        // Update local state
        this.isCheckedIn = isCheckingIn;
        const now = new Date(record.timestamp);

        if (isCheckingIn) {
          this.lastCheckInTime = now;
          if (location) {
            this.locationService.recordCheckInOutLocation('in', location);
          }
          this.showSuccessMessage(`Check In recorded${location ? ` at ${this.formatLocation(location)}` : ''}`);
        } else {
          this.lastCheckOutTime = now;
          if (location) {
            this.locationService.recordCheckInOutLocation('out', location);
          }
          this.showSuccessMessage(`Check Out recorded${location ? ` at ${this.formatLocation(location)}` : ''}`);
        }

        // Update localStorage cache
        this.saveStatusToLocalStorage();
        this.addToLocalHistory(isCheckingIn ? 'in' : 'out', now, location);
      },
      error: (error) => {
        console.error('API check-in/out failed, falling back to localStorage:', error);

        // Fallback to localStorage-only mode
        this.performLocalCheckInOut(location);
      }
    });
  }

  /**
   * Fallback: Perform check-in/out using only localStorage (offline mode)
   */
  private performLocalCheckInOut(location?: LocationData): void {
    const now = new Date();

    this.isCheckedIn = !this.isCheckedIn;

    if (this.isCheckedIn) {
      this.lastCheckInTime = now;
      if (location) {
        this.locationService.recordCheckInOutLocation('in', location);
      }
      this.showSuccessMessage(`Check In recorded (offline)${location ? ` at ${this.formatLocation(location)}` : ''}`);
    } else {
      this.lastCheckOutTime = now;
      if (location) {
        this.locationService.recordCheckInOutLocation('out', location);
      }
      this.showSuccessMessage(`Check Out recorded (offline)${location ? ` at ${this.formatLocation(location)}` : ''}`);
    }

    this.saveStatusToLocalStorage();
    this.addToLocalHistory(this.isCheckedIn ? 'in' : 'out', now, location);
    this.isLoadingLocation = false;
  }

  /**
   * Save current status to localStorage
   */
  private saveStatusToLocalStorage(): void {
    const userId = this.currentUser?.id;
    const status = {
      isCheckedIn: this.isCheckedIn,
      lastCheckInTime: this.lastCheckInTime,
      lastCheckOutTime: this.lastCheckOutTime
    };
    localStorage.setItem(`checkInStatus_${userId}`, JSON.stringify(status));
  }

  /**
   * Add record to local history
   */
  private addToLocalHistory(type: 'in' | 'out', timestamp: Date, location?: LocationData): void {
    const userId = this.currentUser?.id;
    const newRecord: CheckRecord = {
      id: Date.now(),
      type: type,
      timestamp: timestamp,
      location: location
    };

    this.todayHistory.unshift(newRecord);
    localStorage.setItem(`checkInHistory_${userId}`, JSON.stringify(this.todayHistory));
  }

  showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  formatLocation(location: LocationData): string {
    return `(${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`;
  }

  toggleLocationMap(): void {
    this.showLocationMap = !this.showLocationMap;
  }

  openFullMap(): void {
    const dialogRef = this.dialog.open(LocationMapComponent, {
      width: '80vw',
      height: '80vh',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'location-map-dialog',
      data: null,
      disableClose: false
    });

    // Pass locations after dialog opens
    dialogRef.componentInstance.locations = this.checkInOutLocations;
    dialogRef.componentInstance.showOnlyToday = false;
  }
}
