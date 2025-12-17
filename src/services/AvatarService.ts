import { StorageService } from './StorageService';

export class AvatarService {
  private static instance: AvatarService;
  private storageService: StorageService;
  private subscribers: ((avatarUrl: string | null) => void)[] = [];

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  static getInstance(): AvatarService {
    if (!AvatarService.instance) {
      AvatarService.instance = new AvatarService();
    }
    return AvatarService.instance;
  }

  async getAvatar(): Promise<string | null> {
    try {
      return await this.storageService.get<string>('user_avatar');
    } catch (error) {
      console.warn('Failed to get avatar from storage service, trying localStorage directly:', error);
      // Fallback to direct localStorage access
      return localStorage.getItem('user_avatar');
    }
  }

  async setAvatar(avatarUrl: string): Promise<void> {
    // Validate it's a proper URL or Data URL
    if (!avatarUrl || (typeof avatarUrl !== 'string')) {
      throw new Error('Invalid avatar URL');
    }
    
    // Basic validation for Data URLs
    if (avatarUrl.startsWith('data:image/')) {
      // Validate Data URL format
      const dataUrlRegex = /^data:image\/(jpeg|png|gif|webp);base64,[A-Za-z0-9+/=]+$/;
      if (!dataUrlRegex.test(avatarUrl)) {
        throw new Error('Invalid image data format');
      }
    }
    
    try {
      await this.storageService.save('user_avatar', avatarUrl);
      localStorage.setItem('user_avatar', avatarUrl);
    } catch (error) {
      console.warn('Failed to save avatar via storage service, saving directly:', error);
      localStorage.setItem('user_avatar', avatarUrl);
    }
    
    // Notify all subscribers
    this.notifySubscribers(avatarUrl);
  }

  async removeAvatar(): Promise<void> {
    try {
      await this.storageService.remove('user_avatar');
      localStorage.removeItem('user_avatar');
    } catch (error) {
      console.warn('Failed to remove avatar via storage service, removing directly:', error);
      localStorage.removeItem('user_avatar');
    }
    
    // Notify all subscribers
    this.notifySubscribers(null);
  }

  subscribe(callback: (avatarUrl: string | null) => void): void {
    this.subscribers.push(callback);
  }

  unsubscribe(callback: (avatarUrl: string | null) => void): void {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }

  private notifySubscribers(avatarUrl: string | null): void {
    this.subscribers.forEach(callback => {
      try {
        callback(avatarUrl);
      } catch (error) {
        console.error('Error in avatar subscriber callback:', error);
      }
    });
  }

  // Migration method to fix corrupted avatar data
  async migrateAndFixAvatarData(): Promise<void> {
    try {
      const currentAvatar = localStorage.getItem('user_avatar');
      if (!currentAvatar) return;
      
      // Check if it's a valid JSON string (which it shouldn't be)
      if (currentAvatar.trim().startsWith('{') || currentAvatar.trim().startsWith('[')) {
        console.warn('Found JSON data in avatar storage, removing...');
        localStorage.removeItem('user_avatar');
      }
    } catch (error) {
      console.error('Failed to migrate avatar data:', error);
    }
  }
}