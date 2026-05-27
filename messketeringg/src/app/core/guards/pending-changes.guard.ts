import { CanDeactivateFn } from '@angular/router';

export interface PendingChangesAware {
  hasUnsavedChanges(): boolean;
  onNavigationAttempt?(): void;
}

export const pendingChangesGuard: CanDeactivateFn<PendingChangesAware> = (component) => {
  if (!component?.hasUnsavedChanges()) return true;
  component.onNavigationAttempt?.();
  return confirm('Unsaved changes detected. Your draft is auto-saved. Leave this page?');
};
