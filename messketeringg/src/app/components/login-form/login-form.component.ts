import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CateringApiService } from '../../services/catering-api.service';
import { getApiErrorMessage } from '../../shared/utils/api-error.utils';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule],
  template: `
    <main class="login-page">
      <form class="login-panel" [formGroup]="loginForm" (ngSubmit)="login()">
        <p class="eyebrow">Mess Ketering</p>
        <h1>Admin Login</h1>
        <p class="status">{{ statusMessage }}</p>

        <label class="field">
          Email
          <input type="email" formControlName="email">
        </label>

        <label class="field">
          Password
          <input type="password" formControlName="password">
        </label>

        <button type="submit" [disabled]="loginForm.invalid || isLoggingIn">Login</button>
      </form>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f7f4ef;
      color: #211f1c;
      font-family: Arial, Helvetica, sans-serif;
    }

    .login-page {
      display: grid;
      min-height: 100vh;
      place-items: center;
      padding: 24px;
    }

    .login-panel {
      display: grid;
      width: min(420px, 100%);
      gap: 16px;
      padding: 24px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
      box-shadow: 0 8px 22px rgb(33 31 28 / 8%);
    }

    .eyebrow {
      margin: 0;
      color: #9a4b1f;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    h1,
    .status {
      margin: 0;
    }

    .status {
      color: #645d54;
      line-height: 1.5;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-weight: 700;
    }

    input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #cfc6b8;
      border-radius: 6px;
      padding: 10px 12px;
      color: #211f1c;
      font: inherit;
      background: #ffffff;
    }

    button {
      min-height: 42px;
      border: 0;
      border-radius: 6px;
      padding: 0 14px;
      color: #ffffff;
      font: inherit;
      font-weight: 700;
      background: #19624a;
      cursor: pointer;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  `],
})
export class LoginFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(CateringApiService);

  @Output() loggedIn = new EventEmitter<void>();

  isLoggingIn = false;
  statusMessage = 'Login with your admin account.';

  @Input()
  set message(value: string) {
    if (value) {
      this.statusMessage = value;
    }
  }

  loginForm = this.fb.nonNullable.group({
    email: ['admin@example.com', [Validators.required, Validators.email]],
    password: ['admin123', Validators.required],
  });

  login() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoggingIn = true;
    const { email, password } = this.loginForm.getRawValue();

    this.api.login(email, password).subscribe({
      next: (response) => {
        this.api.saveToken(response.token);
        this.loggedIn.emit();
      },
      error: (err) => {
        this.statusMessage = getApiErrorMessage(err, 'Login failed.');
        console.error(err);
      },
      complete: () => {
        this.isLoggingIn = false;
      },
    });
  }
}
