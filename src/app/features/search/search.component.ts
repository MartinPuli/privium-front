import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatChipsModule } from "@angular/material/chips";
import { MatButtonToggleModule } from "@angular/material/button-toggle";

import {
  ListListingsRequestDto,
  ListingResponseDto,
} from "../../shared/models/listing.model";
import { ListingService } from "../../shared/services/listing.service";
import { CategoryService } from "../../shared/services/category.service";
import { CountryService } from "../../shared/services/country.service";
import { Category } from "../../shared/models/category.model";
import { Country } from "../../shared/models/country.model";

import { ProductCardSmallComponent } from "../../shared/components/product-card-small/product-card-small.component";
import { HeaderComponent } from "../../shared/components/header/header.component";
import { FooterComponent } from "../../shared/components/footer/footer.component";
import { SearchFiltersComponent } from "./search-filters/search-filters.component";
import { ButtonCategoriesComponent } from "src/app/shared/components/button-categories/button-categories.component";
import { ListCategoriesComponent } from "src/app/shared/components/list-categories/list-categories.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { filter, finalize, Subscription, firstValueFrom } from "rxjs";
import { AuthService } from "src/app/shared/services/auth.service";
import { FilterService } from "src/app/shared/services/filter.service";

interface CategorySelection {
  idPath: string;
  name: string;
}

@Component({
  selector: "app-search",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatSidenavModule,
    HeaderComponent,
    FooterComponent,
    ProductCardSmallComponent,
    SearchFiltersComponent,
    ButtonCategoriesComponent,
    ListCategoriesComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"],
})
export class SearchComponent implements OnInit {
  private navSub!: Subscription;

  @ViewChild("drawer") drawer: any;
  @Input() request: Partial<ListListingsRequestDto> = {};
  current: Partial<ListListingsRequestDto> = {};

  products: ListingResponseDto[] = [];
  page = 1;
  hasMore = false;

  isLoading = false;

  /** Orden */
  sortOrder: "ASC" | "DESC" = "DESC";

  /** Datos auxiliares para chips */
  categoriesList: Category[] = [];
  countriesList: Country[] = [];
  selectedFilters: string[] = [];

