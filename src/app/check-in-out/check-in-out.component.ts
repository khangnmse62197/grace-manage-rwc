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
    MatSnackBarModule,
    LocationMapComponent
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

  constructor(
    private authService: AuthService,
    private locationService: LocationService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadCheckInStatus();
    this.loadCheckInOutLocations();

    // Subscribe to location updates for real-time changes
    this.locationService.checkInOutLocations$.subscribe(locations => {
      this.checkInOutLocations = locations;
    });
  }

  ngOnDestroy(): void {
    // Clean up if needed
  }

  loadCheckInStatus(): void {
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
        const userId = this.currentUser?.id;
        const now = new Date();

        this.isCheckedIn = !this.isCheckedIn;

        if (this.isCheckedIn) {
          this.lastCheckInTime = now;
          this.addToHistory('in', now, location);
          this.locationService.recordCheckInOutLocation('in', location);
          this.showSuccessMessage(`Check In recorded at ${this.formatLocation(location)}`);
        } else {
          this.lastCheckOutTime = now;
          this.addToHistory('out', now, location);
          this.locationService.recordCheckInOutLocation('out', location);
          this.showSuccessMessage(`Check Out recorded at ${this.formatLocation(location)}`);
        }

        // Save to localStorage
        const status = {
          isCheckedIn: this.isCheckedIn,
          lastCheckInTime: this.lastCheckInTime,
          lastCheckOutTime: this.lastCheckOutTime
        };
        localStorage.setItem(`checkInStatus_${userId}`, JSON.stringify(status));
        this.isLoadingLocation = false;
      },
      error: (error: any) => {
        this.isLoadingLocation = false;
        this.locationError = 'Failed to get location. Using check-in without location.';
        console.error('Location error:', error);

        // Still allow check-in without location
        const userId = this.currentUser?.id;
        const now = new Date();

        this.isCheckedIn = !this.isCheckedIn;

        if (this.isCheckedIn) {
          this.lastCheckInTime = now;
          this.addToHistory('in', now);
          this.showSuccessMessage('Check In recorded (location unavailable)');
        } else {
          this.lastCheckOutTime = now;
          this.addToHistory('out', now);
          this.showSuccessMessage('Check Out recorded (location unavailable)');
        }

        const status = {
          isCheckedIn: this.isCheckedIn,
          lastCheckInTime: this.lastCheckInTime,
          lastCheckOutTime: this.lastCheckOutTime
        };
        localStorage.setItem(`checkInStatus_${userId}`, JSON.stringify(status));

        // Show error message
        this.snackBar.open(this.locationError, 'Close', {duration: 5000});
      }
    });
  }

  addToHistory(type: 'in' | 'out', timestamp: Date, location?: LocationData): void {
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
      width: '95vw',
      height: '95vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'full-screen-dialog',
      data: null
    });

    // Pass locations after dialog opens
    dialogRef.componentInstance.locations = this.checkInOutLocations;
    dialogRef.componentInstance.showOnlyToday = false;
  }
}

