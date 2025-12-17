import { APP_CONSTANTS } from './constants';

export class Validators {
  // Required field validation
  static required(value: string, fieldName: string = 'This field'): string | null {
    if (!value || value.trim() === '') {
      return `${fieldName} is required`;
    }
    return null;
  }

  // Email validation
  static email(value: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  // Password validation
  static password(value: string): string | null {
    if (value.length < APP_CONSTANTS.VALIDATION.MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${APP_CONSTANTS.VALIDATION.MIN_PASSWORD_LENGTH} characters long`;
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }

    // Check for at least one number
    if (!/\d/.test(value)) {
      return 'Password must contain at least one number';
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      return 'Password must contain at least one special character';
    }

    return null;
  }

  // Username validation
  static username(value: string): string | null {
    const minLength = APP_CONSTANTS.VALIDATION.MIN_USERNAME_LENGTH;
    const maxLength = APP_CONSTANTS.VALIDATION.MAX_USERNAME_LENGTH;

    if (value.length < minLength) {
      return `Username must be at least ${minLength} characters long`;
    }

    if (value.length > maxLength) {
      return `Username cannot exceed ${maxLength} characters`;
    }

    // Only allow alphanumeric, underscore, and hyphen
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }

    return null;
  }

  // Task title validation
  static taskTitle(value: string): string | null {
    const minLength = APP_CONSTANTS.VALIDATION.MIN_TASK_TITLE_LENGTH;
    const maxLength = APP_CONSTANTS.VALIDATION.MAX_TASK_TITLE_LENGTH;

    if (value.length < minLength) {
      return `Task title must be at least ${minLength} character${minLength > 1 ? 's' : ''} long`;
    }

    if (value.length > maxLength) {
      return `Task title cannot exceed ${maxLength} characters`;
    }

    return null;
  }

  // Task description validation
  static taskDescription(value: string): string | null {
    const maxLength = APP_CONSTANTS.VALIDATION.MAX_TASK_DESCRIPTION_LENGTH;

    if (value.length > maxLength) {
      return `Task description cannot exceed ${maxLength} characters`;
    }

    return null;
  }

  // URL validation
  static url(value: string): string | null {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  }

  // Phone number validation (US format)
  static phone(value: string): string | null {
    const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    if (!phoneRegex.test(value)) {
      return 'Please enter a valid phone number (10 digits)';
    }
    return null;
  }

  // Date validation
  static date(value: string): string | null {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    return null;
  }

  // Future date validation
  static futureDate(value: string): string | null {
    const dateError = this.date(value);
    if (dateError) return dateError;

    const inputDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (inputDate < today) {
      return 'Date must be in the future';
    }

    return null;
  }

  // Number validation
  static number(value: string, min?: number, max?: number): string | null {
    const num = Number(value);
    
    if (isNaN(num)) {
      return 'Please enter a valid number';
    }

    if (min !== undefined && num < min) {
      return `Value must be at least ${min}`;
    }

    if (max !== undefined && num > max) {
      return `Value cannot exceed ${max}`;
    }

    return null;
  }

  // Integer validation
  static integer(value: string, min?: number, max?: number): string | null {
    const num = Number(value);
    
    if (!Number.isInteger(num)) {
      return 'Please enter a whole number';
    }

    return this.number(value, min, max);
  }

  // Tag validation
  static tag(value: string): string | null {
    const maxLength = APP_CONSTANTS.VALIDATION.MAX_TAG_LENGTH;

    if (value.length === 0) {
      return 'Tag cannot be empty';
    }

    if (value.length > maxLength) {
      return `Tag cannot exceed ${maxLength} characters`;
    }

    // Don't allow commas in tags
    if (value.includes(',')) {
      return 'Tags cannot contain commas';
    }

    return null;
  }

  // Multiple tags validation
  static tags(values: string[]): string | null {
    const maxTags = APP_CONSTANTS.VALIDATION.MAX_TAGS_PER_TASK;

    if (values.length > maxTags) {
      return `Cannot have more than ${maxTags} tags`;
    }

    for (const tag of values) {
      const error = this.tag(tag);
      if (error) return error;
    }

    return null;
  }

  // Color validation (hex, rgb, rgba, or named color)
  static color(value: string): string | null {
    // Hex color
    if (/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
      return null;
    }

    // RGB color
    if (/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i.test(value)) {
      return null;
    }

    // RGBA color
    if (/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0\.\d+)\s*\)$/i.test(value)) {
      return null;
    }

    // Named colors (basic set)
    const namedColors = [
      'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink',
      'brown', 'black', 'white', 'gray', 'grey', 'cyan', 'magenta',
      'lime', 'maroon', 'navy', 'olive', 'teal', 'silver', 'gold'
    ];

    if (namedColors.includes(value.toLowerCase())) {
      return null;
    }

    return 'Please enter a valid color (hex, rgb, rgba, or named color)';
  }

  // File validation
  static file(file: File | null, options?: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    required?: boolean;
  }): string | null {
    const { maxSize, allowedTypes, required = false } = options || {};

    if (required && !file) {
      return 'File is required';
    }

    if (!file) {
      return null;
    }

    if (maxSize && file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      return `File size cannot exceed ${maxSizeMB} MB`;
    }

    if (allowedTypes && allowedTypes.length > 0) {
      const fileType = file.type;
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      const isTypeAllowed = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return `.${extension}` === type;
        }
        return fileType.startsWith(type);
      });

      if (!isTypeAllowed) {
        const allowedList = allowedTypes.join(', ');
        return `File type not allowed. Allowed types: ${allowedList}`;
      }
    }

    return null;
  }

  // Confirm password validation
  static confirmPassword(password: string, confirmPassword: string): string | null {
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  }

  // Credit card validation (basic Luhn check)
  static creditCard(value: string): string | null {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length < 13 || cleaned.length > 19) {
      return 'Please enter a valid credit card number';
    }

    // Luhn algorithm
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    if (sum % 10 !== 0) {
      return 'Invalid credit card number';
    }
    
    return null;
  }

  // Credit card expiry validation
  static creditCardExpiry(month: string, year: string): string | null {
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (monthNum < 1 || monthNum > 12) {
      return 'Invalid month';
    }
    
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    
    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      return 'Card has expired';
    }
    
    return null;
  }

  // Credit card CVV validation
  static creditCardCVV(value: string): string | null {
    if (!/^\d{3,4}$/.test(value)) {
      return 'Invalid CVV';
    }
    return null;
  }

  // ZIP code validation (US)
  static zipCode(value: string): string | null {
    if (!/^\d{5}(-\d{4})?$/.test(value)) {
      return 'Please enter a valid ZIP code';
    }
    return null;
  }

  // Social Security Number validation (US)
  static ssn(value: string): string | null {
    if (!/^\d{3}-\d{2}-\d{4}$/.test(value)) {
      return 'Please enter a valid SSN (XXX-XX-XXXX)';
    }
    return null;
  }

  // Validate form fields
  static validateForm(fields: Record<string, { value: any; validators: ((value: any) => string | null)[] }>): Record<string, string> {
    const errors: Record<string, string> = {};
    
    Object.entries(fields).forEach(([fieldName, field]) => {
      for (const validator of field.validators) {
        const error = validator(field.value);
        if (error) {
          errors[fieldName] = error;
          break;
        }
      }
    });
    
    return errors;
  }

  // Check if form is valid
  static isFormValid(errors: Record<string, string>): boolean {
    return Object.keys(errors).length === 0;
  }

  // Validate JSON
  static json(value: string): string | null {
    try {
      JSON.parse(value);
      return null;
    } catch {
      return 'Invalid JSON format';
    }
  }

  // Validate time (HH:MM format)
  static time(value: string): string | null {
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
      return 'Please enter a valid time (HH:MM)';
    }
    return null;
  }

  // Validate priority
  static priority(value: string): string | null {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(value.toLowerCase())) {
      return 'Please select a valid priority';
    }
    return null;
  }

  // Validate status
  static status(value: string): string | null {
    const validStatuses = ['todo', 'in-progress', 'completed'];
    if (!validStatuses.includes(value.toLowerCase())) {
      return 'Please select a valid status';
    }
    return null;
  }

  // Validate category name
  static categoryName(value: string): string | null {
    if (!value || value.trim() === '') {
      return 'Category name is required';
    }
    
    if (value.length > 50) {
      return 'Category name cannot exceed 50 characters';
    }
    
    return null;
  }

  // Validate import data
  static importData(value: string): string | null {
    try {
      const data = JSON.parse(value);
      
      if (!data.version) {
        return 'Invalid import file: missing version';
      }
      
      if (!data.data) {
        return 'Invalid import file: missing data';
      }
      
      // Basic structure validation
      if (data.data.tasks && !Array.isArray(data.data.tasks)) {
        return 'Invalid import file: tasks must be an array';
      }
      
      if (data.data.categories && !Array.isArray(data.data.categories)) {
        return 'Invalid import file: categories must be an array';
      }
      
      return null;
    } catch {
      return 'Invalid JSON format';
    }
  }
}