  usedCategoryIdsHistory: string[][] = []; // historial de búsquedas

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private listingSrv: ListingService,
    public categorySrv: CategoryService,
    private countrySrv: CountryService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private filterSrv: FilterService
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.categorySrv.getCached().length) {
      await firstValueFrom(this.categorySrv.loadCategories());
    }
    this.categoriesList = this.categorySrv.getCached();
    this.countriesList = await firstValueFrom(this.countrySrv.loadCountries());

    // 1) primera carga
    this.readStateAndLoad();

    // 2) recargar ante NavigationEnd (incluido mismo path)
    this.navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.readStateAndLoad());
  }

  ngOnDestroy(): void {
    this.navSub.unsubscribe();
  }

  /** ----------------------------------------
   *  Estado inicial: query-params o state
   * --------------------------------------- */
  private readStateAndLoad() {
    const st = window.history.state as {
      request?: Partial<ListListingsRequestDto>;
    };

    const base = { ...this.filterSrv.value };
    let req: Partial<ListListingsRequestDto>;

    if (st.request) {
      req = { ...base, ...st.request };
    } else {
      const qp = this.route.snapshot.queryParamMap;
      req = { ...base };
      const term = qp.get("searchTerm");
      if (term) req.searchTerm = term;
      const catIds = qp.getAll("categoryIds");
      if (catIds.length) req.categoryIds = catIds;
    }

    this.current = { ...req };
    this.filterSrv.set(this.current);
    this.initCategorySlots();
    this.loadListings();
    window.scrollTo(0, 0);
  }

  /* ======== filtros desde el drawer ======== */
  onApplyFilters(dto: Partial<ListListingsRequestDto>) {
    this.current = {
      ...this.current,
      ...dto,
      countryId: dto.countryId ? Number(dto.countryId) : undefined,
      page: 1,
      sortOrder: this.sortOrder,
    };

    // centerCountryId ▶ solo si hay filtro de distancia
    if (this.current.maxDistanceKm != null) {
      this.current.centerCountryId =
        this.authService.getCurrentCountryId() || undefined;
    } else {
      delete this.current.centerCountryId;
    }

    this.loadListings();
    this.drawer?.close();
  }

  onClearFilters() {
    this.current = { page: 1, sortOrder: this.sortOrder };
    this.filterSrv.clear();
    this.initCategorySlots();
    this.drawer?.close();
  }

  openFilters() {
    this.drawer?.open();
  }

  /* ========== orden ========== */
  setSort(order: "ASC" | "DESC") {
    if (this.sortOrder === order) return;
    this.sortOrder = order;
    this.current.sortOrder = order;
    this.sortProductsInMemory(order);
  }

  onSortChange(order: "ASC" | "DESC") {
    this.sortOrder = order;
    this.current.sortOrder = order;
    this.sortProductsInMemory(order);
  }

  private sortProductsInMemory(order: "ASC" | "DESC"): void {
    if (!this.products.length) return;
    this.products.sort((a, b) =>
      order === "ASC"
        ? (a.price || 0) - (b.price || 0)
        : (b.price || 0) - (a.price || 0)
    );
    this.cdr.markForCheck();
  }

  /* ========== paginación ========== */
  async next() {
    if (!this.hasMore) return;
    this.current.page = (this.current.page ?? 1) + 1;
    await this.loadListings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async prev() {
    if ((this.current.page ?? 1) <= 1) return;
    this.current.page!--;
    await this.loadListings();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ========== carga listings ========== */
  private loadListings(): void {
    // Sincronizar categorías justo antes de llamar al backend
    this.patchCategoriesToCurrent(false);

    // guardar historial de categorías
    if (this.current.categoryIds?.length) {
      this.usedCategoryIdsHistory.push([...this.current.categoryIds]);
    }

    this.isLoading = true;
    this.cdr.markForCheck();

    this.listingSrv
      .listListings({ ...this.current, pageSize: 100 })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (resp) => {
          this.products = resp.data!;
          this.hasMore = resp.data!.length === 100;
          this.page = this.current.page ?? 1;
          this.updateSelectedFilters();
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        },
      });
  }

  /* ========== chips de filtros ========== */
  private updateSelectedFilters() {
    const f = this.current;
    const chips: string[] = [];

    if (f.searchTerm) chips.push(`"${f.searchTerm}"`);
    (f.categoryIds || []).forEach((id) => {
      const c = this.categoriesList.find((x) => x.id === id);
      if (c) chips.push(c.name);
    });
    if (f.conditionFilter)
      chips.push(f.conditionFilter === 2 ? "Nuevo" : "Usado");
    if (f.minPrice != null || f.maxPrice != null) {
      const min = f.minPrice != null ? `$${f.minPrice}` : "";
      const max = f.maxPrice != null ? `$${f.maxPrice}` : "";
      chips.push(max ? `${min} a ${max}` : min);
    }
    if (f.maxDistanceKm) chips.push(`Menos de ${f.maxDistanceKm}km`);
    if (f.type) chips.push(f.type);
    if (f.countryId) {
      const ct = this.countriesList.find((x) => x.id === f.countryId);
      if (ct) chips.push(ct.name);
    }
    if (f.brandFilter) chips.push(f.brandFilter);

    const pays: Array<[keyof ListListingsRequestDto, string]> = [
      ["acceptsCash", "Efectivo"],
      ["acceptsCard", "Tarjeta"],
      ["acceptsTransfer", "Transferencia"],
      ["acceptsBarter", "Trueque"],
    ];
    pays.forEach(([k, label]) => {
      if (f[k]) chips.push(label);
    });

    this.selectedFilters = chips;
  }

  trackById(_: number, p: ListingResponseDto) {
    return p.id;
  }

  /* ========== categorías (slots + dropdowns) ========== */
  categoriesSlots: CategorySelection[] = [];
  showCategoryList: boolean[] = [];

  private async initCategorySlots() {
    const initial = this.current.categoryIds ?? [];
    this.categoriesSlots = initial.map((id) => {
      const c = this.categoriesList.find((x) => x.id === id);
      return { idPath: id, name: c?.name ?? "" };
    });
    if (this.categoriesSlots.length < 10) {
      this.categoriesSlots.push({ idPath: "", name: "" });
    }
    this.showCategoryList = this.categoriesSlots.map(() => false);
  }

  toggleCategoryList(i: number) {
    this.showCategoryList[i] = !this.showCategoryList[i];
  }

  clearCategory(i: number) {
    this.categoriesSlots.splice(i, 1);
    this.showCategoryList.splice(i, 1);
    this.categoriesSlots = this.categoriesSlots.filter((c) => c.idPath);

    if (this.categoriesSlots.length < 10) {
      this.categoriesSlots.push({ idPath: "", name: "" });
      this.showCategoryList.push(false);
    }
    this.patchCategoriesToCurrent();
  }

  onCategorySelected(i: number, sel: CategorySelection) {
    // evitar duplicados
    const dup = this.categoriesSlots.some(
      (c, idx) => idx !== i && c.idPath === sel.idPath
    );
    if (dup) {
      this.categoriesSlots[i] = { idPath: "", name: "" };
      this.showCategoryList[i] = false;
      return;
    }

    this.categoriesSlots[i] = sel;
    this.showCategoryList[i] = false;

    if (
      i === this.categoriesSlots.length - 1 &&
      this.categoriesSlots.length < 10 &&
      sel.idPath
    ) {
      this.categoriesSlots.push({ idPath: "", name: "" });
      this.showCategoryList.push(false);
    }

    this.patchCategoriesToCurrent();
  }

  /** Copia las categorías elegidas a `this.current` y guarda la cantidad en navSub */
  private patchCategoriesToCurrent(pushToStore = true): void {
    const ids = this.categoriesSlots
      .filter((c) => !!c.idPath)
      .map((c) => c.idPath);

    this.current.categoryIds = ids.length ? ids : undefined;

    /* ▶ guardar en el servicio de filtros */
    if (pushToStore) {
      this.filterSrv.setCategoryIds(this.current.categoryIds);
    }

    this.updateSelectedFilters();
    this.cdr.markForCheck();
  }

  @HostListener("window:keydown.enter", ["$event"])
  onEnter(event: KeyboardEvent): void {
    /* 1) Ignorar si el usuario está escribiendo en un input o textarea */
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
    ) {
      return;
    }

    /* 2) Refrescar la búsqueda con los filtros que ya están cargados */
    this.current.page = 1; // siempre desde la primera página
    this.loadListings(); // ya sincroniza categorías, etc.
  }
}
