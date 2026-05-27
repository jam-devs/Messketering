import { Component, input, output, OnInit, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  template: `
    <mat-form-field appearance="outline" class="search-bar-field">
      <mat-label>{{ label() }}</mat-label>
      <input matInput [formControl]="control" [placeholder]="placeholder()" />
      <mat-icon matPrefix>search</mat-icon>
      @if (control.value) {
        <button mat-icon-button matSuffix type="button" (click)="clear()" aria-label="Clear search">
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
})
export class SearchBarComponent implements OnInit, OnDestroy {
  readonly label = input('Search');
  readonly placeholder = input('Type to filter...');
  readonly initialValue = input('');
  readonly debounceMs = input(200);
  readonly searchChange = output<string>();

  readonly control = new FormControl('', { nonNullable: true });
  private sub?: Subscription;

  ngOnInit(): void {
    if (this.initialValue()) {
      this.control.setValue(this.initialValue(), { emitEvent: false });
    }
    this.sub = this.control.valueChanges
      .pipe(debounceTime(this.debounceMs()), distinctUntilChanged())
      .subscribe((v) => this.searchChange.emit(v.trim()));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  clear(): void {
    this.control.setValue('');
  }
}
