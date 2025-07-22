import { Component, Inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

/** Datos que recibe el snackbar */
export interface SnackData {
  message: string;
  status: 'success' | 'error';
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

  get icon(): string {
    return this.data.status === 'success' ? 'check_circle' : 'error_outline';
  }
}
