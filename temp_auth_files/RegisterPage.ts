import { AuthController } from '../../controllers/authController';
import { ValidationService } from '../../services/ValidationService';
import { Toast } from '../components/Toast';
import { PasswordStrength } from '../../utils/passwordStrength';

export class RegisterPage {
  private element: HTMLElement;
  private authController: AuthController;
  private onRegisterSuccess: () => void;
  private onLoginClick: () => void;
  private isSubmitting: boolean = false;

  constructor(onRegisterSuccess: () => void, onLoginClick: () => void) {
    this.authController = new AuthController();
    this.onRegisterSuccess = onRegisterSuccess;
    this.onLoginClick = onLoginClick;
    this.element = this.createPage();
    this.bindEvents();
  }

  private createPage(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'auth-page';

    const container = document.createElement('div');
    container.className = 'auth-container';

    // Header
    const header = document.createElement('div');
    header.className = 'auth-header';

    const logo = document.createElement('h1');
    logo.className = 'auth-logo';
    logo.textContent = 'Create Account';

    const subtitle = document.createElement('p');
    subtitle.className = 'auth-subtitle';
    subtitle.textContent = 'Join Task Manager today';

    header.appendChild(logo);
    header.appendChild(subtitle);

    // Form
    const form = document.createElement('form');
    form.className = 'auth-form';
    form.noValidate = true;
    form.id = 'register-form';

    // Username field
    const usernameGroup = this.createFormGroup(
      'username',
      'Username',
      'text',
      'Choose a username',
      true
    );

    // Email field
    const emailGroup = this.createFormGroup(
      'email',
      'Email',
      'email',
      'Enter your email',
      true
    );

    // Password field
    const passwordGroup = this.createPasswordGroup();

    // Confirm password field
    const confirmGroup = this.createFormGroup(
      'confirmPassword',
      'Confirm Password',
      'password',
      'Re-enter your password',
      true
    );

    // Terms agreement
    const termsGroup = document.createElement('div');
    termsGroup.className = 'form-group-terms';

    const termsCheck = document.createElement('input');
    termsCheck.type = 'checkbox';
    termsCheck.id = 'terms';
    termsCheck.name = 'terms';
    termsCheck.required = true;

    const termsLabel = document.createElement('label');
    termsLabel.htmlFor = 'terms';
    termsLabel.innerHTML = 'I agree to the <a href="#" class="terms-link">Terms of Service</a> and <a href="#" class="terms-link">Privacy Policy</a>';

    const termsError = document.createElement('div');
    termsError.className = 'form-error';
    termsError.id = 'terms-error';

    termsGroup.appendChild(termsCheck);
    termsGroup.appendChild(termsLabel);
    termsGroup.appendChild(termsError);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary btn-block';
    submitBtn.textContent = 'Create Account';
    submitBtn.id = 'register-submit';

    // Error display
    const errorDisplay = document.createElement('div');
    errorDisplay.className = 'form-error-display';
    errorDisplay.id = 'register-error';

    form.appendChild(usernameGroup);
    form.appendChild(emailGroup);
    form.appendChild(passwordGroup);
    form.appendChild(confirmGroup);
    form.appendChild(termsGroup);
    form.appendChild(errorDisplay);
    form.appendChild(submitBtn);

    // Login link
    const loginSection = document.createElement('div');
    loginSection.className = 'auth-links';

    const loginText = document.createElement('p');
    loginText.textContent = 'Already have an account?';

    const loginLink = document.createElement('button');
    loginLink.type = 'button';
    loginLink.className = 'btn-text';
    loginLink.textContent = 'Sign in here';
    loginLink.addEventListener('click', () => this.onLoginClick());

    loginSection.appendChild(loginText);
    loginSection.appendChild(loginLink);

    // Assemble container
    container.appendChild(header);
    container.appendChild(form);
    container.appendChild(loginSection);

    page.appendChild(container);

    return page;
  }

