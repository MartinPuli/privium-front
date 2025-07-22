import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-button-categories',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './button-categories.component.html',
  styleUrls: ['./button-categories.component.scss'],
})
export class ButtonCategoriesComponent {
  /** Nombre de la categoría actualmente seleccionada (null = ninguna) */
  @Input() categoryName: string | null = null;
  @Input() disabled: boolean = false;

  /** Emite cuando se debe abrir/cerrar el listado */
  @Output() toggle = new EventEmitter<void>();
  /** Emite cuando se quiere limpiar la selección */
  @Output() clear = new EventEmitter<void>();
}
