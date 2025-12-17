export class ValidationService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }
    return true;
  }

  static validatePassword(password: string): boolean {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Check for at least one uppercase, one lowercase, one number, and one special character
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
      throw new Error('Password must contain uppercase, lowercase, number, and special character');
    }
    
    return true;
  }

  static getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
    if (password.length < 8) return 'weak';
    
    let score = 0;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (password.length >= 12) score++;
    
    if (score >= 4) return 'strong';
    if (score >= 3) return 'medium';
    return 'weak';
  }

  static validateRequired(value: string, fieldName: string): boolean {
    if (!value || value.trim() === '') {
      throw new Error(`${fieldName} is required`);
    }
    return true;
  }
}