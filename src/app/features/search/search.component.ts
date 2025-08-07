import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef,
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
import { filter, finalize, firstValueFrom, Subscription } from "rxjs";
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
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {
  private navSub!: Subscription;

  /* ---------- Template refs ---------- */
  @ViewChild("drawer") drawer: any;
  @ViewChild("mobileFilters") mobileFilters?: SearchFiltersComponent;
  @ViewChild("desktopFilters") desktopFilters?: SearchFiltersComponent;

  @Input() request: Partial<ListListingsRequestDto> = {};
  current: Partial<ListListingsRequestDto> = {};

  /** Caché completa de resultados recibidos (máx 100) */
  private cache: ListingResponseDto[] = [];
  /** Slice mostrado en la grilla */
  products: ListingResponseDto[] = [];

  /** Paginación local */
  page = 1;
  pageSize = 0;
  totalPages = 1;

  /** UI flags */
  isLoading = false;

  readonly rowsPerPage = 5;
  readonly MAX_RESULTS = 100;

  /** Orden */
  sortOrder: "ASC" | "DESC" = "DESC";

  /** Datos auxiliares para chips */
  categoriesList: Category[] = [];
  countriesList: Country[] = [];
  selectedFilters: string[] = [];

  /** Historial para UX */
  usedCategoryIdsHistory: string[][] = [];

  /* ================= DI ================= */
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private listingSrv: ListingService,
    public categorySrv: CategoryService,
    private countrySrv: CountryService,
    private cdr: ChangeDetectorRef,
    private authSrv: AuthService,
    private filterSrv: FilterService
  ) {}

  /* ================================================================
   *  LIFECYCLE
   * ================================================================*/
  async ngOnInit(): Promise<void> {
    this.categoriesList = this.categorySrv.getCached();
    this.countriesList = this.countrySrv.getCached();

    /* ─── tamaño de página inicial ─── */
    this.pageSize = this.calculatePageSize();

    /* ─── primera carga ─── */
    this.readStateAndLoad();

    /* ─── NavigationEnd recarga ─── */
    this.navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.readStateAndLoad());

    this.recalcPages();
  }

  ngAfterViewInit(): void {
    /* (nada especial) */
  }

  ngOnDestroy(): void {
    this.navSub.unsubscribe();
  }

  /* ================================================================
   *  ANCHO PANTALLA → RECÁLCULO LOCAL
   * ================================================================*/
  @HostListener("window:resize")
  onResize(): void {
    const newSize = this.calculatePageSize();
    if (newSize === this.pageSize) return;

    this.pageSize = newSize;
    /* opcional: mantener página actual si entra en límites */
    const totalPages = Math.max(
      1,
      Math.ceil(this.cache.length / this.pageSize)
    );
    if (this.page > totalPages) this.page = totalPages;

    this.materializePage(); // solo re-slice local
    this.recalcPages();
  }

  private calculatePageSize(): number {
    const width =
      window.innerWidth > 900
        ? window.innerWidth * 0.985 - 48 - 360 // 48 = padding, 360 = sidebar
        : window.innerWidth * 0.985;

    let columns = Math.max(1, Math.floor(width / 260));
    if (width <= 600) columns = 2; // móvil

    const size = columns * this.rowsPerPage;
    return Math.min(size, this.MAX_RESULTS);
  }

  /* ================================================================
   *  ESTADO INICIAL DESDE QUERY / STATE
   * ================================================================*/
  private readStateAndLoad(): void {
    const st = window.history.state as {
      request?: Partial<ListListingsRequestDto>;
    };

    const base = { ...this.filterSrv.value };
    let req: Partial<ListListingsRequestDto>;

    if (st?.request) {
      req = { ...base, ...st.request };
    } else {
      const qp = this.route.snapshot.queryParamMap;
      req = { ...base };
      const term = qp.get("searchTerm");
      if (term) req.searchTerm = term;
      const catIds = qp.getAll("categoryIds");
      if (catIds.length) req.categoryIds = catIds;
    }

    this.current = { ...req, page: 1, sortOrder: this.sortOrder };
    this.filterSrv.set(this.current);
    this.initCategorySlots();
    this.loadListings();
    window.scrollTo(0, 0);
  }

  /* ================================================================
   *  FILTROS — drawer / sidebar
   * ================================================================*/
  onApplyFilters(dto: Partial<ListListingsRequestDto>): void {
    this.current = {
      ...this.current,
      ...dto,
      countryId: dto.countryId ? Number(dto.countryId) : undefined,
      page: 1,
      sortOrder: this.sortOrder,
    };

    /* distancia */
    if (this.current.maxDistanceKm != null) {
      this.current.centerCountryId =
        this.authSrv.getCurrentCountryId() || undefined;
    } else {
      delete this.current.centerCountryId;
    }

    this.filterSrv.set(this.current);
    this.loadListings();
    this.drawer?.close();
  }

  onClearFilters(): void {
    this.current = { page: 1, sortOrder: this.sortOrder };
    this.filterSrv.clear();
    this.initCategorySlots();
    this.drawer?.close();
  }

  openFilters(): void {
    this.drawer?.open();
  }

  applyFilters(): void {
    if (this.drawer?.opened) {
      this.mobileFilters?.emitFilters();
    } else {
      this.desktopFilters?.emitFilters();
    }
  }

  /* ================================================================
   *  ORDEN LOCAL (ya tenés 100 en memoria)
   * ================================================================*/
  setSort(order: "ASC" | "DESC"): void {
    if (this.sortOrder === order) return;
    this.sortOrder = order;
    this.current.sortOrder = order;
    this.sortProductsInMemory(order);
  }

  private sortProductsInMemory(order: "ASC" | "DESC"): void {
    if (!this.cache.length) return;

    const time = (p: ListingResponseDto) =>
      p.createdAt ? new Date(p.createdAt).getTime() : 0;

    this.cache.sort((a, b) =>
      order === "ASC" ? time(a) - time(b) : time(b) - time(a)
    );
    this.materializePage();
  }

  /* ================================================================
   *  PAGINACIÓN LOCAL
   * ================================================================*/
  next(): void {
    const totalPages = Math.ceil(this.cache.length / this.pageSize);
    if (this.page >= totalPages) return;
    this.page++;
    this.materializePage();
    this.recalcPages();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  prev(): void {
    if (this.page <= 1) return;
    this.page--;
    this.materializePage();
    this.recalcPages();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  private recalcPages(): void {
    this.totalPages = Math.max(1, Math.ceil(this.cache.length / this.pageSize));
  }

  /* ================================================================
   *  LOAD LISTINGS (always 100)
   * ================================================================*/
  private loadListings(): void {
    /* sincronizar categorías justo antes */
    this.patchCategoriesToCurrent(false);

    this.isLoading = true;
    this.cdr.markForCheck();

    const dto = { ...this.current, pageSize: this.MAX_RESULTS }; // siempre 100

    this.listingSrv
      .listListings(dto)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (resp) => {
          this.cache = resp.data ?? [];
          this.page = this.current.page ?? 1;
          this.materializePage();
          this.recalcPages();
          this.updateSelectedFilters();
        },
        error: () => {
          this.cache = [];
          this.products = [];
          this.cdr.markForCheck();
        },
      });
  }

  /** recorta cache según página y pageSize */
  private materializePage(): void {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.products = this.cache.slice(start, end);
    this.cdr.markForCheck();
  }

  /* ================================================================
   *  CHIPS
   * ================================================================*/
  private updateSelectedFilters(): void {
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

    (
      [
        ["acceptsCash", "Efectivo"],
        ["acceptsCard", "Tarjeta"],
        ["acceptsTransfer", "Transferencia"],
        ["acceptsBarter", "Trueque"],
      ] as Array<[keyof ListListingsRequestDto, string]>
    ).forEach(([k, lbl]) => {
      if (f[k]) chips.push(lbl);
    });

    this.selectedFilters = chips;
  }

  /* ================================================================
   *  CATEGORÍAS (slots)
   * ================================================================*/
  categoriesSlots: CategorySelection[] = [];
  showCategoryList: boolean[] = [];

  private async initCategorySlots(): Promise<void> {
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

  toggleCategoryList(i: number): void {
    this.showCategoryList[i] = !this.showCategoryList[i];
  }

  clearCategory(i: number): void {
    this.categoriesSlots.splice(i, 1);
    this.showCategoryList.splice(i, 1);
    this.categoriesSlots = this.categoriesSlots.filter((c) => c.idPath);

    if (this.categoriesSlots.length < 10) {
      this.categoriesSlots.push({ idPath: "", name: "" });
      this.showCategoryList.push(false);
    }
    this.patchCategoriesToCurrent();
  }

  onCategorySelected(i: number, sel: CategorySelection): void {
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

  private patchCategoriesToCurrent(pushStore = true): void {
    const ids = this.categoriesSlots
      .filter((c) => !!c.idPath)
      .map((c) => c.idPath);

    this.current.categoryIds = ids.length ? ids : undefined;

    if (pushStore) this.filterSrv.setCategoryIds(this.current.categoryIds);

    this.updateSelectedFilters();
    this.cdr.markForCheck();
  }

  /* ================================================================
   *  ENTER refresca
   * ================================================================*/
  @HostListener("window:keydown.enter", ["$event"])
  onEnter(ev: KeyboardEvent): void {
    const t = ev.target as HTMLElement;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    this.page = 1;
    this.current.page = 1;
    this.sortOrder = this.current.sortOrder ?? "DESC";
    this.loadListings();
  }

  /* ================================================================
   *  TRACK BY
   * ================================================================*/
  trackById(_: number, p: ListingResponseDto): string | number {
    return p.id;
  }
}
