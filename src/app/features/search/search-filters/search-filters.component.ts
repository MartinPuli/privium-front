import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioModule } from "@angular/material/radio";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDividerModule } from "@angular/material/divider";

import { CountryService } from "../../../shared/services/country.service";
import { ListListingsRequestDto } from "../../../shared/models/listing.model";
import {
  SelectOption,
  FormFieldComponent,
} from "../../../shared/components/form-field/form-field.component";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-search-filters",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatButtonModule,
    FormFieldComponent,
  ],
  templateUrl: "./search-filters.component.html",
  styleUrls: ["./search-filters.component.scss"],
})
export class SearchFiltersComponent implements OnInit {
  @Input() initialFilters: Partial<ListListingsRequestDto> = {};
  @Output() apply = new EventEmitter<Partial<ListListingsRequestDto>>();
  @Output() clear = new EventEmitter<void>();

  form!: FormGroup;

  // Opciones
  typesOptions: SelectOption[] = [
    { value: "PRODUCTO", label: "Producto" },
    { value: "SERVICIO", label: "Servicio" },
    { value: "INMUEBLE", label: "Inmueble" },
    { value: "VEHICULO", label: "Vehículo" },
    { value: "MUEBLE", label: "Mueble" },
  ];

  conditionOptions: SelectOption[] = [
    { value: 2, label: "Nuevo" },
    { value: 1, label: "Usado" },
  ];

  distanceOptions: SelectOption[] = [
    { value: 10, label: "Menos de 10 km" },
    { value: 15, label: "Menos de 15 km" },
    { value: 30, label: "Menos de 30 km" },
    { value: 60, label: "Menos de 60 km" },
  ];

  countryOptions: SelectOption[] = [];

  constructor(private fb: FormBuilder, private countrySrv: CountryService) {}

  private dateValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? { invalidDate: true } : null;
  }

  private toInputDate(value?: string | null): string | null {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
  }

  private toIsoDate(value?: string | null): string | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  ngOnInit() {
    this.buildForm();
    this.loadCountries();
  }

  private buildForm() {
    this.form = this.fb.group({
      searchTerm: [this.initialFilters.searchTerm ?? ""],
      type: [this.initialFilters.type ?? ""],
      countryId: [this.initialFilters.countryId ?? null],
      brandFilter: [this.initialFilters.brandFilter ?? ""],
      conditionFilter: [this.initialFilters.conditionFilter ?? null],
      minPrice: [
        this.initialFilters.minPrice ?? null,
        [Validators.min(1), Validators.pattern(/^\d+$/), Validators.max(99999999)],
      ],
      maxPrice: [
        this.initialFilters.maxPrice ?? null,
        [Validators.min(1), Validators.pattern(/^\d+$/), Validators.max(99999999)],
      ],
      maxDistanceKm: [this.initialFilters.maxDistanceKm ?? null],
      createdFrom: [
        this.toInputDate(this.initialFilters.createdFrom),
        this.dateValidator,
      ],
      createdTo: [
        this.toInputDate(this.initialFilters.createdTo),
        this.dateValidator,
      ],
      acceptsCash: [this.initialFilters.acceptsCash ?? false],
      acceptsCard: [this.initialFilters.acceptsCard ?? false],
      acceptsTransfer: [this.initialFilters.acceptsTransfer ?? false],
      acceptsBarter: [this.initialFilters.acceptsBarter ?? false],
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialFilters'] && !changes['initialFilters'].firstChange) {
      // parcho TODOS los controles que queira actualizar
      this.form.patchValue({
        ...this.initialFilters,
        createdFrom: this.toInputDate(this.initialFilters.createdFrom),
        createdTo: this.toInputDate(this.initialFilters.createdTo),
      });
    }
  }

  private loadCountries() {
    const cached = this.countrySrv.getCached();
    console.log(cached)
    if (cached) {
      this.countryOptions = cached.map((c) => ({ value: c.id, label: c.name }));
      console.log("a")
    } else {
      this.countrySrv.loadCountries().subscribe((cats) => {
        this.countryOptions = cats.map((c) => ({ value: c.id, label: c.name }));
      });
    }
  }

  /** Emite solo cuando tocan el botón “Filtrar” o presionan Enter */
  emitFilters() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    // raw.conditionFilter === "2" raw.maxDistanceKm === "30"

    const dto: Partial<ListListingsRequestDto> = {
      ...raw,
      conditionFilter:
        raw.conditionFilter != null ? Number(raw.conditionFilter) : undefined,
      maxDistanceKm:
        raw.maxDistanceKm != null ? Number(raw.maxDistanceKm) : undefined,
      minPrice: raw.minPrice != null ? Number(raw.minPrice) : undefined,
      maxPrice: raw.maxPrice != null ? Number(raw.maxPrice) : undefined,
      createdFrom: this.toIsoDate(raw.createdFrom),
      createdTo: this.toIsoDate(raw.createdTo),
    };

    this.apply.emit(dto);
  }

  reset() {
    this.form.reset();
    this.clear.emit();
  }
}
