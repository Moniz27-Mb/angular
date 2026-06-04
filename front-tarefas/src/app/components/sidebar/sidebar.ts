import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.open]="isMobileMenuOpen">
      <div class="sidebar-logo">
        <span class="logo-text">Fanya</span>
        <button class="mobile-close" (click)="toggleMobileMenu()">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <span class="section-title">Principal</span>
          
          <button *ngIf="user?.is_admin" class="nav-item" (click)="selectMenu('overview')" [class.active]="activeItem === 'overview'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span>Visão Geral</span>
          </button>

          <button *ngIf="!user?.is_admin" class="nav-item" routerLink="/tarefas" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            <span>Minhas Tarefas</span>
          </button>
        </div>

        <div class="nav-section" *ngIf="user?.is_admin">
          <span class="section-title">Gestão</span>
          <button class="nav-item" (click)="selectMenu('users')" [class.active]="activeItem === 'users'">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            <span>Usuários</span>
          </button>
        </div>

        <div class="nav-section">
          <span class="section-title">Conta</span>
<button class="nav-item" routerLink="/perfil" routerLinkActive="active">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  <span>Configurações</span>
</button>
          <button class="nav-item logout" (click)="logout()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Sair</span>
          </button>
        </div>
      </nav>
    </aside>

    <!-- Overlay para mobile -->
    <div class="sidebar-overlay" *ngIf="isMobileMenuOpen" (click)="toggleMobileMenu()"></div>

    <!-- Mobile Header (Trigger) -->
    <div class="mobile-header">
       <button class="hamburger" (click)="toggleMobileMenu()">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
       </button>
       <span class="mobile-logo">Fanya</span>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, var(--color-bg-dark) 0%, var(--color-bg-dark-soft) 100%);
      color: white;
      display: flex;
      flex-direction: column;
      padding: 2.5rem 1.5rem;
      position: fixed;
      height: 100vh;
      z-index: 1000;
      box-shadow: 10px 0 30px rgba(0, 0, 0, 0.2);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-logo {
      margin-bottom: 3.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-left: 0.75rem;
      
      .logo-text {
        font-size: 1.75rem;
        font-weight: 800;
        font-family: var(--font-family-display);
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        letter-spacing: -0.04em;
      }

      .mobile-close {
        display: none;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        cursor: pointer;
        align-items: center;
        justify-content: center;
      }
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      flex: 1;

      .nav-section {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;

        .section-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 0.75rem;
          padding-left: 1rem;
          font-weight: 800;
        }
      }

      .nav-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.875rem 1.125rem;
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.5);
        border-radius: 14px;
        cursor: pointer;
        font-size: 0.9375rem;
        font-weight: 600;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        text-align: left;
        width: 100%;
        text-decoration: none;

        svg { 
          opacity: 0.5; 
          transition: all 0.25s ease; 
          color: white;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          svg { opacity: 1; transform: translateX(2px); }
        }

        &.active {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
          color: white;
          box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
          svg { opacity: 1; }
        }

        &.logout {
          margin-top: auto;
          color: rgba(239, 68, 68, 0.7);
          svg { color: var(--color-danger); }
          &:hover { 
            color: #ef4444; 
            background: rgba(239, 68, 68, 0.1); 
            svg { opacity: 1; }
          }
        }
      }
    }

    .mobile-header {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 70px;
      background: var(--color-bg-dark);
      padding: 0 1.5rem;
      align-items: center;
      gap: 1rem;
      z-index: 900;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);

      .hamburger {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }

      .mobile-logo {
        font-weight: 800;
        font-size: 1.5rem;
        font-family: var(--font-family-display);
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .sidebar-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 950;
      backdrop-filter: blur(4px);
    }

    @media (max-width: 992px) {
      .sidebar {
        transform: translateX(-100%);
        &.open { transform: translateX(0); }
      }

      .sidebar-logo .mobile-close { display: block; }
      .mobile-header { display: flex; }
    }
  `]
})
export class SidebarComponent implements OnInit {
  public authService = inject(AuthService);
  public router = inject(Router);

  @Input() activeItem: string = '';
  @Output() menuSelected = new EventEmitter<string>();

  user: any = null;
  isMobileMenuOpen = false;

  constructor() {}

  ngOnInit() {
    this.authService.user$.subscribe(user => this.user = user);
  }

  selectMenu(menu: string) {
    this.menuSelected.emit(menu);
    this.isMobileMenuOpen = false;
    
    if (menu === 'perfil') {
      this.router.navigate(['/perfil']);
    } else if (menu === 'overview' || menu === 'users') {
      if (!this.router.url.startsWith('/admin')) {
        this.router.navigate(['/admin'], { queryParams: { tab: menu } });
      }
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.authService.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }
}
