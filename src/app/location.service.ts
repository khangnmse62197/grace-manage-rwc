import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';
import {AttendanceService, CheckInRecordResponse} from './attendance.service';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  address?: string;
}

export interface CheckInOutLocation {
  id: number;
  type: 'in' | 'out';
  location: LocationData;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private currentLocationSubject = new BehaviorSubject<LocationData | null>(null);
  public currentLocation$ = this.currentLocationSubject.asObservable();

  private checkInOutLocationsSubject = new BehaviorSubject<CheckInOutLocation[]>([]);
  public checkInOutLocations$ = this.checkInOutLocationsSubject.asObservable();

  private geolocationAvailable = 'geolocation' in navigator;
  private isLoadingFromServer = false;

  constructor(private attendanceService: AttendanceService) {
    this.loadStoredLocations();
    // Request permission and start tracking the current location
    if (this.geolocationAvailable) {
      this.requestLocationPermission();
    }
  }

  /**
   * Request user permission for location access
   */
  requestLocationPermission(): void {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({name: 'geolocation'}).then(result => {
        if (result.state === 'granted' || result.state === 'prompt') {
          this.getCurrentLocation();
        }
      });
    }
  }

  /**
   * Get current location (one-time request)
   */
  getCurrentLocation(): Observable<LocationData> {
    return new Observable(observer => {
      if (!this.geolocationAvailable) {
        observer.error(new Error('Geolocation is not available in this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          };
          this.currentLocationSubject.next(location);
          observer.next(location);
          observer.complete();
        },
        (error) => {
          console.error('Error getting location:', error);
          observer.error(error);
        },
        options
      );
    });
  }

  /**
   * Watch location continuously (for real-time tracking)
   */
  watchLocation(): number | null {
    if (!this.geolocationAvailable) {
      return null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 5000
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        const location: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };
        this.currentLocationSubject.next(location);
      },
      (error) => {
        console.error('Error watching location:', error);
      },
      options
    );
  }

  /**
   * Stop watching location
   */
  stopWatchingLocation(watchId: number): void {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /**
   * Record check-in/out location (updates local cache)
   */
  recordCheckInOutLocation(type: 'in' | 'out', location: LocationData): void {
    const userId = this.getCurrentUserId();
    const record: CheckInOutLocation = {
      id: Date.now(),
      type: type,
      location: location,
      timestamp: new Date()
    };

    const locations = this.checkInOutLocationsSubject.value;
    locations.push(record);
    this.checkInOutLocationsSubject.next(locations);

    // Persist to localStorage as cache
    localStorage.setItem(
      `checkInOutLocations_${userId}`,
      JSON.stringify(locations)
    );
  }

  /**
   * Get all check-in/out locations for today
   */
  getTodayLocations(): CheckInOutLocation[] {
    const locations = this.checkInOutLocationsSubject.value;
    const today = new Date();

    return locations.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate.toDateString() === today.toDateString();
    });
  }

  /**
   * Get all check-in/out locations for user
   */
  getAllLocations(): CheckInOutLocation[] {
    return this.checkInOutLocationsSubject.value;
  }

  /**
   * Get locations between dates
   */
  getLocationsBetweenDates(startDate: Date, endDate: Date): CheckInOutLocation[] {
    return this.checkInOutLocationsSubject.value.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }

  /**
   * Fetch location history from server
   */
  fetchHistoryFromServer(userId: number, startDate?: Date, endDate?: Date): Observable<CheckInOutLocation[]> {
    this.isLoadingFromServer = true;

    return this.attendanceService.getHistory(userId, startDate, endDate).pipe(
      map(records => this.mapApiResponseToLocations(records)),
      tap(locations => {
        this.isLoadingFromServer = false;
        // Update local cache
        const existingLocations = this.checkInOutLocationsSubject.value;
        const merged = this.mergeLocations(existingLocations, locations);
        this.checkInOutLocationsSubject.next(merged);
        // Update localStorage cache
        localStorage.setItem(
          `checkInOutLocations_${userId}`,
          JSON.stringify(merged)
        );
      }),
      catchError(error => {
        this.isLoadingFromServer = false;
        console.error('Failed to fetch history from server:', error);
        // Return cached data on error
        return of(this.checkInOutLocationsSubject.value);
      })
    );
  }

  /**
   * Fetch today's locations from server
   */
  fetchTodayFromServer(userId: number): Observable<CheckInOutLocation[]> {
    return this.attendanceService.getTodayRecords(userId).pipe(
      map(records => this.mapApiResponseToLocations(records)),
      tap(locations => {
        // Update today's records in cache
        const today = new Date();
        const existingNonToday = this.checkInOutLocationsSubject.value.filter(loc => {
          const locDate = new Date(loc.timestamp);
          return locDate.toDateString() !== today.toDateString();
        });
        const merged = [...existingNonToday, ...locations];
        this.checkInOutLocationsSubject.next(merged);
      }),
      catchError(error => {
        console.error('Failed to fetch today records from server:', error);
        return of(this.getTodayLocations());
      })
    );
  }

  /**
   * Check if currently loading from server
   */
  isLoading(): boolean {
    return this.isLoadingFromServer;
  }

  /**
   * Map API response to CheckInOutLocation format
   */
  private mapApiResponseToLocations(records: CheckInRecordResponse[]): CheckInOutLocation[] {
    return records
      .filter(r => r.latitude != null && r.longitude != null)
      .map(r => ({
        id: r.id,
        type: r.type === 'IN' ? 'in' as const : 'out' as const,
        location: {
          latitude: r.latitude!,
          longitude: r.longitude!,
          accuracy: r.accuracy || 0,
          timestamp: new Date(r.timestamp),
          address: r.address
        },
        timestamp: new Date(r.timestamp)
      }));
  }

  /**
   * Get reverse geocoding (convert coordinates to address)
   * Note: This would typically call a backend service or a geocoding API
   */
  getAddressFromCoordinates(lat: number, lng: number): Observable<string> {
    return new Observable(observer => {
      // This is a placeholder - in production, call a geocoding service
      // For now, we'll use OpenStreetMap Nominatim (free, no API key needed)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

      // Note: CORS might be an issue. For production, use a backend proxy or Google Maps API with key
      fetch(url)
        .then(response => response.json())
        .then(data => {
          const address = data.address?.city || data.address?.village || 'Unknown location';
          observer.next(address);
          observer.complete();
        })
        .catch(error => {
          console.error('Error getting address:', error);
          observer.next('Location tracked');
          observer.complete();
        });
    });
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Clear all location data for a user (admin function)
   */
  clearAllLocations(): void {
    const userId = this.getCurrentUserId();
    localStorage.removeItem(`checkInOutLocations_${userId}`);
    this.checkInOutLocationsSubject.next([]);
  }

  /**
   * Add test/demo locations for testing purposes
   */
  addTestLocations(): void {
    const now = new Date();
    const testLocations: CheckInOutLocation[] = [
      {
        id: 1,
        type: 'in',
        location: {
          latitude: 10.776589,
          longitude: 106.696540,
          accuracy: 5,
          timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        id: 2,
        type: 'out',
        location: {
          latitude: 10.777000,
          longitude: 106.697000,
          accuracy: 8,
          timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000) // 1 hour ago
        },
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      },
      {
        id: 3,
        type: 'in',
        location: {
          latitude: 10.776200,
          longitude: 106.696800,
          accuracy: 6,
          timestamp: new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes ago
        },
        timestamp: new Date(now.getTime() - 30 * 60 * 1000)
      }
    ];

    const userId = this.getCurrentUserId();
    this.checkInOutLocationsSubject.next(testLocations);
    localStorage.setItem(
      `checkInOutLocations_${userId}`,
      JSON.stringify(testLocations)
    );
  }

  /**
   * Merge locations avoiding duplicates
   */
  private mergeLocations(existing: CheckInOutLocation[], incoming: CheckInOutLocation[]): CheckInOutLocation[] {
    const existingIds = new Set(existing.map(l => l.id));
    const newLocations = incoming.filter(l => !existingIds.has(l.id));
    return [...existing, ...newLocations].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string {
    // This should match your AuthService implementation
    const user = localStorage.getItem('currentUser');
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        // Convert to string to ensure consistent localStorage key format
        return String(parsedUser.id);
      } catch {
        return 'unknown-user';
      }
    }
    return 'unknown-user';
  }

  /**
   * Load stored locations - first from localStorage, then sync from server
   */
  private loadStoredLocations(): void {
    const userId = this.getCurrentUserId();

    // First, load from localStorage for immediate display
    const stored = localStorage.getItem(`checkInOutLocations_${userId}`);
    if (stored) {
      try {
        const locations = JSON.parse(stored).map((record: any) => ({
          ...record,
          timestamp: new Date(record.timestamp),
          location: {
            ...record.location,
            timestamp: new Date(record.location.timestamp)
          }
        }));
        this.checkInOutLocationsSubject.next(locations);
      } catch (error) {
        console.error('Error loading stored locations:', error);
      }
    }

    // Then, fetch from server to get latest data
    const userIdNum = parseInt(userId, 10);
    if (!isNaN(userIdNum)) {
      // Fetch last 30 days of history
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      this.fetchHistoryFromServer(userIdNum, startDate, endDate).subscribe();
    }
  }
}
