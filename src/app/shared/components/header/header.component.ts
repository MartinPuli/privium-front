import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatMenuModule } from "@angular/material/menu";
import { MatDividerModule } from "@angular/material/divider";
import { MatRadioModule } from "@angular/material/radio";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatListModule } from "@angular/material/list";

import { AuthService } from "../../services/auth.service";
import { CategoryService } from "../../services/category.service";
import { CountryService } from "../../services/country.service";
import { DefaultImageDirective } from '../../directives/default-image.directive';
import { User } from "../../models/user.model";
import { Category } from "../../models/category.model";
import { Country } from "../../models/country.model";
import { ListCategoriesComponent } from "../list-categories/list-categories.component";
import { SelectOption } from "../form-field/form-field.component";
import { MatSelectModule } from "@angular/material/select";
import { ListListingsRequestDto } from "../../models/listing.model";
import { FilterService } from "../../services/filter.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatDividerModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    ListCategoriesComponent,
    MatSelectModule,
    DefaultImageDirective,
  ],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  searchQuery = "";
  selectedCategoryLabel = "Todas";
  selectedCategoryId: string | null = null;
  categories: Category[] = [];
  showCategories = false;
  @ViewChild('catButton', { read: ElementRef })
  catButtonRef!: ElementRef<HTMLElement>;

  /** Controla la visibilidad del menú en pantallas pequeñas */
  isMobileMenuOpen = false;

  @Input() logged = true;
  @Input() publishing = false;

  sortOrder: "ASC" | "DESC" = "DESC";

  private readonly defaultFilters = {
    condition: "" as "" | "nuevo" | "usado",
    min: null as number | null,
    max: null as number | null,
    distance: null as number | null,
    countryId: null as number | null,
    pay: {
      efectivo: false,
      transferencia: false,
      tarjeta: false,
      trueque: false,
    } as Record<string, boolean>,
    from: null as Date | null,
    to: null as Date | null,
  };
  filters = { ...this.defaultFilters };

  get priceRangeValid(): boolean {
    const inRange = (val: number | null) =>
      val == null || (val >= 1 && val <= 99999999);
    const { min, max } = this.filters;
    const rangeValid = inRange(min) && inRange(max);
    const orderValid = min == null || max == null || min <= max;
    return rangeValid && orderValid;
  }

  mediosPago = [
    { value: "efectivo", label: "Efectivo" },
    { value: "transferencia", label: "Transferencia" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "trueque", label: "Trueque" },
  ];

  countryOptions: SelectOption[] = [];
  currentUser: User | null = null;
  currentUserCountryName = "";

  private filterSub?: Subscription;

  constructor(
    public authService: AuthService,
    private categorySrv: CategoryService,
    public countrySrv: CountryService,
    private router: Router,
    private filterSrv: FilterService
  ) {}

  ngOnInit(): void {
    // Load categories
    this.categories = this.categorySrv.getCached();
    // Load countries for novelasome filters or user location
    const countries = this.countrySrv.getCached();

    if (this.logged) {
      this.currentUser = this.authService.getCurrentUser();
      this.countryOptions = countries
        ? countries.map((c) => ({ value: c.id, label: c.name }))
        : [];

      this.currentUserCountryName = this.countrySrv.getNameById(
        this.currentUser!.countryId
      )!;
    }

    this.loadFiltersFromService();
    this.filterSub = this.filterSrv.filters$.subscribe(() =>
      this.loadFiltersFromService()
    );
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  private loadFiltersFromService() {
    const saved = this.filterSrv.value;
    this.searchQuery = saved.searchTerm ?? "";
    if (saved.categoryIds && saved.categoryIds.length) {
      const cat = this.categories.find((c) => c.id === saved.categoryIds![0]);
      if (cat) {
        this.selectedCategoryLabel = cat.name;
        this.selectedCategoryId = cat.id;
      }
    }

    this.filters = {
      ...this.defaultFilters,
      condition:
        saved.conditionFilter === 2
          ? "nuevo"
          : saved.conditionFilter === 1
          ? "usado"
          : "",
      min: saved.minPrice ?? null,
      max: saved.maxPrice ?? null,
      distance: saved.maxDistanceKm ?? null,
      countryId: saved.countryId ?? null,
      pay: {
        efectivo: !!saved.acceptsCash,
        transferencia: !!saved.acceptsTransfer,
        tarjeta: !!saved.acceptsCard,
        trueque: !!saved.acceptsBarter,
      },
      from: saved.createdFrom ? new Date(saved.createdFrom) : null,
      to: saved.createdTo ? new Date(saved.createdTo) : null,
    };
  }

  /** Cada vez que abras el menú, cargo filters guardados */
  onFilterMenuOpen() {
    this.loadFiltersFromService();
  }

  onSearch(): void {
    const term = this.searchQuery.trim();
    const params: any = {};

    this.filterSrv.clear();
    this.selectedCategoryLabel = "Todas";
    this.selectedCategoryId = null;

    if (term) {
      params.searchTerm = term;
      this.filterSrv.set({ searchTerm: term });
    }

    this.router.navigate(["/search"], { queryParams: params });
  }

  onCategoryButtonClick(): void {
    this.showCategories = !this.showCategories;
  }

  onCategorySelect(sel: { idPath: string; name: string }): void {
    this.selectedCategoryLabel = sel.name;
    this.selectedCategoryId = sel.idPath;
    this.showCategories = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (
      this.showCategories &&
      this.catButtonRef &&
      !this.catButtonRef.nativeElement.contains(target)
    ) {
      this.showCategories = false;
    }
  }

  applyFilters(): void {
    // 1) Inicializa el DTO con datos previos, página y orden
    const request: Partial<ListListingsRequestDto> & Record<string, any> = {
      ...this.filterSrv.value,
      page: 1,
      sortOrder: this.sortOrder,
    };

    // Asegura searchTerm y categoría actual
    if (this.searchQuery.trim()) request.searchTerm = this.searchQuery.trim();
    else delete request.searchTerm;

    if (this.selectedCategoryId) {
      request.categoryIds = [this.selectedCategoryId];
    }

    // 2) Condición
    if (this.filters.condition === "nuevo") request.conditionFilter = 2;
    else if (this.filters.condition === "usado") request.conditionFilter = 1;

    // 3) Precio
    if (this.filters.min != null) request.minPrice = this.filters.min;
    if (this.filters.max != null) request.maxPrice = this.filters.max;

    // 4) Distancia
    if (this.filters.distance != null)
      request.maxDistanceKm = this.filters.distance;

    // 5) País/Barrio
    if (this.filters.countryId != null)
      request.countryId = this.filters.countryId;

    // 6) Medios de pago
    type PayKey = keyof typeof this.filters.pay;
    const paymentKeyMap: Record<PayKey, keyof ListListingsRequestDto> = {
      efectivo: "acceptsCash",
      transferencia: "acceptsTransfer",
      tarjeta: "acceptsCard",
      trueque: "acceptsBarter",
    };

    (Object.entries(this.filters.pay) as [PayKey, boolean][]).forEach(
      ([method, enabled]) => {
        if (enabled) {
          const prop = paymentKeyMap[method];
          (request as any)[prop] = true;
        }
      }
    );

    // 7) Fechas
    if (this.filters.from)
      request.createdFrom = this.filters.from.toISOString();
    if (this.filters.to) request.createdTo = this.filters.to.toISOString();

    // 8) Navegar pasando el DTO en el navigation state
    this.filterSrv.set(request);
    this.router.navigate(["/search"], { state: { request } });
  }

  capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  logout(): void {
    this.authService.logout();
  }

  goToPublish(): void {
    this.router.navigate(["/publish"]);
  }

  /** Abre o cierra el menú móvil */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
