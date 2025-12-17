import { AuthController } from './controllers/authController';
import { ThemeService } from './services/ThemeService';
import { Toast } from './views/components/Toast';
import { Header } from './views/components/Header';
import { LoginPage } from './views/pages/LoginPage';
import { RegisterPage } from './views/pages/RegisterPage';
import { DashboardPage } from './views/pages/DashboardPage';
import { TaskListPage } from './views/pages/TaskListPage';
import { CategoriesPage } from './views/pages/CategoriesPage';
import { ProfilePage } from './views/pages/ProfilePage';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Types for debugging
interface UserData {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  profile: {
    theme: string;
    notifications: boolean;
  };
}

interface StorageService {
  get<T>(key: string): Promise<T | null>;
  save<T>(key: string, data: T): Promise<void>;
}

export class TaskManagerApp {
  private authController: AuthController;
  private themeService: ThemeService;
  private header: Header | null = null;
  private currentPage: HTMLElement | null = null;
  private container: HTMLElement;

  constructor() {
    console.log('=== TaskManagerApp: Constructor START ===');
    
    this.authController = new AuthController();
    this.themeService = ThemeService.getInstance();
    this.container = document.getElementById('app') as HTMLElement;
    
    if (!this.container) {
      throw new Error('App container not found');
    }

    console.log('TaskManagerApp: Container found');
    
    // DEBUG: Log all localStorage at startup
    console.log('=== LocalStorage at startup ===');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tm_')) {
        console.log(`${key}:`, localStorage.getItem(key));
      }
    }
    
    this.initializeServices();
    this.start();

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
      console.log('TaskManagerApp: Loading screen hidden');
    }
    
    this.container.style.display = 'block';
    console.log('=== TaskManagerApp: Constructor END ===');
  }

  private initializeServices(): void {
    console.log('TaskManagerApp: Initializing services');
    this.themeService.initialize();
    Toast.initialize();
    
    // Add viewport meta tag if not present (for mobile)
    this.ensureViewportMeta();
    
    window.addEventListener('storage', (e) => {
      console.log('TaskManagerApp: Storage event detected, key:', e.key);
      if (e.key === 'tm_currentUser') {
        console.log('TaskManagerApp: Auth change detected');
        this.handleAuthChange();
      }
    });
    
    // Add custom event listener for auth changes
    window.addEventListener('auth-changed', (e: any) => {
      console.log('TaskManagerApp: Custom auth-changed event received', e.detail);
      this.handleAuthChange();
    });
    
    // Listen for navigation events from header
    window.addEventListener('navigate-to', (e: any) => {
      const page = e.detail?.page;
      if (page) {
        console.log('App.ts: Received navigate-to event for page:', page);
        this.navigateTo(page);
      }
    });
    
    // Listen for theme changes to update UI
    window.addEventListener('themechanged', () => {
      console.log('TaskManagerApp: Theme changed, refreshing header');
      if (this.header) {
        this.header.updateUserInfo();
      }
    });
    
    // Handle mobile resize
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  private ensureViewportMeta(): void {
    // Add viewport meta tag for mobile responsiveness if not present
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(viewportMeta);
      console.log('TaskManagerApp: Added viewport meta tag');
    }
  }

  private handleResize(): void {
    // Close mobile menu on resize to larger screens
    if (window.innerWidth > 768) {
      const nav = document.querySelector('.main-nav') as HTMLElement | null;
      const mobileToggle = document.querySelector('.mobile-menu-toggle') as HTMLElement | null;
      
      if (nav?.classList.contains('mobile-open')) {
        nav.classList.remove('mobile-open');
        const menuIcon = mobileToggle?.querySelector('i');
        if (menuIcon) {
          menuIcon.className = 'fas fa-bars';
        }
      }
    }
  }

  private start(): void {
    console.log('=== TaskManagerApp: start() called ===');
    this.debugAuthState();
    
    if (this.authController.isAuthenticated()) {
      console.log('TaskManagerApp: User is authenticated, showing dashboard');
      this.showAuthenticatedApp();
    } else {
      console.log('TaskManagerApp: User is NOT authenticated, showing login');
      this.showLoginPage();
    }
  }

  private debugAuthState(): void {
    console.log('=== DEBUG: Auth State ===');
    console.log('1. authController.isAuthenticated():', this.authController.isAuthenticated());
    console.log('2. authController.getCurrentUser():', this.authController.getCurrentUser());
    console.log('3. localStorage tm_currentUser:', localStorage.getItem('tm_currentUser'));
    
    // Check if user exists in tm_users
    setTimeout(async () => {
      try {
        // Access storage with proper typing
        const authControllerAny = this.authController as any;
        const storage: StorageService | undefined = authControllerAny.storage;
        
        if (storage && typeof storage.get === 'function') {
          const users = (await storage.get<UserData[]>('tm_users')) || [];
          
          if (Array.isArray(users)) {
            console.log('4. Total users in storage:', users.length);
            console.log('5. User emails:', users.map(u => u.email));
          } else {
            console.log('4. Users is not an array:', typeof users, users);
          }
        } else {
          console.log('4. Storage not available in authController');
        }
      } catch (error) {
        console.log('4. Error checking users:', error);
      }
    }, 0);
    
    console.log('=========================');
  }

  private showAuthenticatedApp(): void {
    console.log('=== TaskManagerApp: showAuthenticatedApp() START ===');
    
    // Clear everything
    this.container.innerHTML = '';
    console.log('TaskManagerApp: Container cleared');
    
    // Create header
    this.header = new Header(
      () => this.handleLogout(),
      () => this.handleThemeToggle()
    );
    
    const headerElement = this.header.render();
    this.container.appendChild(headerElement);
    console.log('TaskManagerApp: Header added');
    
    // Create main content area
    const main = document.createElement('main');
    main.id = 'main-content';
    main.className = 'main-content';
    main.style.padding = '20px';
    main.style.minHeight = 'calc(100vh - var(--header-height))';
    main.style.overflowY = 'auto';
    this.container.appendChild(main);
    console.log('TaskManagerApp: Main content area created');
    
    // Check for hash-based navigation
    const hash = window.location.hash.substring(1);
    const validPages = ['dashboard', 'tasks', 'categories', 'profile'];
    
    if (hash && validPages.includes(hash)) {
      console.log(`TaskManagerApp: Navigating to hash page: ${hash}`);
      this.navigateTo(hash, false);
    } else {
      // Show dashboard by default
      console.log('TaskManagerApp: Showing dashboard...');
      this.navigateTo('dashboard', false);
    }
    
    // Setup navigation
    this.setupNavigation();
    
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.substring(1);
      if (hash && validPages.includes(hash)) {
        this.navigateTo(hash, false);
      } else {
        this.navigateTo('dashboard', false);
      }
    });
    
    console.log('=== TaskManagerApp: showAuthenticatedApp() END ===');
  }

  private showLoginPage(): void {
    console.log('=== TaskManagerApp: showLoginPage() START ===');
    
    this.container.innerHTML = '';
    
    const loginPage = new LoginPage(
      () => {
        console.log('App.ts: onLoginSuccess callback triggered');
        this.handleLoginSuccess();
      },
      () => {
        console.log('App.ts: onRegisterClick callback triggered');
        this.showRegisterPage();
      }
    );
    
    this.container.appendChild(loginPage.render());
    loginPage.focus();
    console.log('=== TaskManagerApp: showLoginPage() END ===');
  }

  private showRegisterPage(): void {
    console.log('TaskManagerApp: showRegisterPage() called');
    
    this.container.innerHTML = '';
    
    const registerPage = new RegisterPage(
      () => {
        console.log('App.ts: onRegisterSuccess callback triggered');
        this.handleRegisterSuccess();
      },
      () => {
        console.log('App.ts: onLoginClick callback triggered');
        this.showLoginPage();
      }
    );
    
    this.container.appendChild(registerPage.render());
    registerPage.focus();
  }

  private handleLoginSuccess(): void {
    console.log('=== App.ts: handleLoginSuccess() START ===');
    
    Toast.success('Login successful! Redirecting...');
    
    // FIX 1: Force reload of auth state by creating new AuthController instance
    this.authController = new AuthController();
    
    console.log('App.ts: After refreshing AuthController:');
    console.log('- isAuthenticated:', this.authController.isAuthenticated());
    console.log('- currentUser:', this.authController.getCurrentUser());
    
    if (this.authController.isAuthenticated()) {
      console.log('App.ts: User IS authenticated, showing dashboard');
      this.showAuthenticatedApp();
    } else {
      console.error('App.ts: User still NOT authenticated after refresh');
      console.log('Checking localStorage directly...');
      
      const storedUser = localStorage.getItem('tm_currentUser');
      if (storedUser) {
        console.log('App.ts: Found user in localStorage:', storedUser);
        
        // Manually trigger authenticated app
        try {
          const userData = JSON.parse(storedUser);
          if (userData && userData.email) {
            console.log('App.ts: Manually showing authenticated app');
            this.showAuthenticatedApp();
            return;
          }
        } catch (error) {
          console.error('App.ts: Error parsing stored user:', error);
        }
      }
      
      Toast.error('Login failed to persist. Please try again.');
    }
    
    console.log('=== App.ts: handleLoginSuccess() END ===');
  }

  private handleRegisterSuccess(): void {
    console.log('App.ts: handleRegisterSuccess() called');
    Toast.success('Account created successfully!');
    
    // FIX: Same fix as login - refresh auth controller
    this.authController = new AuthController();
    this.showAuthenticatedApp();
  }

  private handleLogout(): void {
    console.log('TaskManagerApp: handleLogout() called');
    this.authController.logout();
    Toast.info('Logged out successfully');
    this.showLoginPage();
  }

  private handleThemeToggle(): void {
    console.log('TaskManagerApp: handleThemeToggle() called');
    if (this.header) {
      this.header.updateUserInfo();
    }
  }

  private handleAuthChange(): void {
    console.log('TaskManagerApp: handleAuthChange() called');
    console.log('- isAuthenticated:', this.authController.isAuthenticated());
    
    if (!this.authController.isAuthenticated()) {
      console.log('TaskManagerApp: User logged out, showing login');
      this.showLoginPage();
    } else {
      console.log('TaskManagerApp: User logged in, refreshing app');
      this.showAuthenticatedApp();
    }
  }

  private setupNavigation(): void {
    console.log('TaskManagerApp: setupNavigation() called');
    
    // Navigation click handler - using event delegation
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked element or its parent is a nav link
      let navLink: HTMLElement | null = null;
      
      // Try to find the nav link element
      if (target.closest) {
        navLink = target.closest('[data-page]');
      }
      
      // If not found via closest, check if it's an icon or text within a nav link
      if (!navLink) {
        if (target.tagName === 'I' || target.classList.contains('nav-text')) {
          // Look for parent elements that might be nav links
          let parent: HTMLElement | null = target.parentElement;
          while (parent && !navLink) {
            if (parent.hasAttribute('data-page')) {
              navLink = parent;
            }
            parent = parent.parentElement;
          }
        }
      }
      
      if (navLink) {
        e.preventDefault();
        e.stopPropagation();
        
        const page = navLink.dataset.page;
        if (page) {
          console.log('TaskManagerApp: Navigation to page:', page);
          this.navigateTo(page);
        }
      }
    });
  }

  private navigateTo(page: string, updateHistory: boolean = true): void {
    console.log(`TaskManagerApp: navigateTo("${page}") called`);
    
    const main = document.getElementById('main-content');
    if (!main) {
      console.error('TaskManagerApp: main-content not found');
      return;
    }
    
    // Update active page in header
    if (this.header) {
      this.header.setActivePage(page);
    }
    
    // Remove current page
    if (this.currentPage && this.currentPage.parentNode === main) {
      main.removeChild(this.currentPage);
    }
    
    // Create new page
    const user = this.authController.getCurrentUser();
    if (!user) {
      console.error('TaskManagerApp: No user found for navigation');
      Toast.error('Please login first');
      this.showLoginPage();
      return;
    }
    
    switch (page) {
      case 'dashboard':
        this.currentPage = new DashboardPage(
          user.id,
          (taskId) => this.showTaskDetails(taskId)
        ).render();
        break;
        
      case 'tasks':
        this.currentPage = new TaskListPage(
          user.id,
          (taskId) => this.showTaskDetails(taskId)
        ).render();
        break;
        
      case 'categories':
        this.currentPage = new CategoriesPage(user.id).render();
        break;
        
      case 'profile':
        this.currentPage = new ProfilePage().render();
        break;
        
      default:
        console.error(`TaskManagerApp: Unknown page: ${page}`);
        this.currentPage = this.createPlaceholderPage('Page Not Found', 'The requested page is not available');
        break;
    }
    
    // Add new page
    main.appendChild(this.currentPage);
    
    // Update URL
    if (updateHistory) {
      window.history.pushState(null, '', `#${page}`);
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    console.log(`TaskManagerApp: Navigation to ${page} complete`);
  }

  private createPlaceholderPage(title: string, message: string): HTMLElement {
    const div = document.createElement('div');
    div.className = 'placeholder-page';
    div.innerHTML = `
      <div class="text-center" style="padding: 50px 20px;">
        <h1>${title}</h1>
        <p>${message}</p>
        <button id="go-to-dashboard" class="btn btn-primary">
          Go to Dashboard
        </button>
      </div>
    `;
    
    // Add event listener to the button
    setTimeout(() => {
      const button = div.querySelector('#go-to-dashboard');
      if (button) {
        button.addEventListener('click', () => {
          this.navigateTo('dashboard');
        });
      }
    }, 100);
    
    return div;
  }

  private showTaskDetails(taskId: string): void {
    console.log('TaskManagerApp: showTaskDetails for task:', taskId);
    Toast.info(`Task details: ${taskId}`);
  }
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== DOMContentLoaded: Starting TaskManagerApp ===');
  
  // Clear any old debug indicators
  const oldIndicators = document.querySelectorAll('[style*="position: fixed"][style*="top: 10px"]');
  oldIndicators.forEach(el => el.remove());
  
  try {
    new TaskManagerApp();
  } catch (error) {
    console.error('Failed to start app:', error);
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = `
        <div class="error-screen">
          <h1>Application Error</h1>
          <p>${error}</p>
          <button onclick="location.reload()" class="btn btn-primary">Refresh Page</button>
        </div>
      `;
      appContainer.style.display = 'block';
    }
  }
});