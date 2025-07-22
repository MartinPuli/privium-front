import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Componente de resultado (éxito / error) reutilizable.
 *
 * - status: 1 = éxito, 0 = error
 * - title, subtitle, description: textos a mostrar
 * - buttonLabel: texto del botón
 * - (action) : se emite al hacer clic en el botón
 */
@Component({
  selector: 'app-result-warn',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './result-warn.component.html',
  styleUrls: ['./result-warn.component.scss'],
})
export class ResultWarnComponent {
  /** 1 = éxito, 0 = error */
  @Input() status: 0 | 1 = 1;

  @Input() title = '';
  @Input() subtitle = '';
  @Input() description = '';
  @Input() buttonLabel = 'Continuar';

  /** Se emite cuando el usuario pulsa el botón principal */
  @Output() action = new EventEmitter<void>();

  /** Icono según el estado */
  get icon(): string {
    return this.status === 1 ? 'check' : 'error';
  }

  /** Clase CSS para colorizar icono / borde */
  get statusClass(): string {
    return this.status === 1 ? 'success' : 'error';
  }
}
