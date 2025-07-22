import { Component, Input, OnInit } from "@angular/core";
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
import { User } from "../../models/user.model";
import { Category } from "../../models/category.model";
import { Country } from "../../models/country.model";
import { ListCategoriesComponent } from "../list-categories/list-categories.component";
import { SelectOption } from "../form-field/form-field.component";
import { MatSelectModule } from "@angular/material/select";
import { ListListingsRequestDto } from "../../models/listing.model";
import { number } from "zod";

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
  ],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit {
  searchQuery = "";
  selectedCategoryLabel = "Todas";
  categories: Category[] = [];

  @Input() logged = true;
  @Input() publishing = false;

  sortOrder: "ASC" | "DESC" = "DESC";

  private readonly defaultFilters = {
    condition: "" as "" | "nuevo" | "usado",
    min: null as number | null,
    max: null as number | null,
    distance: null as number | null,
    countryId: null as number | null,
    pay: {} as Record<string, boolean>,
    from: null as Date | null,
    to: null as Date | null,
  };
  filters = { ...this.defaultFilters };

  mediosPago = [
    { value: "efectivo", label: "Efectivo" },
    { value: "transferencia", label: "Transferencia" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "trueque", label: "Trueque" },
  ];

  countryOptions: SelectOption[] = [];
  currentUser: User | null = null;
  currentUserCountryName = "";

  constructor(
    public authService: AuthService,
    private categorySrv: CategoryService,
    public countrySrv: CountryService,
    private router: Router
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
  }
  /** Cada vez que abras el menú, reinicio filters */
  onFilterMenuOpen() {
    // clon profundo para no compartir referencias (especialmente filters.pay)
    this.filters = JSON.parse(JSON.stringify(this.defaultFilters));
  }

  onSearch(): void {
    const params: any = {};
    if (this.searchQuery.trim()) {
      params.searchTerm = this.searchQuery.trim();
    }
    if (this.selectedCategoryLabel !== "Todas") {
      // find selected category id
      const cat = this.categories.find(
        (c) => c.name === this.selectedCategoryLabel
      );
      if (cat) params.categoryIds = [cat.id];
    }
    this.router.navigate(["/search"], { queryParams: params });
  }

  onCategoryButtonClick(): void {
    // Opens the categories menu via template reference
  }

  onCategorySelect(cat: Category): void {
    this.selectedCategoryLabel = cat.name;
    this.router.navigate(["/search"], {
      queryParams: { categoryIds: [cat.id] },
    });
  }

  applyFilters(): void {
    // 1) Inicializa el DTO con página y orden
    const request: Partial<ListListingsRequestDto> & Record<string, any> = {
      page: 1,
      sortOrder: this.sortOrder,
    };

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
}
