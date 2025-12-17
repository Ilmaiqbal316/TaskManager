import { AuthController } from '../../controllers/authController';
import { ValidationService } from '../../services/ValidationService';
import { ThemeService } from '../../services/ThemeService';
import { StorageService } from '../../services/StorageService';
import { AvatarService } from '../../services/AvatarService';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';
import { User } from '../../types';

// Extend the User type to include updatedAt for profile updates
interface ExtendedUser extends User {
  updatedAt?: Date;
}

export class ProfilePage {
  private element: HTMLElement;
  private authController: AuthController;
  private themeService: ThemeService;
  private storageService: StorageService;
  private avatarService: AvatarService;
  private modal: Modal;
  private user: ExtendedUser | null = null;
  private avatarUrl: string | null = null;

  constructor() {
    this.authController = new AuthController();
    this.themeService = ThemeService.getInstance();
    this.storageService = StorageService.getInstance();
    this.avatarService = AvatarService.getInstance();
    this.modal = new Modal();
    this.element = document.createElement('div');
    this.element.className = 'profile-page';
    
    // Initialize the page asynchronously
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load user data first
    await this.loadUserData();
    
    // Create the page content
    this.element.appendChild(this.createContent());
  }

  private async loadUserData(): Promise<void> {
    try {
      // First try to get user from AuthController
      const authUser = this.authController.getCurrentUser();
      if (authUser) {
        this.user = authUser as ExtendedUser;
      }
      
      // Then try to load from storage
      const storedUser = await this.storageService.get<ExtendedUser>('current_user');
      if (storedUser) {
        // Use stored data, but keep original createdAt if not in stored data
        this.user = {
          ...this.user,
          ...storedUser
        };
      }
      
      // Load avatar using AvatarService
      this.avatarUrl = await this.avatarService.getAvatar();
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  private createContent(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'profile-container';

    // Header
    const header = document.createElement('div');
    header.className = 'profile-header';

    const title = document.createElement('h1');
    title.className = 'profile-title';
    title.textContent = 'Profile Settings';

    const subtitle = document.createElement('p');
    subtitle.className = 'profile-subtitle';
    subtitle.textContent = 'Manage your account settings and preferences';

    header.appendChild(title);
    header.appendChild(subtitle);

    // Profile card
    const profileCard = this.createProfileCard();

    // Settings sections
    const settingsGrid = document.createElement('div');
    settingsGrid.className = 'settings-grid';

    // Appearance section
    const appearanceSection = this.createAppearanceSection();

    // Account section
    const accountSection = this.createAccountSection();

    // Data section
    const dataSection = this.createDataSection();

    settingsGrid.appendChild(appearanceSection);
    settingsGrid.appendChild(accountSection);
    settingsGrid.appendChild(dataSection);

    container.appendChild(header);
    container.appendChild(profileCard);
    container.appendChild(settingsGrid);

    return container;
  }

  private createProfileCard(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'profile-card';

    // Avatar
    const avatarSection = document.createElement('div');
    avatarSection.className = 'profile-avatar-section';

    const avatar = document.createElement('div');
    avatar.className = 'profile-avatar';
    
    // Set avatar content
    if (this.avatarUrl) {
      avatar.style.backgroundImage = `url(${this.avatarUrl})`;
      avatar.style.backgroundSize = 'cover';
      avatar.style.backgroundPosition = 'center';
      avatar.style.color = 'transparent'; // Hide text when image is shown
    } else {
      avatar.textContent = this.user?.username?.charAt(0).toUpperCase() || 'U';
      avatar.style.backgroundImage = 'none';
    }

    const avatarActions = document.createElement('div');
    avatarActions.className = 'profile-avatar-actions';

    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'btn-text';
    uploadBtn.textContent = 'Upload Photo';
    uploadBtn.addEventListener('click', () => this.handleAvatarUpload());

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn-text btn-text-danger';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => this.removeAvatar());

    avatarActions.appendChild(uploadBtn);
    avatarActions.appendChild(removeBtn);

    avatarSection.appendChild(avatar);
    avatarSection.appendChild(avatarActions);

    // User info - Use stored data if available
    const infoSection = document.createElement('div');
    infoSection.className = 'profile-info-section';

    const name = document.createElement('h2');
    name.className = 'profile-name';
    name.textContent = this.user?.username || 'User';

    const email = document.createElement('p');
    email.className = 'profile-email';
    email.textContent = this.user?.email || '';

    const memberSince = document.createElement('p');
    memberSince.className = 'profile-member-since';
    if (this.user?.createdAt) {
      const date = new Date(this.user.createdAt);
      memberSince.textContent = `Member since ${date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })}`;
    }

    infoSection.appendChild(name);
    infoSection.appendChild(email);
    infoSection.appendChild(memberSince);

    // Edit profile button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-secondary';
    editBtn.textContent = 'Edit Profile';
    editBtn.addEventListener('click', () => this.showEditProfileForm());

    card.appendChild(avatarSection);
    card.appendChild(infoSection);
    card.appendChild(editBtn);

    return card;
  }

  private async showEditProfileForm(): Promise<void> {
    // Ensure we have the latest user data
    await this.loadUserData();
    
    const user = this.user;
    if (!user) return;

    const form = document.createElement('form');
    form.className = 'profile-form';
    form.noValidate = true;

    // Username field
    const usernameGroup = this.createFormGroup(
      'username',
      'Username',
      'text',
      'Enter your username',
      user.username || '',
      true
    );

    // Email field
    const emailGroup = this.createFormGroup(
      'email',
      'Email',
      'email',
      'Enter your email',
      user.email || '',
      true
    );

    // Form actions
    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.modal.close());

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Save Changes';

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    form.appendChild(usernameGroup);
    form.appendChild(emailGroup);
    form.appendChild(actions);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const username = formData.get('username') as string;
      const email = formData.get('email') as string;

      try {
        ValidationService.validateRequired(username, 'Username');
        ValidationService.validateEmail(email);
        
        // Update user data
        if (this.user) {
          const updatedUser: ExtendedUser = {
            ...this.user,
            username,
            email
          };
          
          this.user = updatedUser;
          
          // Save to both storage services
          await this.storageService.save('current_user', updatedUser);
          localStorage.setItem('current_user', JSON.stringify(updatedUser));
          
          // Dispatch custom event for header update
          window.dispatchEvent(new CustomEvent('profile-updated', {
            detail: { username }
          }));
          
          Toast.success('Profile updated successfully');
          this.modal.close();
          
          // Completely refresh the profile card
          await this.refreshProfileCard();
        }
      } catch (error) {
        Toast.error((error as Error).message);
      }
    });

