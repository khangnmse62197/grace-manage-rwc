import {Component, OnInit} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {CheckInOutRecord, Employee, EmployeeService} from '../employee.service';

interface DayHistory {
  date: Date;
  records: CheckInOutRecord[];
  totalHours: string;
}

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.scss'
})
export class EmployeeDetailComponent implements OnInit {
  employee: Employee | null = null;
  history: CheckInOutRecord[] = [];
  groupedHistory: DayHistory[] = [];

  constructor(
    private route: ActivatedRoute,
    private employeeService: EmployeeService,
    private location: Location
  ) {
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.employee = this.employeeService.getEmployeeById(id) || null;
      if (this.employee) {
        this.history = this.employeeService.getEmployeeHistory(id);
        this.groupedHistory = this.groupHistoryByDay(this.history);
      }
    }
  }

  goBack(): void {
    this.location.back();
  }

  private groupHistoryByDay(records: CheckInOutRecord[]): DayHistory[] {
    const grouped = new Map<string, CheckInOutRecord[]>();

    // Group records by date
    records.forEach(record => {
      const dateKey = new Date(record.timestamp).toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(record);
    });

    // Convert to array and calculate total hours
    const result: DayHistory[] = [];
    grouped.forEach((dayRecords, dateKey) => {
      const date = new Date(dateKey);
      const sortedRecords = dayRecords.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const totalHours = this.calculateTotalHours(sortedRecords);

      result.push({
        date,
        records: sortedRecords,
        totalHours
      });
    });

    // Sort by date descending (most recent first)
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private calculateTotalHours(records: CheckInOutRecord[]): string {
    let totalMinutes = 0;
    let lastCheckIn: Date | null = null;

    records.forEach(record => {
      if (record.type === 'in') {
        lastCheckIn = new Date(record.timestamp);
      } else if (record.type === 'out' && lastCheckIn) {
        const checkOut = new Date(record.timestamp);
        const diffMs = checkOut.getTime() - lastCheckIn.getTime();
        totalMinutes += diffMs / (1000 * 60);
        lastCheckIn = null;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    return `${hours}h${minutes.toString().padStart(2, '0')}'`;
  }
}
