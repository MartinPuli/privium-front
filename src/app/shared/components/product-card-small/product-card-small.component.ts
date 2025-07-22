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

import { ListingResponseDto } from '../../models/listing.model';
import { AuthService } from '../../services/auth.service';
import { CountryService } from '../../services/country.service';
import { Country } from '../../models/country.model';

@Component({
  selector: 'app-product-card-small',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './product-card-small.component.html',
  styleUrls: ['./product-card-small.component.scss'],
})
export class ProductCardSmallComponent implements OnInit {
  @Input() product!: ListingResponseDto;
  @Output() delete = new EventEmitter<number>();

  isAdmin = false;
  private countries: Country[] = [];

  constructor(
    private auth: AuthService,
    private countrySrv: CountryService
  ) {}

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

  onDelete() {
    this.delete.emit(this.product.id);
  }
}
