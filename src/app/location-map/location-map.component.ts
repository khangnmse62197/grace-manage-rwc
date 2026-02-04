import {AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatTabsModule} from '@angular/material/tabs';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatListModule} from '@angular/material/list';
import {MatDividerModule} from '@angular/material/divider';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatDialogRef} from '@angular/material/dialog';
import {CheckInOutLocation, LocationService} from '../location.service';
import {AttendanceService} from '../attendance.service';
import {AuthService} from '../auth.service';
import {Subscription} from 'rxjs';
import L from 'leaflet';

// Fix for Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

@Component({
  selector: 'app-location-map',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './location-map.component.html',
  styleUrl: './location-map.component.scss'
})
export class LocationMapComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input() locations: CheckInOutLocation[] = [];
  @Input() showOnlyToday: boolean = true;

  map: L.Map | null = null;
  markers: L.Marker[] = [];
  selectedLocation: CheckInOutLocation | null = null;
  isLoading = false;
  private viewInitialized = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private locationService: LocationService,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    public dialogRef: MatDialogRef<LocationMapComponent>
  ) {
  }

  ngOnInit(): void {
    // Fetch location history from server when component opens
    this.loadHistoryFromServer();

    // Subscribe to location updates from LocationService
    const locSub = this.locationService.checkInOutLocations$.subscribe(locations => {
      if (locations.length > 0 && !this.isLoading) {
        this.locations = locations;
        if (this.viewInitialized && this.map) {
          this.refreshMap();
        }
      }
    });
    this.subscriptions.push(locSub);
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    if (!this.isLoading) {
      this.initializeMap();
      this.addMarkersToMap();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['locations'] && !changes['locations'].firstChange) {
      if (this.viewInitialized) {
        // Locations changed after initialization and view is ready
        if (this.map) {
          this.map.remove();
          this.map = null;
        }
        // Reinitialize with new locations
        setTimeout(() => {
          this.initializeMap();
          this.addMarkersToMap();
        }, 100);
      }
    }
  }

  /**
   * Refresh map with current data
   */
  refreshMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markers = [];
    setTimeout(() => {
      this.initializeMap();
      this.addMarkersToMap();
    }, 100);
  }

  /**
   * Get grouped locations for display
   */
  getGroupedLocations(): { date: string; locations: CheckInOutLocation[] }[] {
    const grouped = this.groupLocationsByDate();
    return Object.keys(grouped)
      .sort()
      .reverse()
      .map(date => ({
        date,
        locations: grouped[date].sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }));
  }

  /**
   * Format location for display
   */
  formatLocation(location: CheckInOutLocation): string {
    const type = location.type === 'in' ? 'Check In' : 'Check Out';
    const time = new Date(location.timestamp).toLocaleTimeString();
    const accuracy = location.location.accuracy.toFixed(0);
    return `${type} at ${time} (±${accuracy}m accuracy)`;
  }

  /**
   * Copy coordinates to clipboard
   */
  copyCoordinates(location: CheckInOutLocation): void {
    const coords = `${location.location.latitude.toFixed(5)}, ${location.location.longitude.toFixed(5)}`;
    navigator.clipboard.writeText(coords);
  }

  /**
   * Open location in Google Maps
   */
  openInGoogleMaps(location: CheckInOutLocation): void {
    const url = `https://maps.google.com/?q=${location.location.latitude},${location.location.longitude}`;
    window.open(url, '_blank');
  }

  /**
   * Open location in OpenStreetMap
   */
  openInOSM(location: CheckInOutLocation): void {
    const url = `https://www.openstreetmap.org/?mlat=${location.location.latitude}&mlon=${location.location.longitude}&zoom=15`;
    window.open(url, '_blank');
  }

  /**
   * Reload data from server
   */
  reloadFromServer(): void {
    this.loadHistoryFromServer();
  }

  /**
   * Fetch location history from server
   */
  private loadHistoryFromServer(): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) return;

    this.isLoading = true;

    // Fetch last 30 days of history
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    this.attendanceService.getHistory(userId, startDate, endDate).subscribe({
      next: (records) => {
        // Map API response to CheckInOutLocation format
        const serverLocations: CheckInOutLocation[] = records
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

        this.locations = serverLocations;
        this.isLoading = false;

        // Refresh map with server data
        if (this.viewInitialized) {
          this.refreshMap();
        }
      },
      error: (error) => {
        console.error('Failed to load history from server:', error);
        this.isLoading = false;
        // Keep using local data as fallback
      }
    });
  }

  /**
   * Calculate total duration between check-ins and check-outs
   */
  calculateTotalDuration(): string {
    if (this.locations.length < 2) {
      return 'N/A';
    }

    const checkIns = this.locations.filter(l => l.type === 'in').sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const checkOuts = this.locations.filter(l => l.type === 'out').sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let totalMinutes = 0;

    // Pair check-ins with check-outs
    for (let i = 0; i < Math.min(checkIns.length, checkOuts.length); i++) {
      const checkIn = new Date(checkIns[i].timestamp).getTime();
      const checkOut = new Date(checkOuts[i].timestamp).getTime();
      if (checkOut > checkIn) {
        totalMinutes += (checkOut - checkIn) / (1000 * 60);
      }
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);

    return `${hours}h ${minutes}m`;
  }

  /**
   * Get count of check-ins
   */
  getCheckInCount(): number {
    return this.locations.filter(l => l.type === 'in').length;
  }

  /**
   * Get count of check-outs
   */
  getCheckOutCount(): number {
    return this.locations.filter(l => l.type === 'out').length;
  }

  /**
   * Get average accuracy of locations
   */
  getAverageAccuracy(): string {
    if (this.locations.length === 0) {
      return 'N/A';
    }
    const total = this.locations.reduce((sum, loc) => sum + loc.location.accuracy, 0);
    const avg = total / this.locations.length;
    return avg.toFixed(0);
  }

  /**
   * Get first check-in time
   */
  getFirstCheckInTime(): Date | null {
    if (this.locations.length === 0) {
      return null;
    }
    const sorted = [...this.locations].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return new Date(sorted[sorted.length - 1].timestamp);
  }

  /**
   * Initialize the Leaflet map
   */
  private initializeMap(): void {
    if (!this.locations || this.locations.length === 0) {
      return;
    }

    const mapElement = document.getElementById('check-in-map');
    if (!mapElement) {
      console.error('Map element not found');
      return;
    }

    // Get center coordinates from first location
    const firstLocation = this.locations[0].location;
    const center: L.LatLngExpression = [firstLocation.latitude, firstLocation.longitude];

    this.map = L.map('check-in-map').setView(center, 15);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);
  }

  /**
   * Add markers to the map for all check-in/out locations
   */
  private addMarkersToMap(): void {
    if (!this.map) {
      return;
    }

    // Clear existing markers
    this.markers.forEach(marker => this.map?.removeLayer(marker));
    this.markers = [];

    if (this.locations.length === 0) {
      return;
    }

    // Group by date
    const groupedByDate = this.groupLocationsByDate();
    const dates = Object.keys(groupedByDate).sort().reverse();

    dates.forEach((date, dateIndex) => {
      const dailyLocations = groupedByDate[date];

      dailyLocations.forEach((location, index) => {
        const coords: L.LatLngExpression = [
          location.location.latitude,
          location.location.longitude
        ];

        // Create custom icon based on check-in/out type
        const iconColor = location.type === 'in' ? '#4caf50' : '#ff9800';
        const iconHtml = `
          <div style="
            background-color: ${iconColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">
            ${location.type === 'in' ? '→' : '←'}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          iconSize: [32, 32],
          className: 'custom-marker'
        });

        const marker = L.marker(coords, {
          icon: customIcon,
          title: `${location.type === 'in' ? 'Check In' : 'Check Out'} - ${new Date(location.timestamp).toLocaleTimeString()}`
        });

        marker.bindPopup(this.createPopupContent(location));

        marker.on('click', () => {
          this.selectedLocation = location;
        });

        marker.addTo(this.map!);
        this.markers.push(marker);
      });
    });

    // Fit map to all markers
    if (this.markers.length > 0) {
      const bounds = L.latLngBounds(
        this.markers.map(m => m.getLatLng())
      );
      this.map.fitBounds(bounds, {padding: [50, 50]});
    }
  }

  /**
   * Create popup content for a location marker
   */
  private createPopupContent(location: CheckInOutLocation): string {
    const time = new Date(location.timestamp).toLocaleString();
    const type = location.type === 'in' ? 'Check In' : 'Check Out';
    const accuracy = location.location.accuracy.toFixed(0);

    return `
      <div class="popup-content">
        <strong>${type}</strong><br>
        <small>Time: ${time}</small><br>
        <small>Accuracy: ±${accuracy}m</small><br>
        <small>Lat: ${location.location.latitude.toFixed(5)}</small><br>
        <small>Lng: ${location.location.longitude.toFixed(5)}</small>
      </div>
    `;
  }

  /**
   * Group locations by date
   */
  private groupLocationsByDate(): { [key: string]: CheckInOutLocation[] } {
    const grouped: { [key: string]: CheckInOutLocation[] } = {};

    this.locations.forEach(location => {
      const date = new Date(location.timestamp).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(location);
    });

    return grouped;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
