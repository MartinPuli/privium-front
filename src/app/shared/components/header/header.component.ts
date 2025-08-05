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
import { RouterModule, Router, NavigationEnd } from "@angular/router";
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
import { DefaultImageDirective } from "../../directives/default-image.directive";
import { User } from "../../models/user.model";
import { Category } from "../../models/category.model";
import { Country } from "../../models/country.model";
import { ListCategoriesComponent } from "../list-categories/list-categories.component";
import { SelectOption } from "../form-field/form-field.component";
import { MatSelectModule } from "@angular/material/select";
import { ListListingsRequestDto } from "../../models/listing.model";
import { FilterService } from "../../services/filter.service";
import { Subscription, filter } from "rxjs";

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
  @ViewChild("catButton", { read: ElementRef })
  catButtonRef!: ElementRef<HTMLElement>;
  @ViewChild("searchInput", { read: ElementRef })
  searchInputRef!: ElementRef<HTMLInputElement>;

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
  private routerSub?: Subscription;

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

    if (this.router.url === "/home") {
      this.filterSrv.clear();
      this.resetHeaderFilters();
    }

    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (e.urlAfterRedirects === "/home") {
          this.resetHeaderFilters();
          this.filterSrv.clear();
        }
      });
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  private resetHeaderFilters() {
    this.searchQuery = "";
    this.selectedCategoryLabel = "Todas";
    this.selectedCategoryId = null;
    this.filters = { ...this.defaultFilters };
  }

  onCategoryButtonClick(): void {
    this.showCategories = !this.showCategories;
  }

  onCategorySelect(sel: { idPath: string; name: string }): void {
    this.selectedCategoryLabel = sel.name;
    this.selectedCategoryId = sel.idPath;
    this.showCategories = false;
  }

  @HostListener("document:click", ["$event"])
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
    /* 0) Partimos de cero: solo cabecera ---------------------------- */
    const request: Partial<ListListingsRequestDto> = {
      page: 1,
      sortOrder: this.sortOrder,
    };

    /* 1) Término de búsqueda */
    const term = this.searchQuery.trim();
    if (term) request.searchTerm = term;

    /* 2) Categoría elegida en el selector de cabecera */
    console.log(this.selectedCategoryId);
    if (this.selectedCategoryId)
      request.categoryIds = [this.selectedCategoryId];

    /* 3) Condición (nuevo / usado) */
    if (this.filters.condition === "nuevo") request.conditionFilter = 2;
    else if (this.filters.condition === "usado") request.conditionFilter = 1;

    /* 4) Precio */
    if (this.filters.min != null) request.minPrice = this.filters.min;
    if (this.filters.max != null) request.maxPrice = this.filters.max;

    /* 5) Distancia */
    if (this.filters.distance != null)
      request.maxDistanceKm = this.filters.distance;

    /* 6) País / barrio */
    if (this.filters.countryId != null)
      request.countryId = this.filters.countryId;

    /* 7) Medios de pago */
    const paymentKeyMap: Record<string, keyof ListListingsRequestDto> = {
      efectivo: "acceptsCash",
      transferencia: "acceptsTransfer",
      tarjeta: "acceptsCard",
      trueque: "acceptsBarter",
    };
    Object.entries(this.filters.pay).forEach(([method, enabled]) => {
      if (enabled) request[paymentKeyMap[method]] = true as any;
    });

    /* 8) Fechas */
    if (this.filters.from)
      request.createdFrom = this.filters.from.toISOString();
    if (this.filters.to) request.createdTo = this.filters.to.toISOString();

    /* 9) Guardar como nuevos filtros (borramos los anteriores) ------ */
    this.filterSrv.clear();
    this.filterSrv.set(request);

    /* 10) Navegar / refrescar --------------------------------------- */
    if (this.router.url.startsWith("/search")) {
      this.router.navigate([], { state: { request } });
    } else {
      this.router.navigate(["/search"], { state: { request } });
    }

    /* 11) Limpiar controles visibles del header --------------------- */
    this.resetHeaderFilters();
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
