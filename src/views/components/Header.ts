import { ThemeService } from '../../services/ThemeService';
import { AuthController } from '../../controllers/authController';
import { AvatarService } from '../../services/AvatarService';
import { User } from '../../types';

// Define custom event types
declare global {
  interface WindowEventMap {
    'profile-updated': CustomEvent<{ username: string }>;
    'avatar-updated': CustomEvent;
  }
}

export class Header {
  private element: HTMLElement;
  private authController: AuthController;
  private themeService: ThemeService;
  private avatarService: AvatarService;
  private userNameElement: HTMLElement | null = null;
  private avatarElement: HTMLElement | null = null;
  private navElement: HTMLElement | null = null;
  private mobileToggleElement: HTMLElement | null = null;
  private themeToggleElement: HTMLElement | null = null;

  constructor(private onLogout: () => void, private onThemeToggle: () => void) {
    this.authController = new AuthController();
    this.themeService = ThemeService.getInstance();
    this.avatarService = AvatarService.getInstance();
    this.element = this.createHeader();
    
    // Fix any corrupted avatar data on initialization
    this.avatarService.migrateAndFixAvatarData().catch(console.error);
    
    // Listen for storage changes to update user info
    this.setupStorageListener();
    this.setupEventListeners();
    
    // Debug mobile layout
    setTimeout(() => this.debugLayout(), 500);
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('header');
    header.className = 'app-header';

    // Create inner container for better layout
    const headerInner = document.createElement('div');
    headerInner.className = 'header-inner';

    // Logo/Title - left side
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';

    const logo = document.createElement('h1');
    logo.textContent = 'Task Manager';
    logo.className = 'app-logo';
    logoContainer.appendChild(logo);

    // Navigation - center (visible on desktop, hidden on mobile)
    const nav = document.createElement('nav');
    nav.className = 'main-nav';
    this.navElement = nav;

    const navList = document.createElement('ul');
    navList.className = 'nav-list';

    const navItems = [
      { text: 'Dashboard', id: 'dashboard', icon: 'fas fa-chart-bar' },
      { text: 'Tasks', id: 'tasks', icon: 'fas fa-tasks' },
      { text: 'Categories', id: 'categories', icon: 'fas fa-folder' },
      { text: 'Profile', id: 'profile', icon: 'fas fa-user' }
    ];

    navItems.forEach(item => {
      const li = document.createElement('li');
      li.className = 'nav-item';

      const button = document.createElement('button');
      button.className = 'nav-link';
      button.dataset.page = item.id;
      button.setAttribute('data-testid', `nav-${item.id}`);
      button.setAttribute('type', 'button'); // Explicit button type
      
      const icon = document.createElement('i');
      icon.className = item.icon;
      icon.setAttribute('aria-hidden', 'true');
      
      const text = document.createElement('span');
      text.className = 'nav-text';
      text.textContent = item.text;
      
      button.appendChild(icon);
      button.appendChild(text);
      li.appendChild(button);
      navList.appendChild(li);
    });

    nav.appendChild(navList);

    // User controls - right side
    const controls = document.createElement('div');
    controls.className = 'header-controls';

    // Theme toggle
    const themeToggle = document.createElement('button');
    themeToggle.className = 'btn-icon theme-toggle';
    themeToggle.setAttribute('aria-label', 'Toggle theme');
    themeToggle.setAttribute('data-testid', 'theme-toggle');
    themeToggle.setAttribute('type', 'button');
    this.themeToggleElement = themeToggle;
    
    const themeIcon = document.createElement('i');
    const isDark = document.body.classList.contains('dark-theme') || 
                   document.documentElement.getAttribute('data-theme') === 'dark';
    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    themeIcon.setAttribute('aria-hidden', 'true');
    themeToggle.appendChild(themeIcon);
    themeToggle.title = 'Toggle theme';

    // User menu
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';

    const currentUser = this.getCurrentUser();
    
    if (currentUser) {
      const userAvatar = document.createElement('div');
      userAvatar.className = 'user-avatar';
      this.avatarElement = userAvatar;
      
      this.loadUserAvatar(userAvatar);

      this.userNameElement = document.createElement('span');
      this.userNameElement.className = 'user-name';
      this.userNameElement.textContent = currentUser.username || 'User';

      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn-text logout-btn';
      logoutBtn.setAttribute('aria-label', 'Logout');
      logoutBtn.setAttribute('data-testid', 'logout-btn');
      logoutBtn.setAttribute('type', 'button');
      
      const logoutIcon = document.createElement('i');
      logoutIcon.className = 'fas fa-sign-out-alt';
      logoutIcon.setAttribute('aria-hidden', 'true');
      logoutBtn.appendChild(logoutIcon);
      
      const logoutText = document.createElement('span');
      logoutText.className = 'logout-text';
      logoutText.textContent = 'Logout';
      logoutBtn.appendChild(logoutText);

      userMenu.appendChild(userAvatar);
      userMenu.appendChild(this.userNameElement);
      userMenu.appendChild(logoutBtn);
    }

    controls.appendChild(themeToggle);
    controls.appendChild(userMenu);

    // Mobile menu toggle - hidden on desktop
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-menu-toggle';
    mobileToggle.setAttribute('aria-label', 'Toggle menu');
    mobileToggle.setAttribute('data-testid', 'mobile-menu-toggle');
    mobileToggle.setAttribute('type', 'button');
    this.mobileToggleElement = mobileToggle;
    
    const menuIcon = document.createElement('i');
    menuIcon.className = 'fas fa-bars';
    menuIcon.setAttribute('aria-hidden', 'true');
    mobileToggle.appendChild(menuIcon);
    mobileToggle.title = 'Menu';

    // Assemble header inner container
    headerInner.appendChild(logoContainer);
    headerInner.appendChild(nav); // Navigation in the middle
    headerInner.appendChild(controls);
    headerInner.appendChild(mobileToggle);

    // Assemble full header
    header.appendChild(headerInner);

    return header;
  }

