import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface AuthButton {
  label: string;
  type?: 'submit' | 'button';
  color?: 'primary' | 'accent' | 'basic';
  disabled?: boolean;
  loading?: boolean;
  action?: () => void;          // se usa sólo si type!=='submit'
  form?: string;                // opcional: id del form a enviar
}

export interface AuthLink {
  label: string;
  type?: 'primary' | 'secondary';
  action: () => void;
}

@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './auth-card.component.html',
  styleUrls: ['./auth-card.component.scss'],
})
export class AuthCardComponent {
  /* ---------- Inputs ---------- */
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() showBackButton = false;

  /** Ancho máximo del card (cualquier unidad CSS, ej. `'600px'`, `'70%'`). */
  @Input() maxWidth: string = '600px';

  @Input() buttons: AuthButton[] = [];
  @Input() links:   AuthLink[]   = [];

  /* ---------- Output ---------- */
  @Output() backClick = new EventEmitter<void>();

  /* Helpers */
  onBtnClick(btn: AuthButton) {
    // Remove focus from any active element to avoid double taps on mobile
    const active = document.activeElement as HTMLElement | null;
    if (active) {
      active.blur();
    }

    if (btn.action) btn.action();
  }
  onLinkClick(link: AuthLink) {
    link.action();
  }
}
