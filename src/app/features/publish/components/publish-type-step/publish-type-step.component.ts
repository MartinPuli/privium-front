import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

interface TypeCard {
  id: 'PRODUCTO' | 'VEHICULO' | 'INMUEBLE' | 'MUEBLE' | 'SERVICIO';
  name: string;
  icon: string;
}

@Component({
  selector: 'app-publish-type-step',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './publish-type-step.component.html',
  styleUrls: ['./publish-type-step.component.scss'],
})
export class PublishTypeStepComponent {
  @Output() continue = new EventEmitter<TypeCard['id']>();

  typeCards: TypeCard[] = [
    { id: 'PRODUCTO',  name: 'Productos',  icon: 'shopping_bag'   },
    { id: 'VEHICULO',  name: 'Vehículos',  icon: 'directions_car' },
    { id: 'INMUEBLE',  name: 'Inmuebles',  icon: 'home'           },
    { id: 'MUEBLE',    name: 'Muebles',    icon: 'chair'          },
    { id: 'SERVICIO',  name: 'Servicios',  icon: 'build'          },
  ];

  selectType(id: TypeCard['id']): void {
    this.continue.emit(id);              // pasa al siguiente paso
  }
}
