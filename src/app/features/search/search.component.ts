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
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from "@angular/router";
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
import { filter, finalize, Subscription } from "rxjs";
import { AuthService } from "src/app/shared/services/auth.service";

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
  readonly maxRows = 5;

  isLoading = false;

  /** DTO activo con filtros paginación y orden */
  sortOrder: "ASC" | "DESC" = "DESC";

  /** Datos auxiliares para chips */
  categoriesList: Category[] = [];
  countriesList: Country[] = [];
  selectedFilters: string[] = [];

  constructor(
    private router: Router,
    private listingSrv: ListingService,
    public categorySrv: CategoryService,
    private countrySrv: CountryService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 1) Lectura inicial + carga
    this.readStateAndLoad();

    // 2) Cada vez que haya un NavigationEnd (incluso a la misma URL),
    //    volvemos a leer el state y recargamos
    this.navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.readStateAndLoad());
  }

  ngOnDestroy(): void {
    this.navSub.unsubscribe();
  }

  private readStateAndLoad() {
    const st = window.history.state as {
      request?: Partial<ListListingsRequestDto>;
    };
    if (st.request) {
      this.request = st.request;
    }
    this.current = { ...this.request };
    this.initCategorySlots();
    this.loadListings();
    window.scrollTo(0, 0); // opcional
  }

  /** Aplico filtros desde el drawer */
  onApplyFilters(dto: Partial<ListListingsRequestDto>) {
    // 1) sincroniza categorías slots → current.categoryIds
    this.patchCategoriesToCurrent();

    // 2) construye el nuevo DTO
    this.current = {
      ...this.current,
      ...dto,
      countryId: dto.countryId ? Number(dto.countryId) : undefined,
      page: 1,
      sortOrder: this.sortOrder,
    };

    // 3) si filtro distancia, inyecta centerCountryId
    if (this.current.maxDistanceKm != null) {
      this.current.centerCountryId =
        this.authService.getCurrentCountryId() || undefined;
    } else {
      delete this.current.centerCountryId;
    }

    // 4) dispara búsqueda y cierra drawer
    this.loadListings();
    this.drawer?.close();
  }

  onClearFilters() {
    this.current = { page: 1, sortOrder: this.sortOrder };
    this.loadListings();
    this.drawer?.close();
  }

  setSort(order: "ASC" | "DESC") {
    if (this.sortOrder === order) return;
    this.sortOrder = order;
    this.current.sortOrder = order;
    this.loadListings();
  }

  /** Cambio de orden */
  onSortChange(order: "ASC" | "DESC") {
    this.sortOrder = order;
    this.current.sortOrder = order;
    this.loadListings();
  }

  /** Paginación */
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

  /** Carga datos y actualiza chips */
  private loadListings(): void {
    const pageSize =
      Math.min(this.maxRows, window.innerWidth < 600 ? 2 : 5) * 4;

    this.isLoading = true;
    this.cdr.markForCheck(); // ← marca aquí

    this.listingSrv
      .listListings({ ...this.current, pageSize })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck(); // ← y aquí
        })
      )
      .subscribe({
        next: (resp) => {
          this.products = resp.data!;
          this.hasMore = resp.data!.length === pageSize;
          this.page = this.current.page ?? 1;
          this.updateSelectedFilters();
          this.cdr.markForCheck(); // ← y también aquí
        },
        error: () => {
          // …
          this.cdr.markForCheck();
        },
      });
  }

  /** Genera el array de etiquetas de filtro */
  private updateSelectedFilters() {
    const f = this.current;
    const chips: string[] = [];

    if (f.searchTerm) chips.push(`"${f.searchTerm}"`);
    (f.categoryIds || []).forEach((id) => {
      const c = this.categoriesList.find((x) => x.id === id);
      if (c) chips.push(c.name);
    });
    if (f.conditionFilter) {
      chips.push(f.conditionFilter === 2 ? "Nuevo" : "Usado");
    }
    if (f.minPrice != null || f.maxPrice != null) {
      const min = f.minPrice != null ? `$${f.minPrice}` : "";
      const max = f.maxPrice != null ? `$${f.maxPrice}` : "";
      chips.push(max ? `${min} a ${max}` : min);
    }
    if (f.maxDistanceKm) {
      chips.push(`Menos de ${f.maxDistanceKm}km`);
    }
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

  categoriesSlots: CategorySelection[] = [];
  showCategoryList: boolean[] = [];

  private async initCategorySlots() {
    // Si viene prefiltrado, lo usamos
    const initial = this.current.categoryIds ?? [];
    this.categoriesSlots = initial.map((idPath) => {
      const c = this.categoriesList.find((x) => x.id === idPath);
      return { idPath, name: c?.name ?? "" };
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
    this.loadListings();
  }

  onCategorySelected(i: number, sel: CategorySelection) {
    // evita duplicados
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

  private patchCategoriesToCurrent() {
    this.current.categoryIds = this.categoriesSlots
      .filter((c) => c.idPath)
      .map((c) => c.idPath);
  }

  @HostListener("window:keydown.enter", ["$event"])
  onEnterKey(event: KeyboardEvent) {
    // Evita que cualquier formulario de dentro haga un submit nativo
    event.preventDefault();
    // Llama al mismo apply que si viniera del drawer
    this.onApplyFilters(this.current);
  }
}
