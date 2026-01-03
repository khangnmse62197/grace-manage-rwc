import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {AuthService, User} from '../auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;
  isAdmin: boolean = false;
  isMenuCollapsed: boolean = false;
  isMobile: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.checkMobile();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();

    // Auto-collapse on mobile
    if (this.isMobile) {
      this.isMenuCollapsed = true;
    }

    // Listen for window resize
    window.addEventListener('resize', () => {
      this.checkMobile();
    });
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.isMenuCollapsed = true;
    }
  }

  closeMenuOnMobile(): void {
    if (this.isMobile) {
      this.isMenuCollapsed = true;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
