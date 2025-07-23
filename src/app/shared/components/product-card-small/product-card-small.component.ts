import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { DefaultModalComponent, ModalButton } from '../default-modal/default-modal.component';
import { FormFieldComponent } from '../form-field/form-field.component';

import { ListingResponseDto } from '../../models/listing.model';
import { AuthService } from '../../services/auth.service';
import { CountryService } from '../../services/country.service';
import { Country } from '../../models/country.model';
import { ListingService } from '../../services/listing.service';
import { ResultSnackbarComponent } from '../result-snackbar/result.snackbar.component';
import { DefaultImageDirective } from '../../directives/default-image.directive';

@Component({
  selector: 'app-product-card-small',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    ReactiveFormsModule,
    DefaultModalComponent,
    FormFieldComponent,
    DefaultImageDirective,
  ],
  templateUrl: './product-card-small.component.html',
  styleUrls: ['./product-card-small.component.scss'],
})
export class ProductCardSmallComponent implements OnInit {
  @Input() product!: ListingResponseDto;
  @Output() delete = new EventEmitter<number>();

  isAdmin = false;
  private countries: Country[] = [];
  deleteForm: FormGroup;
  deleteOpen = false;

  constructor(
    private auth: AuthService,
    private countrySrv: CountryService,
    private fb: FormBuilder,
    private listingSrv: ListingService,
    private snackBar: MatSnackBar
  ) {
    this.deleteForm = this.fb.group({
      message: ['', Validators.required],
    });
  }

  ngOnInit() {
    // Detecto rol Admin (puedes adaptar al getter que uses)
    const u = this.auth.getCurrentUser();
    this.isAdmin = u?.role === 'ADMIN';

    // Cacheo países para traducir countryId→nombre
    this.countries = this.countrySrv.getCached();
  }

  findCountryName(id: number): string {
    return this.countries.find(c => c.id === id)?.name || '';
  }


  openDeleteModal() {
    this.deleteForm.reset();
    this.deleteOpen = true;
  }

  async sendDeleteMessage(): Promise<void> {
    if (this.deleteForm.invalid) return;
    try {
      await this.listingSrv.sendDeleteMessage({
        listingId: this.product.id,
        userId: this.product.userId,
        message: this.deleteForm.value.message,
      });

      this.snackBar.openFromComponent(ResultSnackbarComponent, {
        data: { message: 'Mensaje enviado', status: 'success' },
        duration: 4000,
        panelClass: 'success-snackbar',
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });

      this.delete.emit(this.product.id);
    } finally {
      this.deleteOpen = false;
    }
  }

  get deleteButtons(): ModalButton[] {
    return [
      { label: 'Cancelar', type: 'secondary', action: () => (this.deleteOpen = false) },
      {
        label: 'Enviar',
        type: 'primary',
        action: () => this.sendDeleteMessage(),
        disabled: this.deleteForm.invalid,
      },
    ];
  }
}