    this.modal.open(form, {
      title: 'Edit Profile',
      size: 'medium'
    });
  }

  private async refreshProfileCard(): Promise<void> {
    // Reload user data first
    await this.loadUserData();
    
    // Find and replace the profile card
    const profileCard = this.element.querySelector('.profile-card');
    if (profileCard && profileCard.parentNode) {
      const newProfileCard = this.createProfileCard();
      profileCard.parentNode.replaceChild(newProfileCard, profileCard);
    }
  }

  private handleAvatarUpload(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          Toast.error('File size must be less than 5MB');
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          Toast.error('Please select an image file');
          return;
        }

        try {
          // Create a FileReader to read the image
          const imageUrl = await this.readFileAsDataURL(file);
          
          // Use AvatarService to save (will notify all subscribers)
          await this.avatarService.setAvatar(imageUrl);
          
          // Update local state
          this.avatarUrl = imageUrl;
          
          // Update the avatar in the UI immediately
          const avatar = this.element.querySelector('.profile-avatar') as HTMLElement;
          if (avatar) {
            avatar.style.backgroundImage = `url(${imageUrl})`;
            avatar.style.backgroundSize = 'cover';
            avatar.style.backgroundPosition = 'center';
            avatar.style.color = 'transparent';
            avatar.textContent = '';
          }
          
          Toast.success('Avatar uploaded successfully');
        } catch (error) {
          Toast.error('Failed to upload avatar: ' + (error as Error).message);
        }
      }
    });
    
    input.click();
  }

  private readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read the image file'));
      };
      reader.readAsDataURL(file);
    });
  }

  private async removeAvatar(): Promise<void> {
    try {
      // Use AvatarService to remove (will notify all subscribers)
      await this.avatarService.removeAvatar();
      
      // Update local state
      this.avatarUrl = null;
      
      // Update UI immediately
      const avatar = this.element.querySelector('.profile-avatar') as HTMLElement;
      if (avatar) {
        avatar.style.backgroundImage = 'none';
        avatar.style.color = ''; // Restore text color
        avatar.textContent = this.user?.username?.charAt(0).toUpperCase() || 'U';
      }
      
      Toast.success('Avatar removed');
    } catch (error) {
      Toast.error('Failed to remove avatar: ' + (error as Error).message);
    }
  }

  private createFormGroup(
    id: string,
    label: string,
    type: string,
    placeholder: string,
    value: string,
    required: boolean = false
  ): HTMLElement {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    if (required) {
      labelEl.innerHTML += ' *';
    }

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.required = required;
    input.placeholder = placeholder;
    input.value = value;
    input.className = 'form-input';

    const error = document.createElement('div');
    error.className = 'form-error';
    error.id = `${id}-error`;

    group.appendChild(labelEl);
    group.appendChild(input);
    group.appendChild(error);

    return group;
  }

  private createAppearanceSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'settings-section';

    const header = document.createElement('div');
    header.className = 'settings-section-header';

    const title = document.createElement('h3');
    title.textContent = 'Appearance';
    title.className = 'settings-section-title';

    header.appendChild(title);

    const content = document.createElement('div');
    content.className = 'settings-section-content';

    // Theme toggle
    const themeGroup = document.createElement('div');
    themeGroup.className = 'settings-group';

    const themeLabel = document.createElement('label');
    themeLabel.textContent = 'Theme';
    themeLabel.className = 'settings-label';

    const themeSelect = document.createElement('select');
    themeSelect.className = 'form-select';
    themeSelect.id = 'theme-select';

    const lightOption = document.createElement('option');
    lightOption.value = 'light';
    lightOption.textContent = 'Light';

    const darkOption = document.createElement('option');
    darkOption.value = 'dark';
    darkOption.textContent = 'Dark';

    const autoOption = document.createElement('option');
    autoOption.value = 'auto';
    autoOption.textContent = 'System Default';

    themeSelect.appendChild(lightOption);
    themeSelect.appendChild(darkOption);
    themeSelect.appendChild(autoOption);

    // Set current theme
    const currentTheme = this.themeService.getCurrentTheme();
    themeSelect.value = currentTheme;

    themeSelect.addEventListener('change', async (e) => {
      const selectedTheme = (e.target as HTMLSelectElement).value;
      
      // Save theme preference to storage
      try {
        await this.storageService.save('theme_preference', selectedTheme);
        
        // Apply the theme
        if (selectedTheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else if (selectedTheme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          // Auto mode - use system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
        
        Toast.success('Theme preference saved');
      } catch (error) {
        Toast.error('Failed to save theme preference');
      }
    });

    themeGroup.appendChild(themeLabel);
    themeGroup.appendChild(themeSelect);

    // Notifications
    const notificationsGroup = document.createElement('div');
    notificationsGroup.className = 'settings-group';

    const notificationsLabel = document.createElement('label');
    notificationsLabel.textContent = 'Notifications';
    notificationsLabel.className = 'settings-label';

    const notificationsToggle = document.createElement('label');
    notificationsToggle.className = 'toggle-switch';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.id = 'notifications-toggle';
    
    // Load notification preference
    this.storageService.get<boolean>('notifications_enabled').then(isEnabled => {
      toggleInput.checked = isEnabled !== false; // default to true
    });

    const toggleSlider = document.createElement('span');
    toggleSlider.className = 'toggle-slider';

    notificationsToggle.appendChild(toggleInput);
    notificationsToggle.appendChild(toggleSlider);

    toggleInput.addEventListener('change', async () => {
      await this.storageService.save('notifications_enabled', toggleInput.checked);
      Toast.info(`Notifications ${toggleInput.checked ? 'enabled' : 'disabled'}`);
    });

    notificationsGroup.appendChild(notificationsLabel);
    notificationsGroup.appendChild(notificationsToggle);

    content.appendChild(themeGroup);
    content.appendChild(notificationsGroup);

    section.appendChild(header);
    section.appendChild(content);

    return section;
  }

  private createAccountSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'settings-section';

    const header = document.createElement('div');
    header.className = 'settings-section-header';

    const title = document.createElement('h3');
    title.textContent = 'Account';
    title.className = 'settings-section-title';

    header.appendChild(title);

    const content = document.createElement('div');
    content.className = 'settings-section-content';

    // Change password button
    const changePasswordBtn = document.createElement('button');
    changePasswordBtn.type = 'button';
    changePasswordBtn.className = 'btn btn-secondary btn-block';
    changePasswordBtn.textContent = 'Change Password';
    changePasswordBtn.addEventListener('click', () => this.showChangePasswordForm());

    // Delete account button
    const deleteAccountBtn = document.createElement('button');
    deleteAccountBtn.type = 'button';
    deleteAccountBtn.className = 'btn btn-danger btn-block';
    deleteAccountBtn.textContent = 'Delete Account';
    deleteAccountBtn.addEventListener('click', () => this.confirmDeleteAccount());

    content.appendChild(changePasswordBtn);
    content.appendChild(deleteAccountBtn);

    section.appendChild(header);
    section.appendChild(content);

    return section;
  }

  private createDataSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = 'settings-section';

    const header = document.createElement('div');
    header.className = 'settings-section-header';

    const title = document.createElement('h3');
    title.textContent = 'Data Management';
    title.className = 'settings-section-title';

    header.appendChild(title);

    const content = document.createElement('div');
    content.className = 'settings-section-content';

    // Export data button
    const exportBtn = document.createElement('button');
    exportBtn.type = 'button';
    exportBtn.className = 'btn btn-secondary btn-block';
    exportBtn.textContent = 'Export All Data';
    exportBtn.addEventListener('click', () => this.handleExportData());

    // Import data button
    const importBtn = document.createElement('button');
    importBtn.type = 'button';
    importBtn.className = 'btn btn-secondary btn-block';
    importBtn.textContent = 'Import Data';
    importBtn.addEventListener('click', () => this.handleImportData());

    // Clear data button
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn btn-danger btn-block';
    clearBtn.textContent = 'Clear All Data';
    clearBtn.addEventListener('click', () => this.handleConfirmClearData());

    content.appendChild(exportBtn);
    content.appendChild(importBtn);
    content.appendChild(clearBtn);

    section.appendChild(header);
    section.appendChild(content);

    return section;
  }

  private showChangePasswordForm(): void {
    const currentUser = this.authController.getCurrentUser();
    if (!currentUser) {
      Toast.error('You must be logged in to change password');
      return;
    }

    const form = document.createElement('form');
    form.className = 'password-form';
    form.noValidate = true;

    // Current password
    const currentGroup = this.createFormGroup(
      'currentPassword',
      'Current Password',
      'password',
      'Enter your current password',
      '',
      true
    );

    // New password
    const newGroup = this.createFormGroup(
      'newPassword',
      'New Password',
      'password',
      'Enter new password',
      '',
      true
    );

    // Confirm new password
    const confirmGroup = this.createFormGroup(
      'confirmPassword',
      'Confirm New Password',
      'password',
      'Re-enter new password',
      '',
      true
    );

    // Form actions
    const actions = document.createElement('div');
    actions.className = 'form-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.modal.close());

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Change Password';

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);

    form.appendChild(currentGroup);
    form.appendChild(newGroup);
    form.appendChild(confirmGroup);
    form.appendChild(actions);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const currentPassword = formData.get('currentPassword') as string;
      const newPassword = formData.get('newPassword') as string;
      const confirmPassword = formData.get('confirmPassword') as string;

      try {
        ValidationService.validateRequired(currentPassword, 'Current password');
        ValidationService.validatePassword(newPassword);
        
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match');
        }
        
        // Use AuthController to change password
        await this.authController.changePassword(
          currentUser.email,
          currentPassword,
          newPassword
        );
        
        Toast.success('Password changed successfully');
        this.modal.close();
      } catch (error) {
        Toast.error((error as Error).message);
      }
    });

    this.modal.open(form, {
      title: 'Change Password',
      size: 'medium'
    });
  }

  private handleExportData(): void {
    this.storageService.exportToJSON('task-manager-data-export.json')
      .then(() => {
        Toast.success('Data exported successfully! File will download shortly.');
      })
      .catch((error) => {
        Toast.error('Failed to export data: ' + error.message);
      });
  }

  private handleImportData(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await this.readFileAsText(file);
          
          // Show confirmation modal before importing
          this.showImportConfirmation(text);
        } catch (error) {
          Toast.error('Failed to read the file: ' + (error as Error).message);
        }
      }
    });
    
    input.click();
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read the file'));
      };
      reader.readAsText(file);
    });
  }

  private showImportConfirmation(backupData: string): void {
    const confirmContent = document.createElement('div');
    confirmContent.className = 'confirm-dialog';
    
    const warning = document.createElement('div');
    warning.className = 'warning-message';
    warning.innerHTML = '⚠️';
    
    const message = document.createElement('p');
    message.textContent = 'Importing data will overwrite your current data. Are you sure you want to continue?';
    
    const actions = document.createElement('div');
    actions.className = 'confirm-actions';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.modal.close());
    
    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn-primary';
    importBtn.textContent = 'Import Data';
    importBtn.addEventListener('click', async () => {
      try {
        await this.storageService.restoreData(backupData);
        Toast.success('Data imported successfully! Page will refresh.');
        this.modal.close();
        
        // Refresh after a short delay to show the success message
        setTimeout(() => {
          location.reload();
        }, 1500);
      } catch (error) {
        Toast.error('Failed to import data: ' + (error as Error).message);
      }
    });
    
    actions.appendChild(cancelBtn);
    actions.appendChild(importBtn);
    
    confirmContent.appendChild(warning);
    confirmContent.appendChild(message);
    confirmContent.appendChild(actions);
    
    this.modal.open(confirmContent, {
      title: 'Import Data',
      size: 'small'
    });
  }

  private confirmDeleteAccount(): void {
    const confirmContent = document.createElement('div');
    confirmContent.className = 'confirm-dialog';
    
    const warning = document.createElement('div');
    warning.className = 'warning-message';
    warning.innerHTML = '⚠️';
    
    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to delete your account? This will permanently remove all your data and cannot be undone.';
    
    const actions = document.createElement('div');
    actions.className = 'confirm-actions';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.modal.close());
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Delete Account';
    deleteBtn.addEventListener('click', async () => {
      try {
        const currentUser = this.authController.getCurrentUser();
        
        if (currentUser) {
          // Remove user from tm_users array
          const users = await this.storageService.get<User[]>('tm_users') || [];
          const updatedUsers = users.filter(u => u.id !== currentUser.id);
          await this.storageService.save('tm_users', updatedUsers);
        }
        
        // Clear all user-specific data
        const keysToRemove = [
          'current_user',
          'user_avatar',
          'theme_preference',
          'notifications_enabled'
        ];
        
        for (const key of keysToRemove) {
          await this.storageService.remove(key);
          localStorage.removeItem(key);
        }
        
        // Also remove tm_currentUser
        localStorage.removeItem('tm_currentUser');
        
        // Remove avatar through AvatarService (will notify subscribers)
        await this.avatarService.removeAvatar();
        
        // Logout from AuthController
        this.authController.logout();
        
        Toast.success('Account deleted successfully');
        this.modal.close();
        
        // Redirect to login page
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } catch (error) {
        Toast.error('Failed to delete account: ' + (error as Error).message);
      }
    });
    
    actions.appendChild(cancelBtn);
    actions.appendChild(deleteBtn);
    
    confirmContent.appendChild(warning);
    confirmContent.appendChild(message);
    confirmContent.appendChild(actions);
    
    this.modal.open(confirmContent, {
      title: 'Delete Account',
      size: 'small'
    });
  }

  private handleConfirmClearData(): void {
    const confirmContent = document.createElement('div');
    confirmContent.className = 'confirm-dialog';
    
    const warning = document.createElement('div');
    warning.className = 'warning-message';
    warning.innerHTML = '⚠️';
    
    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to clear all your data? This will delete all tasks, categories, and settings.';
    
    const actions = document.createElement('div');
    actions.className = 'confirm-actions';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.modal.close());
    
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-danger';
    clearBtn.textContent = 'Clear All Data';
    clearBtn.addEventListener('click', async () => {
      try {
        // Get auth data to preserve
        const currentUser = this.authController.getCurrentUser();
        const users = await this.storageService.get<User[]>('tm_users');
        const tmCurrentUser = localStorage.getItem('tm_currentUser');
        const avatar = await this.avatarService.getAvatar();
        
        // Clear localStorage
        localStorage.clear();
        
        // Restore authentication data
        if (users) {
          await this.storageService.save('tm_users', users);
        }
        if (tmCurrentUser) {
          localStorage.setItem('tm_currentUser', tmCurrentUser);
        }
        if (currentUser) {
          await this.storageService.save('current_user', currentUser);
        }
        if (avatar) {
          await this.avatarService.setAvatar(avatar);
        }
        
        Toast.success('All data cleared successfully');
        this.modal.close();
        location.reload();
      } catch (error) {
        Toast.error('Failed to clear data: ' + (error as Error).message);
      }
    });
    
    actions.appendChild(cancelBtn);
    actions.appendChild(clearBtn);
    
    confirmContent.appendChild(warning);
    confirmContent.appendChild(message);
    confirmContent.appendChild(actions);
    
    this.modal.open(confirmContent, {
      title: 'Clear All Data',
      size: 'small'
    });
  }

  render(): HTMLElement {
    return this.element;
  }
}