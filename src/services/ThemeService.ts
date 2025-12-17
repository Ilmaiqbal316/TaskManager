import { lightTheme, darkTheme, ThemeColors } from '../types';

export class ThemeService {
  private static instance: ThemeService;
  private currentTheme: 'light' | 'dark' = 'light';
  
  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }
  
  initialize(): void {
    // Check saved preference
    const savedTheme = localStorage.getItem('tm_theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.currentTheme = savedTheme;
    } else {
      this.currentTheme = systemPrefersDark ? 'dark' : 'light';
    }
    
    this.applyTheme();
  }
  
  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    localStorage.setItem('tm_theme', this.currentTheme);
    
    // Dispatch custom event for other components to react
    window.dispatchEvent(new CustomEvent('themechanged', {
      detail: { theme: this.currentTheme }
    }));
    
    // Also dispatch a more generic event
    window.dispatchEvent(new Event('theme-toggle'));
  }
  
  getCurrentTheme(): 'light' | 'dark' {
    return this.currentTheme;
  }
  
  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    
    // Update CSS variables
    const root = document.documentElement;
    const theme: ThemeColors = this.currentTheme === 'dark' ? darkTheme : lightTheme;
    
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    
    // Also update body class for compatibility
    if (this.currentTheme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }
  
  addThemeChangeListener(callback: (theme: 'light' | 'dark') => void): void {
    window.addEventListener('themechanged', ((event: CustomEvent) => {
      callback(event.detail.theme);
    }) as EventListener);
  }
}