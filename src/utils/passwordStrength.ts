export class PasswordStrength {
  static getStrength(password: string): { level: 'Weak' | 'Medium' | 'Strong'; score: number } {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (score >= 5) return { level: 'Strong', score };
    if (score >= 3) return { level: 'Medium', score };
    return { level: 'Weak', score };
  }
}

// Also export as default for backward compatibility
export default PasswordStrength;