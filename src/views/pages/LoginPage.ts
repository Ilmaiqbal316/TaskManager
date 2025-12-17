import { AuthController } from '../../controllers/authController';
import { ValidationService } from '../../services/ValidationService';
import { Toast } from '../components/Toast';

export class LoginPage {
  private element: HTMLElement;
  private authController: AuthController;
  private onLoginSuccess: () => void;
  private onRegisterClick: () => void;

  constructor(onLoginSuccess: () => void, onRegisterClick: () => void) {
    this.authController = new AuthController();
    this.onLoginSuccess = onLoginSuccess;
    this.onRegisterClick = onRegisterClick;
    this.element = this.createPage();
  }

  private createPage(): HTMLElement {
    const page = document.createElement('div');
    page.className = 'login-page';

    const container = document.createElement('div');
    container.className = 'login-container';

    // Header
    const header = document.createElement('div');
    header.className = 'login-header';

    const logo = document.createElement('h1');
    logo.className = 'login-logo';
    logo.textContent = 'Task Manager';

    const subtitle = document.createElement('p');
    subtitle.className = 'login-subtitle';
    subtitle.textContent = 'Sign in to your account';

    header.appendChild(logo);
    header.appendChild(subtitle);

    // Form
    const form = document.createElement('form');
    form.className = 'login-form';
    form.noValidate = true;
    form.id = 'login-form';

    // Email field
    const emailGroup = this.createFormGroup(
      'email',
      'Email',
      'email',
      'Enter your email',
      true
    );

    // Password field
    const passwordGroup = this.createFormGroup(
      'password',
      'Password',
      'password',
      'Enter your password',
      true
    );

    // Remember me
    const rememberGroup = document.createElement('div');
    rememberGroup.className = 'form-group-remember';

    const rememberCheck = document.createElement('input');
    rememberCheck.type = 'checkbox';
    rememberCheck.id = 'remember';
    rememberCheck.name = 'remember';

    const rememberLabel = document.createElement('label');
    rememberLabel.htmlFor = 'remember';
    rememberLabel.textContent = 'Remember me';

    rememberGroup.appendChild(rememberCheck);
    rememberGroup.appendChild(rememberLabel);

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary btn-block';
    submitBtn.textContent = 'Sign In';
    submitBtn.id = 'login-submit';

    // Error display
    const errorDisplay = document.createElement('div');
    errorDisplay.className = 'form-error-display';
    errorDisplay.id = 'login-error';

    form.appendChild(emailGroup);
    form.appendChild(passwordGroup);
    form.appendChild(rememberGroup);
    form.appendChild(errorDisplay);
    form.appendChild(submitBtn);

    // Form submission
    form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Register link
    const registerSection = document.createElement('div');
    registerSection.className = 'login-register';

    const registerText = document.createElement('p');
    registerText.textContent = "Don't have an account?";

    const registerLink = document.createElement('button');
    registerLink.type = 'button';
    registerLink.className = 'btn-text';
    registerLink.textContent = 'Sign up here';
    registerLink.addEventListener('click', this.onRegisterClick);

    registerSection.appendChild(registerText);
    registerSection.appendChild(registerLink);

    // Assemble container
    container.appendChild(header);
    container.appendChild(form);
    container.appendChild(registerSection);

    page.appendChild(container);

    return page;
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
    labelEl.className = 'form-label';
    if (required) {
      labelEl.classList.add('required');
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

    // Add validation
    if (id === 'email') {
      input.addEventListener('blur', () => this.validateEmail(input, error));
    }

    return group;
  }

  private validateEmail(input: HTMLInputElement, error: HTMLElement): void {
    try {
      ValidationService.validateEmail(input.value);
      error.textContent = '';
      input.classList.remove('error');
    } catch (err) {
      error.textContent = (err as Error).message;
      input.classList.add('error');
    }
  }

  private async handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const remember = formData.get('remember') === 'on';

    // Clear previous errors
    const errorDisplay = form.querySelector('#login-error') as HTMLElement;
    errorDisplay.textContent = '';

    // Validate
    try {
      ValidationService.validateEmail(email);
      ValidationService.validateRequired(password, 'Password');
    } catch (err) {
      errorDisplay.textContent = (err as Error).message;
      return;
    }

    // Disable form during submission
    const submitBtn = form.querySelector('#login-submit') as HTMLButtonElement;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;

    try {
      // FIX: Wait for login to complete and verify result
      const user = await this.authController.login(email, password);
      console.log('LoginPage: Login returned user:', user?.email);
      
      if (remember) {
        localStorage.setItem('tm_remembered_email', email);
      } else {
        localStorage.removeItem('tm_remembered_email');
      }

      Toast.success('Login successful!');
      
      // FIX: Small delay to ensure all state is updated
      setTimeout(() => {
        this.onLoginSuccess();
      }, 100);
      
    } catch (err) {
      console.error('LoginPage: Login failed:', err);
      errorDisplay.textContent = (err as Error).message;
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  render(): HTMLElement {
    return this.element;
  }

  focus(): void {
    const emailInput = this.element.querySelector('#email') as HTMLInputElement;
    if (emailInput) {
      const rememberedEmail = localStorage.getItem('tm_remembered_email');
      if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        const passwordInput = this.element.querySelector('#password') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
        }
      } else {
        emailInput.focus();
      }
    }
  }
}