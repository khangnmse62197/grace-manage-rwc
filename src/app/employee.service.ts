import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private employees: Employee[] = [];
  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  public employees$ = this.employeesSubject.asObservable();

  constructor() {
    this.loadEmployees();
  }

  getEmployees(): Observable<Employee[]> {
    return this.employees$;
  }

  getEmployeeById(id: number): Employee | undefined {
    return this.employees.find(emp => emp.id === id);
  }

  getAllEmployees(): Employee[] {
    return this.employees;
  }

  addEmployee(employee: Omit<Employee, 'id'>): Employee {
    const newEmployee: Employee = {
      ...employee,
      id: this.generateId()
    };
    this.employees.push(newEmployee);
    this.saveEmployees();
    return newEmployee;
  }

  updateEmployee(id: number, updates: Partial<Employee>): Employee | null {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employees[index] = {...this.employees[index], ...updates};
      this.saveEmployees();
      return this.employees[index];
    }
    return null;
  }

  deleteEmployee(id: number): boolean {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employees.splice(index, 1);
      this.saveEmployees();
      return true;
    }
    return false;
  }

  // Check-in/out history methods
  getEmployeeHistory(employeeId: number): CheckInOutRecord[] {
    const historyKey = `employeeHistory_${employeeId}`;
    const stored = localStorage.getItem(historyKey);

    if (stored) {
      return JSON.parse(stored).map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));
    }

    // Generate sample history for demo purposes
    return this.generateSampleHistory(employeeId);
  }

  addCheckInOutRecord(employeeId: number, type: 'in' | 'out'): void {
    const history = this.getEmployeeHistory(employeeId);
    const newRecord: CheckInOutRecord = {
      id: history.length > 0 ? Math.max(...history.map(r => r.id)) + 1 : 1,
      employeeId: employeeId,
      type: type,
      timestamp: new Date()
    };

    history.unshift(newRecord);

    const historyKey = `employeeHistory_${employeeId}`;
    localStorage.setItem(historyKey, JSON.stringify(history));

    // Update employee's last check in/out time
    if (type === 'in') {
      this.updateEmployee(employeeId, {lastCheckInTime: newRecord.timestamp});
    } else {
      this.updateEmployee(employeeId, {lastCheckOutTime: newRecord.timestamp});
    }
  }

  private loadEmployees(): void {
    const stored = localStorage.getItem('employees');
    if (stored) {
      this.employees = JSON.parse(stored).map((emp: any) => ({
        ...emp,
        lastCheckInTime: emp.lastCheckInTime ? new Date(emp.lastCheckInTime) : null,
        lastCheckOutTime: emp.lastCheckOutTime ? new Date(emp.lastCheckOutTime) : null
      }));
    } else {
      // Initialize with sample data
      this.employees = [
        {
          id: 1,
          fullName: 'John Doe',
          age: 30,
          roleId: 1,
          lastCheckInTime: new Date('2026-01-02T08:30:00'),
          lastCheckOutTime: new Date('2026-01-01T17:45:00'),
          username: 'john.doe',
          password: 'hashed_JohnDoe123!'
        },
        {
          id: 2,
          fullName: 'Jane Smith',
          age: 28,
          roleId: 2,
          lastCheckInTime: new Date('2026-01-02T09:00:00'),
          lastCheckOutTime: new Date('2026-01-01T18:00:00'),
          username: 'jane.smith',
          password: 'hashed_JaneSmith123!'
        },
        {
          id: 3,
          fullName: 'Mike Johnson',
          age: 35,
          roleId: 2,
          lastCheckInTime: new Date('2026-01-02T08:00:00'),
          lastCheckOutTime: new Date('2026-01-01T17:30:00'),
          username: 'mike.johnson',
          password: 'hashed_MikeJohnson123!'
        }
      ];
      this.saveEmployees();
    }
    this.employeesSubject.next(this.employees);
  }

  private saveEmployees(): void {
    localStorage.setItem('employees', JSON.stringify(this.employees));
    this.employeesSubject.next(this.employees);
  }

  private generateId(): number {
    return this.employees.length > 0
      ? Math.max(...this.employees.map(emp => emp.id)) + 1
      : 1;
  }

  private generateSampleHistory(employeeId: number): CheckInOutRecord[] {
    const history: CheckInOutRecord[] = [];
    const today = new Date();

    // Generate 7 days of history
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Check in (morning)
      const checkInTime = new Date(date);
      checkInTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);

      history.push({
        id: history.length + 1,
        employeeId: employeeId,
        type: 'in',
        timestamp: checkInTime
      });

      // Check out (evening)
      const checkOutTime = new Date(date);
      checkOutTime.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0);

      history.push({
        id: history.length + 1,
        employeeId: employeeId,
        type: 'out',
        timestamp: checkOutTime
      });
    }

    // Save generated history
    const historyKey = `employeeHistory_${employeeId}`;
    localStorage.setItem(historyKey, JSON.stringify(history));

    return history;
  }
}
