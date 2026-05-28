import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { firstValueFrom } from 'rxjs';
import { PageHeaderComponent } from '../../../shared/components/page-header.component';
import { CateringApiService } from '../../../services/catering-api.service';
import { GmailMessage, GmailStatus } from '../../../models/catering-manager.model';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header title="Gmail Inbox" subtitle="Read your Gmail messages directly from the dashboard" />

    <mat-card>
      <mat-card-content>
        @if (error()) {
          <p class="error-text">{{ error() }}</p>
        }

        @if (status(); as s) {
          <div class="status-row">
            <div>
              <strong>Status:</strong>
              @if (s.connected) {
                <span> Connected{{ s.email_address ? ' as ' + s.email_address : '' }}</span>
              } @else {
                <span> Not connected</span>
              }
            </div>
            <div class="actions">
              @if (!s.connected) {
                <button mat-raised-button color="primary" (click)="connect()" [disabled]="loading()">
                  <mat-icon>link</mat-icon>
                  Connect Gmail
                </button>
              } @else {
                <button mat-stroked-button (click)="disconnect()" [disabled]="loading()">
                  <mat-icon>link_off</mat-icon>
                  Disconnect
                </button>
                <button mat-raised-button color="primary" (click)="loadMessages()" [disabled]="loading()">
                  <mat-icon>refresh</mat-icon>
                  Refresh
                </button>
              }
            </div>
          </div>
        }
      </mat-card-content>
    </mat-card>

    @if (status()?.connected) {
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Recent Inbox Messages</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="messages()">
            <ng-container matColumnDef="from">
              <th mat-header-cell *matHeaderCellDef>From</th>
              <td mat-cell *matCellDef="let m">{{ m.from || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="subject">
              <th mat-header-cell *matHeaderCellDef>Subject</th>
              <td mat-cell *matCellDef="let m">{{ m.subject || '(No subject)' }}</td>
            </ng-container>
            <ng-container matColumnDef="snippet">
              <th mat-header-cell *matHeaderCellDef>Snippet</th>
              <td mat-cell *matCellDef="let m">{{ m.snippet || '-' }}</td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let m">{{ asDate(m) | date:'medium' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>

          @if (!messages().length && !loading()) {
            <p class="empty-text">No inbox messages found.</p>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
})
export class InboxComponent {
  private readonly api = inject(CateringApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly status = signal<GmailStatus | null>(null);
  readonly messages = signal<GmailMessage[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly columns = ['from', 'subject', 'snippet', 'date'];

  constructor() {
    void this.initialize();
  }

  async initialize(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const code = this.route.snapshot.queryParamMap.get('code');
      const state = this.route.snapshot.queryParamMap.get('state');

      if (code && state) {
        await firstValueFrom(this.api.connectEmail(code, state));

        await this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true,
        });
      } else if (code || state) {
        this.error.set('Invalid OAuth callback data. Please reconnect Gmail.');
      }

      await this.loadStatus();

      if (this.status()?.connected) {
        await this.loadMessages();
      }
    } catch (error: unknown) {
      this.error.set(this.describeError(error, 'Failed to initialize Gmail inbox. Please try again.'));
    } finally {
      this.loading.set(false);
    }
  }

  async connect(): Promise<void> {
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.api.getEmailAuthUrl());
      window.location.href = response.data.auth_url;
    } catch (error: unknown) {
      this.error.set(this.describeError(error, 'Unable to start Gmail connection flow. Check OAuth configuration.'));
    }
  }

  async disconnect(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(this.api.disconnectEmail());
      this.status.set({ connected: false, expires_at: null, scope: null, email_address: null });
      this.messages.set([]);
    } catch (error: unknown) {
      this.error.set(this.describeError(error, 'Failed to disconnect Gmail account.'));
    } finally {
      this.loading.set(false);
    }
  }

  async loadMessages(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(this.api.getEmailMessages(20));
      this.messages.set(response.data);
    } catch (error: unknown) {
      this.error.set(this.describeError(error, 'Unable to fetch inbox messages.'));
    } finally {
      this.loading.set(false);
    }
  }

  asDate(message: GmailMessage): Date {
    const internalDate = Number(message.internal_date);

    if (!Number.isNaN(internalDate) && internalDate > 0) {
      return new Date(internalDate);
    }

    return new Date(message.date);
  }

  private async loadStatus(): Promise<void> {
    const response = await firstValueFrom(this.api.getEmailStatus());
    this.status.set(response.data);
  }

  private describeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;

      if (typeof apiMessage === 'string' && apiMessage.trim() !== '') {
        return apiMessage;
      }

      if (typeof error.message === 'string' && error.message.trim() !== '') {
        return error.message;
      }
    }

    return fallback;
  }
}
