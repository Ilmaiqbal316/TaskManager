// Application constants
export const APP_CONSTANTS = {
  APP_NAME: 'Task Manager',
  APP_VERSION: '1.0.0',
  STORAGE_PREFIX: 'tm_',
  SESSION_KEY: 'tm_currentUser',
  THEME_KEY: 'tm_theme',
  
  // Task constants
  TASK_STATUS: {
    TODO: 'todo',
    IN_PROGRESS: 'in-progress',
    COMPLETED: 'completed'
  } as const,
  
  TASK_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  } as const,
  
  // Date formats
  DATE_FORMATS: {
    SHORT: 'MM/DD/YYYY',
    LONG: 'MMMM DD, YYYY',
    ISO: 'YYYY-MM-DD',
    DATETIME: 'MM/DD/YYYY HH:mm',
    TIME: 'HH:mm'
  },
  
  // Color constants
  COLORS: {
    PRIMARY: '#4361ee',
    SECONDARY: '#3f37c9',
    SUCCESS: '#4cc9f0',
    WARNING: '#f72585',
    DANGER: '#7209b7',
    INFO: '#4895ef',
    LIGHT: '#f8f9fa',
    DARK: '#212529',
    
    // Priority colors
    PRIORITY_LOW: '#20c997',
    PRIORITY_MEDIUM: '#fd7e14',
    PRIORITY_HIGH: '#dc3545',
    
    // Status colors
    STATUS_TODO: '#6c757d',
    STATUS_IN_PROGRESS: '#0d6efd',
    STATUS_COMPLETED: '#198754'
  },
  
  // Category default colors
  CATEGORY_COLORS: [
    '#4361ee', '#3a0ca3', '#7209b7', '#f72585',
    '#4cc9f0', '#4895ef', '#560bad', '#b5179e',
    '#f15bb5', '#9b5de5', '#00bbf9', '#00f5d4',
    '#ff9e00', '#ff6d00', '#ff0054', '#390099'
  ],
  
  // Category icons
  CATEGORY_ICONS: [
    '📁', '💼', '🏠', '🛒', '❤️', '🎓', '🚗', '✈️',
    '🎮', '🎨', '📚', '🎵', '🏃', '🍳', '🛠️', '💰'
  ],
  
  // LocalStorage keys
  STORAGE_KEYS: {
    USERS: 'tm_users',
    TASKS: 'tm_tasks',
    CATEGORIES: 'tm_categories',
    TAGS: 'tm_tags',
    SETTINGS: 'tm_settings',
    BACKUP: 'tm_backup'
  },
  
  // Validation constants
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 50,
    MIN_TASK_TITLE_LENGTH: 1,
    MAX_TASK_TITLE_LENGTH: 200,
    MAX_TASK_DESCRIPTION_LENGTH: 1000,
    MAX_TAGS_PER_TASK: 10,
    MAX_TAG_LENGTH: 20
  },
  
  // UI constants
  UI: {
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024,
    DESKTOP_BREAKPOINT: 1280,
    MAX_CONTAINER_WIDTH: '1200px',
    SIDEBAR_WIDTH: '250px',
    HEADER_HEIGHT: '64px'
  },
  
  // Notification constants
  NOTIFICATIONS: {
    DEFAULT_DURATION: 3000,
    SUCCESS_DURATION: 2000,
    ERROR_DURATION: 4000
  },
  
  // Export/Import constants
  EXPORT: {
    FILE_NAME: 'task-manager-export',
    BACKUP_NAME: 'task-manager-backup',
    DATE_FORMAT: 'YYYY-MM-DD-HH-mm-ss'
  },
  
  // API constants (for future use)
  API: {
    BASE_URL: '',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3
  }
} as const;

// Default user settings
export const DEFAULT_SETTINGS = {
  theme: 'light',
  notifications: true,
  sound: true,
  compactView: false,
  showCompleted: true,
  sortBy: 'dueDate',
  itemsPerPage: 20,
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
} as const;

// Default categories
export const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#4361ee', icon: '💼' },
  { name: 'Personal', color: '#20c997', icon: '🏠' },
  { name: 'Shopping', color: '#fd7e14', icon: '🛒' },
  { name: 'Health', color: '#e83e8c', icon: '❤️' },
  { name: 'Education', color: '#6f42c1', icon: '🎓' },
  { name: 'Travel', color: '#17a2b8', icon: '✈️' }
] as const;

// Task templates
export const TASK_TEMPLATES = [
  {
    name: 'Meeting',
    title: 'Team Meeting',
    description: 'Weekly team sync to discuss progress and blockers',
    priority: 'medium',
    tags: ['meeting', 'work', 'team']
  },
  {
    name: 'Shopping',
    title: 'Grocery Shopping',
    description: 'Weekly grocery list',
    priority: 'low',
    tags: ['shopping', 'personal']
  },
  {
    name: 'Exercise',
    title: 'Daily Exercise',
    description: '30 minutes of physical activity',
    priority: 'medium',
    tags: ['health', 'exercise']
  },
  {
    name: 'Study',
    title: 'Study Session',
    description: 'Focused study time',
    priority: 'high',
    tags: ['education', 'study']
  }
] as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  NEW_TASK: ['n', 'N'],
  SEARCH: ['/', '?'],
  ESCAPE: ['Escape'],
  SAVE: ['Control', 's'],
  DELETE: ['Delete', 'Backspace'],
  COMPLETE: ['c', 'C'],
  EDIT: ['e', 'E'],
  HELP: ['h', 'H', 'F1']
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  STORAGE: 'Storage error. Please try again.',
  VALIDATION: 'Please check your input and try again.',
  AUTH: 'Authentication failed. Please check your credentials.',
  NOT_FOUND: 'The requested resource was not found.',
  PERMISSION: 'You don\'t have permission to perform this action.',
  UNKNOWN: 'An unknown error occurred. Please try again.'
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Task created successfully!',
  TASK_UPDATED: 'Task updated successfully!',
  TASK_DELETED: 'Task deleted successfully!',
  CATEGORY_CREATED: 'Category created successfully!',
  CATEGORY_UPDATED: 'Category updated successfully!',
  CATEGORY_DELETED: 'Category deleted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  DATA_EXPORTED: 'Data exported successfully!',
  DATA_IMPORTED: 'Data imported successfully!',
  BACKUP_CREATED: 'Backup created successfully!',
  BACKUP_RESTORED: 'Backup restored successfully!'
} as const;