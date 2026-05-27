import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CateringApiService } from '../../services/catering-api.service';
import { getApiErrorMessage } from '../../shared/utils/api-error.utils';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule],
  template: `
    <section class="password-panel">
      <div class="panel-header">
        <h2>Admin Password</h2>
        <button type="button" class="secondary" (click)="toggleForm()">
          {{ isOpen ? 'Close' : 'Change Password' }}
        </button>
      </div>

      @if (isOpen) {
        <form class="password-form" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
          <label class="field">
            Current Password
            <input type="password" formControlName="current_password">
          </label>

          <label class="field">
            New Password
            <input type="password" formControlName="new_password">
          </label>

          <label class="field">
            Confirm New Password
            <input type="password" formControlName="new_password_confirmation">
          </label>

          <button type="submit" [disabled]="passwordForm.invalid || isSaving">Save Password</button>
        </form>
      }
    </section>
  `,
  styles: [`
    .password-panel {
      margin-bottom: 28px;
      padding: 16px;
      border: 1px solid #ded6ca;
      border-radius: 8px;
      background: #fffdf9;
      box-shadow: 0 8px 22px rgb(33 31 28 / 8%);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    h2 {
      margin: 0;
      font-size: 1.2rem;
      line-height: 1.15;
    }

    .password-form {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
      gap: 12px;
      align-items: end;
      margin-top: 16px;
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
      min-height: 40px;
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

    .secondary {
      border: 1px solid #cfc6b8;
      color: #211f1c;
      background: #ffffff;
    }

    @media (max-width: 860px) {
      .password-form {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private api = inject(CateringApiService);

  @Output() statusChanged = new EventEmitter<string>();

  isOpen = false;
  isSaving = false;

  passwordForm = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    new_password_confirmation: ['', Validators.required],
  });

  toggleForm() {
    this.isOpen = !this.isOpen;
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      return;
    }

    const value = this.passwordForm.getRawValue();

    if (value.new_password !== value.new_password_confirmation) {
      this.statusChanged.emit('New password confirmation does not match.');
      return;
    }

    this.isSaving = true;

    this.api.changePassword(value).subscribe({
      next: () => {
        this.statusChanged.emit('Password changed.');
        this.passwordForm.reset({
          current_password: '',
          new_password: '',
          new_password_confirmation: '',
        });
        this.isOpen = false;
      },
      error: (err) => {
        this.statusChanged.emit(getApiErrorMessage(err, 'Failed to change password.'));
        console.error(err);
      },
      complete: () => {
        this.isSaving = false;
      },
    });
  }
}