  private bindEvents(): void {
    const form = this.element.querySelector('#register-form') as HTMLFormElement;
    if (form) {
      form.removeEventListener('submit', this.handleSubmit.bind(this));
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  private createFormGroup(
    id: string,
    label: string,
    type: string,
    placeholder: string,
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
    input.className = 'form-input';

    const error = document.createElement('div');
    error.className = 'form-error';
    error.id = `${id}-error`;

    group.appendChild(labelEl);
    group.appendChild(input);
    group.appendChild(error);

    return group;
  }

  private createPasswordGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'form-group';

    const label = document.createElement('label');
    label.htmlFor = 'password';
    label.textContent = 'Password *';

    const inputContainer = document.createElement('div');
    inputContainer.className = 'password-input-container';

    const input = document.createElement('input');
    input.type = 'password';
    input.id = 'password';
    input.name = 'password';
    input.required = true;
    input.placeholder = 'Create a strong password';
    input.className = 'form-input';
    input.autocomplete = 'new-password';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'password-toggle';
    toggleBtn.innerHTML = '👁';
    toggleBtn.title = 'Show password';
    toggleBtn.addEventListener('click', () => {
      const type = input.type === 'password' ? 'text' : 'password';
      input.type = type;
      toggleBtn.innerHTML = type === 'password' ? '👁' : '👁‍🗨';
      toggleBtn.title = type === 'password' ? 'Show password' : 'Hide password';
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(toggleBtn);

    const strengthContainer = document.createElement('div');
    strengthContainer.className = 'password-strength-container';

    const strengthLabel = document.createElement('div');
    strengthLabel.className = 'password-strength-label d-flex justify-between';
    strengthLabel.innerHTML = '<span>Password strength:</span>';

    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength-indicator';

    const strengthText = document.createElement('span');
    strengthText.className = 'password-strength-text';
    strengthText.textContent = 'none';

    strengthLabel.appendChild(strengthText);
    strengthContainer.appendChild(strengthLabel);
    strengthContainer.appendChild(strengthIndicator);

    input.addEventListener('input', () => {
      const strength = PasswordStrength.getStrength(input.value);
      const strengthLevel = strength.level.toLowerCase();
      
      strengthIndicator.className = `password-strength-indicator strength-${strengthLevel}`;
      strengthText.textContent = strength.level;
      strengthText.className = `password-strength-text strength-${strengthLevel}`;
    });

    const error = document.createElement('div');
    error.className = 'form-error';
    error.id = 'password-error';

    group.appendChild(label);
    group.appendChild(inputContainer);
    group.appendChild(strengthContainer);
    group.appendChild(error);

    return group;
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    if (this.isSubmitting) {
      return;
    }
    
    this.isSubmitting = true;
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const terms = (form.querySelector('#terms') as HTMLInputElement)?.checked || false;

    this.clearFormErrors();

    try {
      ValidationService.validateRequired(username, 'Username');
      ValidationService.validateEmail(email);
      ValidationService.validatePassword(password);
      
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      if (!terms) {
        throw new Error('You must agree to the terms and conditions');
      }
    } catch (err) {
      this.showFormError((err as Error).message);
      this.isSubmitting = false;
      return;
    }

    const submitBtn = form.querySelector('#register-submit') as HTMLButtonElement;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;

    try {
      const user = await this.authController.register({
        email,
        username,
        password
      });

      console.log('RegisterPage: Registration successful for:', user.email);
      Toast.success('Account created successfully!');
      
      setTimeout(() => {
        this.onRegisterSuccess();
      }, 100);
      
    } catch (err) {
      console.error('RegisterPage: Registration failed:', err);
      this.showFormError((err as Error).message);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      this.isSubmitting = false;
    }
  }

  private clearFormErrors(): void {
    const errorDisplay = this.element.querySelector('#register-error') as HTMLElement;
    if (errorDisplay) {
      errorDisplay.textContent = '';
    }
  }

  private showFormError(message: string): void {
    const errorDisplay = this.element.querySelector('#register-error') as HTMLElement;
    if (errorDisplay) {
      errorDisplay.textContent = message;
    }
  }

  render(): HTMLElement {
    return this.element;
  }

  focus(): void {
    const usernameInput = this.element.querySelector('#username') as HTMLInputElement;
    if (usernameInput) {
      usernameInput.focus();
    }
  }

  destroy(): void {
    const form = this.element.querySelector('#register-form') as HTMLFormElement;
    if (form) {
      form.removeEventListener('submit', this.handleSubmit.bind(this));
    }
  }
}