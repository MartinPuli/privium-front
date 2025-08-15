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
import { MatButtonModule } from "@angular/material/button";

import { CountryService } from "../../../shared/services/country.service";
import { ListListingsRequestDto } from "../../../shared/models/listing.model";
import {
  SelectOption,
  FormFieldComponent,
} from "../../../shared/components/form-field/form-field.component";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "app-search-filters",
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, MatButtonModule, FormFieldComponent],
  templateUrl: "./search-filters.component.html",
  styleUrls: ["./search-filters.component.scss"],
})
export class SearchFiltersComponent implements OnInit, OnChanges {
  @Input() initialFilters: Partial<ListListingsRequestDto> = {};
  @Output() apply = new EventEmitter<Partial<ListListingsRequestDto>>();
  @Output() clear = new EventEmitter<void>();

  form!: FormGroup;

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

  constructor(
    private readonly fb: FormBuilder,
    private readonly countrySrv: CountryService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadCountries();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["initialFilters"] && !changes["initialFilters"].firstChange) {
      this.form.patchValue({
        ...this.initialFilters,
        createdFrom: this.toInputDate(this.initialFilters.createdFrom),
        createdTo: this.toInputDate(this.initialFilters.createdTo),
      });
    }
  }

  private buildForm(): void {
    this.form = this.fb.group(
      {
        searchTerm: [this.initialFilters.searchTerm ?? "", [Validators.maxLength(30)]],
        type: [this.initialFilters.type ?? ""],
        countryId: [this.initialFilters.countryId ?? null],
        brandFilter: [this.initialFilters.brandFilter ?? ""],
        conditionFilter: [this.initialFilters.conditionFilter ?? null],
        minPrice: [
          this.initialFilters.minPrice ?? null,
          [Validators.min(1), Validators.pattern(/^\d+$/), Validators.max(99_999_999)],
        ],
        maxPrice: [
          this.initialFilters.maxPrice ?? null,
          [Validators.min(1), Validators.pattern(/^\d+$/), Validators.max(99_999_999)],
        ],
        maxDistanceKm: [this.initialFilters.maxDistanceKm ?? null],
        createdFrom: [this.toInputDate(this.initialFilters.createdFrom), this.dateValidator],
        createdTo: [this.toInputDate(this.initialFilters.createdTo), this.dateValidator],
        acceptsCash: [this.initialFilters.acceptsCash ?? false],
        acceptsCard: [this.initialFilters.acceptsCard ?? false],
        acceptsTransfer: [this.initialFilters.acceptsTransfer ?? false],
        acceptsBarter: [this.initialFilters.acceptsBarter ?? false],
      },
      {
        validators: [
          SearchFiltersComponent.priceRangeValidator,
          SearchFiltersComponent.dateRangeValidator,
        ],
      }
    );
  }

  private loadCountries(): void {
    const cached = this.countrySrv.getCached();
    if (cached) {
      this.countryOptions = cached.map((c) => ({ value: c.id, label: c.name }));
    } else {
      this.countrySrv.loadCountries().subscribe((cats) => {
        this.countryOptions = cats.map((c) => ({ value: c.id, label: c.name }));
      });
    }
  }

  private dateValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? { invalidDate: true } : null;
  }

  private static priceRangeValidator(group: FormGroup): ValidationErrors | null {
    const min = group.get("minPrice")?.value;
    const max = group.get("maxPrice")?.value;
    if (min != null && max != null && Number(min) > Number(max)) {
      return { priceRange: true };
    }
    return null;
  }

  private static dateRangeValidator(group: FormGroup): ValidationErrors | null {
    const from = group.get("createdFrom")?.value;
    const to = group.get("createdTo")?.value;
    if (!from || !to) return null;
    const d1 = new Date(from);
    const d2 = new Date(to);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
    return d1 > d2 ? { dateRange: true } : null;
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

  emitFilters(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const trimOrUndef = (v?: string | null) =>
      (v ?? "").toString().trim() === "" ? undefined : (v as string).trim();

    const dto: Partial<ListListingsRequestDto> = {
      ...raw,
      searchTerm: trimOrUndef(raw.searchTerm),
      brandFilter: trimOrUndef(raw.brandFilter),
      conditionFilter: raw.conditionFilter != null ? Number(raw.conditionFilter) : undefined,
      maxDistanceKm: raw.maxDistanceKm != null ? Number(raw.maxDistanceKm) : undefined,
      minPrice: raw.minPrice != null ? Number(raw.minPrice) : undefined,
      maxPrice: raw.maxPrice != null ? Number(raw.maxPrice) : undefined,
      createdFrom: this.toIsoDate(raw.createdFrom),
      createdTo: this.toIsoDate(raw.createdTo),
    };

    this.apply.emit(dto);
  }

  reset(): void {
    this.form.reset();
    this.clear.emit();
  }
}
