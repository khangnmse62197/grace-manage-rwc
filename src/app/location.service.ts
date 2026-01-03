import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

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

  constructor() {
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
        timeout: 10000,
        maximumAge: 0
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
      timeout: 10000,
      maximumAge: 0
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
   * Record check-in/out location
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

    // Persist to localStorage
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
   * Load stored locations from localStorage
   */
  private loadStoredLocations(): void {
    const userId = this.getCurrentUserId();
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
}

