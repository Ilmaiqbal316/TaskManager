import { StorageService } from '../services/StorageService';
import { ValidationService } from '../services/ValidationService';
import { RegisterData, User } from '../types';

export class AuthController {
  private currentUser: User | null = null;
  private storage: StorageService;
  
  constructor() {
    this.storage = StorageService.getInstance();
    this.loadSession();
  }
  
  private loadSession(): void {
    try {
      const sessionData = localStorage.getItem('tm_currentUser');
      if (sessionData) {
        const userData = JSON.parse(sessionData);
        console.log('AuthController: Loaded user from localStorage:', userData);
        
        // IMPORTANT: Convert createdAt from string to Date object
        let createdAt: Date;
        try {
          if (userData.createdAt instanceof Date) {
            createdAt = userData.createdAt;
          } else if (typeof userData.createdAt === 'string') {
            createdAt = new Date(userData.createdAt);
          } else if (userData.createdAt && typeof userData.createdAt === 'object') {
            // If it's a date-like object from JSON
            createdAt = new Date(userData.createdAt);
          } else {
            createdAt = new Date();
          }
        } catch (error) {
          console.warn('AuthController: Failed to parse createdAt, using current date');
          createdAt = new Date();
        }
        
        this.currentUser = {
          id: userData.id,
          email: userData.email,
          username: userData.username,
          passwordHash: userData.passwordHash || '',
          createdAt: createdAt,
          profile: userData.profile || {
            theme: 'light',
            notifications: true
          }
        };
        
        console.log('AuthController: User loaded successfully');
        console.log('CreatedAt as Date:', this.currentUser.createdAt);
      }
    } catch (error) {
      console.error('AuthController: Failed to load session:', error);
      this.currentUser = null;
    }
  }
  
  private generateId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  private hashPassword(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }
  
  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
  
  async register(userData: RegisterData): Promise<User> {
    console.log('AuthController: Registering user:', userData.email);
    
    ValidationService.validateEmail(userData.email);
    ValidationService.validatePassword(userData.password);
    
    const users = await this.storage.get<User[]>('tm_users') || [];
    if (users.find(u => u.email === userData.email)) {
      throw new Error('User already exists');
    }
    
    const user: User = {
      id: this.generateId(),
      email: userData.email,
      username: userData.username,
      passwordHash: this.hashPassword(userData.password),
      createdAt: new Date(), // This is a proper Date object
      profile: {
        theme: 'light',
        notifications: true
      }
    };
    
    users.push(user);
    await this.storage.save('tm_users', users);
    console.log('AuthController: User saved to storage');
    
    const loggedInUser = await this.login(userData.email, userData.password);
    
    return loggedInUser;
  }
  
  async login(email: string, password: string): Promise<User> {
    console.log('AuthController: Login attempt for:', email);
    
    const users = await this.storage.get<User[]>('tm_users') || [];
    const user = users.find(u => u.email === email);
    
    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }
    
    console.log('AuthController: Login successful for:', user.email);
    
    // Ensure user.createdAt is a Date object
    let createdAt: Date;
    if (user.createdAt instanceof Date) {
      createdAt = user.createdAt;
    } else if (typeof user.createdAt === 'string') {
      createdAt = new Date(user.createdAt);
    } else if (user.createdAt && typeof user.createdAt === 'object') {
      // Handle case where it might be serialized Date object
      createdAt = new Date(user.createdAt);
    } else {
      createdAt = new Date();
    }
    
    this.currentUser = {
      ...user,
      createdAt: createdAt
    };
    
    this.saveSession();
    
    console.log('AuthController: Login complete, dispatching events...');
    
    // Dispatch storage event
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'tm_currentUser',
      newValue: localStorage.getItem('tm_currentUser')
    }));
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('auth-changed', {
      detail: { isAuthenticated: true, user: this.currentUser }
    }));
    
    return this.currentUser;
  }
  
  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    console.log('AuthController: Changing password for:', email);
    
    ValidationService.validatePassword(newPassword);
    
    const users = await this.storage.get<User[]>('tm_users') || [];
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    const user = users[userIndex];
    
    // Verify current password
    if (!this.verifyPassword(currentPassword, user.passwordHash)) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password hash
    users[userIndex] = {
      ...user,
      passwordHash: this.hashPassword(newPassword)
    };
    
    // Save updated users array
    await this.storage.save('tm_users', users);
    
    console.log('AuthController: Password changed successfully for:', email);
    
    // If the current user is the one changing password, update local session
    if (this.currentUser && this.currentUser.email === email) {
      this.currentUser = users[userIndex];
      this.saveSession();
    }
  }
  
  logout(): void {
    console.log('AuthController: Logging out user:', this.currentUser?.email);
    this.currentUser = null;
    localStorage.removeItem('tm_currentUser');
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'tm_currentUser',
      newValue: null
    }));
    
    // Dispatch custom event for logout
    window.dispatchEvent(new CustomEvent('auth-changed', {
      detail: { isAuthenticated: false }
    }));
  }
  
  private saveSession(): void {
    if (this.currentUser) {
      console.log('AuthController: Saving session for user:', this.currentUser.email);
      
      // FIX: Simplify the session data
      const sessionData = {
        id: this.currentUser.id,
        email: this.currentUser.email,
        username: this.currentUser.username,
        createdAt: this.currentUser.createdAt.toISOString(),
        profile: this.currentUser.profile || {
          theme: 'light',
          notifications: true
        }
      };
      
      console.log('AuthController: Session data to save:', sessionData);
      
      try {
        localStorage.setItem('tm_currentUser', JSON.stringify(sessionData));
        console.log('AuthController: Session saved successfully');
      } catch (error) {
        console.error('AuthController: Failed to save session:', error);
      }
    }
  }
  
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
  
  // Safe debug method
  debugAuthState(): void {
    console.log('=== AuthController Debug ===');
    console.log('Current User exists:', !!this.currentUser);
    if (this.currentUser) {
      console.log('User ID:', this.currentUser.id);
      console.log('User Email:', this.currentUser.email);
      console.log('CreatedAt:', this.currentUser.createdAt);
      console.log('CreatedAt type:', typeof this.currentUser.createdAt);
      console.log('CreatedAt instanceof Date:', this.currentUser.createdAt instanceof Date);
    }
    console.log('isAuthenticated:', this.isAuthenticated());
    console.log('LocalStorage tm_currentUser:', localStorage.getItem('tm_currentUser'));
    console.log('===========================');
  }
}