  private setupEventListeners(): void {
    // Theme toggle
    if (this.themeToggleElement) {
      this.themeToggleElement.addEventListener('click', (e) => {
        e.stopPropagation();
        
        console.log('Theme toggle clicked');
        
        this.themeService.toggleTheme();
        this.onThemeToggle();
        
        // Update icon based on theme
        const themeIcon = this.themeToggleElement?.querySelector('i');
        if (themeIcon) {
          const isDarkNow = document.body.classList.contains('dark-theme') ||
                           document.documentElement.getAttribute('data-theme') === 'dark';
          themeIcon.className = isDarkNow ? 'fas fa-sun' : 'fas fa-moon';
        }
      });

      // Touch support for mobile
      this.themeToggleElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        });
        this.themeToggleElement?.dispatchEvent(clickEvent);
      });
    }

    // Mobile menu toggle
    if (this.mobileToggleElement && this.navElement) {
      const mobileToggleHandler = (e: Event) => {
        e.stopPropagation();
        
        console.log('Mobile menu toggle clicked');
        
        const isOpen = this.navElement?.classList.contains('mobile-open');
        this.navElement?.classList.toggle('mobile-open');
        
        // Toggle between bars and times icon
        const menuIcon = this.mobileToggleElement?.querySelector('i');
        if (menuIcon) {
          menuIcon.className = isOpen ? 'fas fa-bars' : 'fas fa-times';
        }
      };

      this.mobileToggleElement.addEventListener('click', mobileToggleHandler);
      
      // Touch support
      this.mobileToggleElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        mobileToggleHandler(e);
      });
    }

    // Navigation links - attach directly to each link
    setTimeout(() => {
      const navLinks = this.element.querySelectorAll('.nav-link');
      navLinks.forEach(link => {
        // Remove any existing listeners to avoid duplicates
        const newLink = link.cloneNode(true) as HTMLElement;
        link.parentNode?.replaceChild(newLink, link);
        
        newLink.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const page = newLink.dataset.page;
          if (page) {
            console.log('Nav link clicked:', page);
            
            // Close mobile menu if open
            if (this.navElement?.classList.contains('mobile-open')) {
              this.navElement.classList.remove('mobile-open');
              const menuIcon = this.mobileToggleElement?.querySelector('i');
              if (menuIcon) {
                menuIcon.className = 'fas fa-bars';
              }
            }
            
            // Dispatch custom event for app.ts to handle
            window.dispatchEvent(new CustomEvent('navigate-to', {
              detail: { page }
            }));
          }
        });

        // Touch support
        newLink.addEventListener('touchstart', (e) => {
          e.preventDefault();
          const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true
          });
          newLink.dispatchEvent(clickEvent);
        });
      });
    }, 100);

    // Logout button
    const logoutBtn = this.element.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onLogout();
      });

      logoutBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true
        });
        logoutBtn.dispatchEvent(clickEvent);
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (this.navElement?.classList.contains('mobile-open') &&
          !this.navElement.contains(target) &&
          !this.mobileToggleElement?.contains(target)) {
        
        this.navElement.classList.remove('mobile-open');
        const menuIcon = this.mobileToggleElement?.querySelector('i');
        if (menuIcon) {
          menuIcon.className = 'fas fa-bars';
        }
      }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.navElement?.classList.contains('mobile-open')) {
        this.navElement.classList.remove('mobile-open');
        const menuIcon = this.mobileToggleElement?.querySelector('i');
        if (menuIcon) {
          menuIcon.className = 'fas fa-bars';
        }
      }
    });
  }

  private async loadUserAvatar(avatarElement: HTMLElement): Promise<void> {
    try {
      // Try to get avatar from AvatarService
      const avatarUrl = await this.avatarService.getAvatar();
      
      if (avatarUrl) {
        // Use the uploaded avatar
        avatarElement.style.backgroundImage = `url(${avatarUrl})`;
        avatarElement.style.backgroundSize = 'cover';
        avatarElement.style.backgroundPosition = 'center';
        avatarElement.textContent = '';
        avatarElement.style.color = 'transparent';
      } else {
        // Use default Font Awesome icon
        const avatarIcon = document.createElement('i');
        avatarIcon.className = 'fas fa-user-circle';
        avatarIcon.setAttribute('aria-hidden', 'true');
        avatarElement.appendChild(avatarIcon);
        
        // Clear background image
        avatarElement.style.backgroundImage = 'none';
        avatarElement.style.color = '';
        
        // Add initials from username
        const currentUser = this.getCurrentUser();
        if (currentUser?.username) {
          const initials = currentUser.username.charAt(0).toUpperCase();
          avatarElement.textContent = initials;
        }
      }
    } catch (error) {
      console.warn('Failed to load avatar:', error);
      const avatarIcon = document.createElement('i');
      avatarIcon.className = 'fas fa-user-circle';
      avatarIcon.setAttribute('aria-hidden', 'true');
      avatarElement.appendChild(avatarIcon);
    }
  }

  private getCurrentUser(): User | null {
    try {
      // First try to get from localStorage directly for immediate access
      const storedUserStr = localStorage.getItem('current_user');
      if (storedUserStr) {
        try {
          return JSON.parse(storedUserStr) as User;
        } catch {
          // If JSON parsing fails, try to get from tm_currentUser
          const tmUser = localStorage.getItem('tm_currentUser');
          return tmUser ? JSON.parse(tmUser) : null;
        }
      }
      
      // Fall back to AuthController
      return this.authController.getCurrentUser();
    } catch (error) {
      console.warn('Failed to get current user:', error);
      return this.authController.getCurrentUser();
    }
  }

  private setupStorageListener(): void {
    // Subscribe to avatar updates from AvatarService
    this.avatarService.subscribe(() => {
      if (this.avatarElement) {
        this.loadUserAvatar(this.avatarElement);
      }
    });
    
    // Listen for storage changes to update user info in real-time
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === 'current_user' && event.newValue) {
        try {
          const user = JSON.parse(event.newValue) as User;
          this.updateUserName(user.username);
        } catch (error) {
          console.warn('Failed to parse user data from storage event:', error);
        }
      }
      
      if (event.key === 'user_avatar') {
        this.updateUserAvatar();
      }
    });
    
    // Listen for custom events that can be dispatched from ProfilePage
    window.addEventListener('profile-updated', (event: CustomEvent<{ username: string }>) => {
      if (event.detail?.username) {
        this.updateUserName(event.detail.username);
      }
    });
    
    window.addEventListener('avatar-updated', () => {
      this.updateUserAvatar();
    });
  }

  private debugLayout(): void {
    console.log('=== Header Layout Debug ===');
    console.log('Window width:', window.innerWidth);
    console.log('Is mobile?', window.innerWidth <= 768);
    
    console.log('Nav element exists:', !!this.navElement);
    console.log('Nav display:', this.navElement ? 
      window.getComputedStyle(this.navElement).display : 'N/A');
    
    console.log('Number of nav links:', this.element.querySelectorAll('.nav-link').length);
    
    // Check CSS classes
    console.log('Nav classes:', this.navElement?.className);
    console.log('Header classes:', this.element.className);
  }

  public updateUserName(username: string): void {
    if (this.userNameElement) {
      this.userNameElement.textContent = username;
    } else {
      // If userNameElement doesn't exist yet, try to find it
      const userNameEl = this.element.querySelector('.user-name');
      if (userNameEl) {
        userNameEl.textContent = username;
        this.userNameElement = userNameEl as HTMLElement;
      }
    }
  }

  public updateUserAvatar(): void {
    const avatarElement = this.element.querySelector('.user-avatar');
    if (avatarElement) {
      this.loadUserAvatar(avatarElement as HTMLElement);
    }
  }

  public updateUserInfo(): void {
    const userMenu = this.element.querySelector('.user-menu');
    if (userMenu) {
      userMenu.innerHTML = '';
      
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const userAvatar = document.createElement('div');
        userAvatar.className = 'user-avatar';
        this.avatarElement = userAvatar;
        
        // Load avatar from storage
        this.loadUserAvatar(userAvatar);

        this.userNameElement = document.createElement('span');
        this.userNameElement.className = 'user-name';
        this.userNameElement.textContent = currentUser.username || 'User';

        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn-text logout-btn';
        logoutBtn.setAttribute('aria-label', 'Logout');
        
        const logoutIcon = document.createElement('i');
        logoutIcon.className = 'fas fa-sign-out-alt';
        logoutBtn.appendChild(logoutIcon);
        
        const logoutText = document.createElement('span');
        logoutText.textContent = ' Logout';
        logoutBtn.appendChild(logoutText);
        
        logoutBtn.addEventListener('click', this.onLogout);

        userMenu.appendChild(userAvatar);
        userMenu.appendChild(this.userNameElement);
        userMenu.appendChild(logoutBtn);
      }
    }
  }

  setActivePage(pageId: string): void {
    const navLinks = this.element.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      if (link instanceof HTMLElement) {
        link.classList.toggle('active', link.dataset.page === pageId);
      }
    });
  }

  render(): HTMLElement {
    return this.element;
  }
}