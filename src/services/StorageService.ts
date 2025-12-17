export class StorageService {
  private static instance: StorageService;
  
  private constructor() {}
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }
  
  async save<T>(key: string, data: T): Promise<void> {
    try {
      let serializedData: string;
      
      // Special handling for avatar data - it's a Data URL string
      if (key === 'user_avatar' || key.endsWith('_avatar')) {
        // For avatar, it's already a string (Data URL or URL)
        serializedData = data as string;
      } else {
        // For other data, stringify with Date handling
        serializedData = JSON.stringify(data, (_, value) => {
          // Convert Date objects to ISO strings
          if (value instanceof Date) {
            return {
              __type: 'Date',
              iso: value.toISOString()
            };
          }
          return value;
        });
      }
      
      localStorage.setItem(key, serializedData);
    } catch (error: any) {
      console.error(`StorageService: Failed to save data for key "${key}":`, error);
      throw new Error(`Failed to save data: ${error.message}`);
    }
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      // Special handling for avatar data - it's a raw string, not JSON
      if (key === 'user_avatar' || key.endsWith('_avatar')) {
        // For avatar, return the raw string
        return data as T;
      }
      
      // For other data, parse as JSON
      return JSON.parse(data, (_, value) => {
        // Convert objects with __type: 'Date' back to Date objects
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.iso);
        }
        
        // Also handle Date strings that might not have been serialized properly
        if (typeof value === 'string' && this.looksLikeISODate(value)) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        
        return value;
      });
    } catch (error: any) {
      console.error(`StorageService: Failed to retrieve data for key "${key}":`, error);
      
      // If it's avatar data and JSON parsing failed, try to return the raw string
      if (key === 'user_avatar' || key.endsWith('_avatar')) {
        const data = localStorage.getItem(key);
        return data as T;
      }
      
      throw new Error(`Failed to retrieve data: ${error.message}`);
    }
  }
  
  private looksLikeISODate(str: string): boolean {
    // Simple check for ISO date format: YYYY-MM-DDTHH:mm:ss.sssZ
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?$/;
    return isoRegex.test(str);
  }
  
  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch (error: any) {
      console.error(`StorageService: Failed to remove data for key "${key}":`, error);
      throw new Error(`Failed to remove data: ${error.message}`);
    }
  }
  
  async clear(): Promise<void> {
    try {
      localStorage.clear();
    } catch (error: any) {
      console.error('StorageService: Failed to clear storage:', error);
      throw new Error(`Failed to clear storage: ${error.message}`);
    }
  }
  
  async backupData(): Promise<string> {
    try {
      const allData: { [key: string]: string | null } = {};
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith('tm_')) {
          allData[key] = localStorage.getItem(key);
        }
      });
      
      return JSON.stringify(allData, null, 2);
    } catch (error: any) {
      console.error('StorageService: Failed to create backup:', error);
      throw new Error(`Failed to create backup: ${error.message}`);
    }
  }
  
  async restoreData(backup: string): Promise<void> {
    try {
      const data = JSON.parse(backup) as { [key: string]: string | null };
      Object.keys(data).forEach(key => {
        if (data[key] !== null) {
          localStorage.setItem(key, data[key]!);
        }
      });
    } catch (error: any) {
      console.error('StorageService: Failed to restore data:', error);
      throw new Error(`Failed to restore data: ${error.message}`);
    }
  }
  
  async exportToJSON(filename: string = 'task-manager-backup.json'): Promise<void> {
    try {
      const data = await this.backupData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('StorageService: Failed to export data:', error);
      throw new Error(`Failed to export data: ${error.message}`);
    }
  }
  
  // Helper method to check if data is stored
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
  
  // Clean up corrupted data
  async fixCorruptedData(key: string): Promise<void> {
    try {
      const data = localStorage.getItem(key);
      if (!data) return;
      
      // Try to parse as JSON
      try {
        JSON.parse(data);
        // If successful, data is valid JSON
        return;
      } catch {
        // If parsing fails, the data might be corrupted
        console.warn(`Fixing corrupted data for key: ${key}`);
        await this.remove(key);
      }
    } catch (error) {
      console.error(`Failed to fix corrupted data for key ${key}:`, error);
    }
  }
}