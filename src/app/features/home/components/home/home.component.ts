import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import { SEOService } from "../../../../shared/services/seo.service";
import { ListingService } from "../../../../shared/services/listing.service";
import { CategoryService } from "../../../../shared/services/category.service";
import { FilterService } from "../../../../shared/services/filter.service";
import { ListingResponseDto } from "../../../../shared/models/listing.model";
import { Category } from "../../../../shared/models/category.model";
import { HeaderComponent } from "src/app/shared/components/header/header.component";
import { FooterComponent } from "src/app/shared/components/footer/footer.component";
import { ProductCardSmallComponent } from "src/app/shared/components/product-card-small/product-card-small.component";
import { DefaultImageDirective } from "../../../../shared/directives/default-image.directive";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    ProductCardSmallComponent,
    HeaderComponent,
    FooterComponent,
    DefaultImageDirective,
  ],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  neighborhoodProducts: ListingResponseDto[] = [];
  neighborhoodPage = 1;
  neighborhoodHasMore = false;

  categorySections: {
    id: string;
    name: string;
    products: ListingResponseDto[];
    page: number;
    hasMore: boolean;
  }[] = [];

  isLoading = true;

  constructor(
    private seoService: SEOService,
    private listingSrv: ListingService,
    private categorySrv: CategoryService,
    private filterSrv: FilterService
  ) {}

  ngOnInit() {
    this.filterSrv.clear();
    this.setupSEO();
    this.loadData();
  }

  private async loadData() {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadNeighborhoodProducts(),
        this.loadCategoryProducts(),
      ]);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadNeighborhoodProducts(page = 1) {
    const { products, hasMore } = await this.listingSrv.getNeighborhoodProducts(
      page,
      3,
      10
    );
    this.neighborhoodProducts = products;
    this.neighborhoodPage = page;
    this.neighborhoodHasMore = hasMore;
  }

  async nextNeighborhood() {
    if (!this.neighborhoodHasMore) return;

    const nextPage = this.neighborhoodPage + 1;
    const { products, hasMore } = await this.listingSrv.getNeighborhoodProducts(
      nextPage,
      3,
      10
    );

    if (!products.length) {
      // No hay más productos, deshabilitar el botón siguiente
      this.neighborhoodHasMore = false;
      return;
    }

    this.neighborhoodProducts = products;
    this.neighborhoodPage = nextPage;
    this.neighborhoodHasMore = hasMore;
  }
  async prevNeighborhood() {
    if (this.neighborhoodPage > 1) {
      await this.loadNeighborhoodProducts(this.neighborhoodPage - 1);
    }
  }

  /* ===================== CARGA INICIAL ===================== */
  private async loadCategoryProducts() {
    /** Regla:
     *  - Indumentaria → filtra por categoríaId = '5'
     *  - Resto        → filtra por typeFilter
     */
    const sections = [
      { key: "SERVICIO", name: "Servicios", mode: "type" },
      { key: "5", name: "Indumentaria", mode: "cat" },
      { key: "MUEBLE", name: "Muebles", mode: "type" },
      { key: "INMUEBLE", name: "Inmuebles", mode: "type" },
      { key: "VEHICULO", name: "Vehículos", mode: "type" },
    ];

    this.categorySections = [];

    for (const s of sections) {
      const { products, hasMore } =
        s.mode === "cat"
          ? await this.listingSrv.getProductsByCategory([s.key], 1, 4)
          : await this.listingSrv.getProductsByType(s.key, 1, 4);

      this.categorySections.push({
        id: s.key,
        name: s.name,
        products,
        page: 1,
        hasMore,
        // guardamos mode para paginación
        mode: s.mode as "cat" | "type",
      } as any);
    }
  }

  /* ===================== PAGINACIÓN ===================== */
  async nextCategory(section: any) {
    if (!section.hasMore) return;

    const page = section.page + 1;
    const size = 4;

    const { products, hasMore } =
      section.mode === "cat"
        ? await this.listingSrv.getProductsByCategory([section.id], page, size)
        : await this.listingSrv.getProductsByType(section.id, page, size);

    if (!products.length) {
      // Evita avanzar a una página sin productos
      section.hasMore = false;
      return;
    }

    section.products = products;
    section.page = page;
    section.hasMore = hasMore;
  }

  async prevCategory(section: any) {
    if (section.page <= 1) return;

    const page = section.page - 1;
    const size = 4;

    const { products, hasMore } =
      section.mode === "cat"
        ? await this.listingSrv.getProductsByCategory([section.id], page, size)
        : await this.listingSrv.getProductsByType(section.id, page, size);

    section.products = products;
    section.page = page;
    section.hasMore = hasMore;
  }

  trackByProductId(_: number, p: ListingResponseDto) {
    return p.id;
  }

  private setupSEO(): void {
    this.seoService.updateSEO({
      title: "Inicio",
      description:
        "Descubre productos únicos en tu barrio cerrado. Marketplace exclusivo y seguro para tu comunidad.",
      keywords:
        "marketplace, barrios cerrados, productos, compra, venta, privium, campos de alvarez",
      url: "https://privium.com",
      type: "website",
      image: "https://privium.com/assets/images/og-image.jpg",
      canonical: "https://privium.com",
    });
  }
}
