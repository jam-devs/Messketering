import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="login-page">
      <mat-card class="login-card">
        <div class="login-brand">
          <mat-icon>restaurant_menu</mat-icon>
          <h1>MessCatering</h1>
          <p>Catering Operations Dashboard</p>
        </div>
        <form (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="email" name="email" required />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" [(ngModel)]="password" name="password" required />
          </mat-form-field>
          @if (error()) {
            <p class="login-error">{{ error() }}</p>
          }
          <button mat-flat-button color="primary" type="submit" class="full-width login-btn">
            Sign In
          </button>
        </form>
        <div class="demo-accounts">
          <p>Demo accounts:</p>
          <small>admin@example.com / admin123</small>
          <small>kitchen@example.com / kitchen123</small>
          <small>logistics@example.com / logistics123</small>
        </div>
      </mat-card>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = 'admin@example.com';
  password = 'admin123';
  readonly error = signal('');

  async onSubmit(): Promise<void> {
    const success = await this.auth.login(this.email, this.password);

    if (success) {
      this.router.navigate(['/admin']);
    } else {
      this.error.set('Invalid email or password');
    }
  }
}
