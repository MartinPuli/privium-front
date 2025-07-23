import { Component, Inject, HostBinding } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

/** Datos que recibe el snackbar */
export interface SnackData {
  message: string;
  status: 'success' | 'error' | 'info';
  /** Optional custom background color */
  backgroundColor?: string;
}

@Component({
  selector: 'app-result-snackbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './result-snackbar.component.html',
  styleUrls: ['./result-snackbar.component.scss'],
})
export class ResultSnackbarComponent {
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: SnackData) {}

  /** Background color binding for the snackbar container */
  @HostBinding('style.backgroundColor')
  get background(): string {
    return this.data.backgroundColor ?? this.statusColor;
  }

  private get statusColor(): string {
    switch (this.data.status) {
      case 'success':
        return '#2e7d32';
      case 'error':
        return '#d32f2f';
      case 'info':
      default:
        return '#1976d2';
    }
  }

  get icon(): string {
    switch (this.data.status) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error_outline';
      case 'info':
      default:
        return 'info';
    }
  }
}
