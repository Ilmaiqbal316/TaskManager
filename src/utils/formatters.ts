import { DateUtils } from './dateUtils';

export class Formatters {
  // Format date
  static formatDate(date: Date | string | null | undefined, format: 'short' | 'long' | 'relative' = 'short'): string {
    if (!date) return 'No date';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid date';
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
      case 'long':
        return d.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
      case 'relative':
        return DateUtils.formatDate(d);
        
      default:
        return d.toLocaleDateString();
    }
  }

  // Format date with time
  static formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return 'No date';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid date';
    
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format time only
  static formatTime(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid time';
    
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format duration
  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format number with commas
  static formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }

  // Format percentage
  static formatPercent(value: number, decimals: number = 0): string {
    return `${value.toFixed(decimals)}%`;
  }

  // Format currency
  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  // Format priority text
  static formatPriority(priority: string): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  // Format status text
  static formatStatus(status: string): string {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Format tags for display
  static formatTags(tags: string[]): string {
    if (tags.length === 0) return 'No tags';
    return tags.join(', ');
  }

  // Truncate text with ellipsis
  static truncate(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + suffix;
  }

  // Capitalize first letter of each word
  static capitalizeWords(text: string): string {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  // Generate initials from name
  static getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  // Mask email address
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    
    const maskedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  // Format phone number
  static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if the number is valid
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
  }

  // Format social security number
  static formatSSN(ssn: string): string {
    const cleaned = ssn.replace(/\D/g, '');
    
    if (cleaned.length === 9) {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 5)}-${cleaned.substring(5)}`;
    }
    
    return ssn;
  }

  // Format credit card number
  static formatCreditCard(card: string): string {
    const cleaned = card.replace(/\D/g, '');
    
    if (cleaned.length >= 13 && cleaned.length <= 19) {
      const parts = cleaned.match(/.{1,4}/g);
      return parts ? parts.join(' ') : card;
    }
    
    return card;
  }

  // Generate slug from text
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Generate excerpt from HTML
  static generateExcerpt(html: string, maxLength: number = 150): string {
    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, '');
    
    // Remove extra whitespace
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Truncate
    if (cleanText.length <= maxLength) return cleanText;
    
    return cleanText.substring(0, maxLength).trim() + '...';
  }

  // Format JSON for display
  static formatJSON(obj: any, indent: number = 2): string {
    try {
      return JSON.stringify(obj, null, indent);
    } catch {
      return String(obj);
    }
  }

  // Format time ago
  static timeAgo(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid date';
    
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 }
    ];
    
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      
      if (count >= 1) {
        return count === 1 ? `1 ${interval.label} ago` : `${count} ${interval.label}s ago`;
      }
    }
    
    return 'just now';
  }

  // Format relative date
  static relativeDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Invalid date';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const taskDate = new Date(d);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (taskDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      const diffDays = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0 && diffDays <= 7) {
        return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
      } else if (diffDays < 0 && diffDays >= -7) {
        return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
      } else {
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      }
    }
  }

  // Format list for display
  static formatList(items: string[], conjunction: string = 'and'): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
    
    const last = items.pop();
    return `${items.join(', ')}, ${conjunction} ${last}`;
  }

  // Format progress bar width
  static progressWidth(current: number, total: number): string {
    if (total === 0) return '0%';
    const percentage = (current / total) * 100;
    return `${Math.min(100, Math.max(0, percentage))}%`;
  }

  // Format color for CSS
  static formatColor(color: string): string {
    // If it's already a valid hex or rgb, return as-is
    if (/^#([0-9A-F]{3}){1,2}$/i.test(color) || /^rgb/i.test(color)) {
      return color;
    }
    
    // Try to convert named color to hex
    const colors: Record<string, string> = {
      red: '#ff0000',
      green: '#00ff00',
      blue: '#0000ff',
      yellow: '#ffff00',
      orange: '#ffa500',
      purple: '#800080',
      pink: '#ffc0cb',
      brown: '#a52a2a',
      black: '#000000',
      white: '#ffffff',
      gray: '#808080'
    };
    
    return colors[color.toLowerCase()] || '#4361ee';
  }

  // Generate gradient CSS
  static generateGradient(color1: string, color2: string, angle: number = 45): string {
    return `linear-gradient(${angle}deg, ${this.formatColor(color1)}, ${this.formatColor(color2)})`;
  }
}