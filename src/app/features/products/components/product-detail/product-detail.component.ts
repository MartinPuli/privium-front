import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import {
  Title,
  Meta,
  DomSanitizer,
  SafeHtml,
} from "@angular/platform-browser";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatBadgeModule } from "@angular/material/badge";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import { forkJoin, from, of, Subscription } from "rxjs";
import { switchMap, tap, map } from "rxjs/operators";

import { ListingService } from "src/app/shared/services/listing.service";
import {
  ProductDetail,
  ListListingsRequestDto,
  ListingResponseDto,
} from "src/app/shared/models/listing.model";
import { ProfileService } from "src/app/shared/services/profile.service";
import { CountryService } from "src/app/shared/services/country.service";
import { User } from "src/app/shared/models/user.model";

import { HeaderComponent } from "src/app/shared/components/header/header.component";
import { FooterComponent } from "src/app/shared/components/footer/footer.component";
import { ProductCardSmallComponent } from "src/app/shared/components/product-card-small/product-card-small.component";
import { DefaultImageDirective } from "src/app/shared/directives/default-image.directive";
import { AuthService } from "src/app/shared/services/auth.service";

@Component({
  selector: "app-product-detail",
  standalone: true,
  imports: [
    /* Angular */
    CommonModule,
    RouterModule,

    /* Material */
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,

    /* Componentes compartidos */
    HeaderComponent,
    FooterComponent,
    ProductCardSmallComponent,
    DefaultImageDirective,
  ],
  templateUrl: "./product-detail.component.html",
  styleUrls: ["./product-detail.component.scss"],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  /* ────────── Estado de la vista ────────── */
  product: ProductDetail | null = null;
  seller: User | null = null;
  locationName: string | null = null;

  currentImageIndex = 0;
  isLoading = true;
  isFavorite = false;

  relatedProducts: ListingResponseDto[] = [];

  productJsonLd: SafeHtml | null = null;

  /* helper de ejemplo */
  additionalInfo = {
    relatedSearch: "Muebles antiguos",
    dimensions:
      "Medidas: 110 cm de ancho x 51 cm de profundidad x 89 cm de alto.",
  };

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private listingService: ListingService,
    private profileService: ProfileService,
    private authService: AuthService,
    private countryService: CountryService,
    private title: Title,
    private meta: Meta,
    private sanitizer: DomSanitizer
  ) {}

  /* ════════════════════════════════════════════════════════════════
     CICLO DE VIDA
     ════════════════════════════════════════════════════════════════ */

  ngOnInit(): void {
    /* Nos suscribimos a los cambios de :id en la URL */
    this.sub = this.route.paramMap
      .pipe(
        tap(() => {
          this.resetState();
          this.isLoading = true; // ⬅️  ON (cada vez que cambia :id)
        }),

        switchMap((p) => {
          const id = Number(p.get("id"));
          if (!id) {
            return of(null);
          }

          return forkJoin({
            listing: this.getListingById(id).pipe(
            ),
            infoR: this.listingService.getListingInfo(id).pipe(
            ),
          }).pipe(
            map(({ listing, infoR }) => ({ listing, info: infoR.data! })),

            /* ←── Apagamos el loader cuando el forkJoin termina
             (éxito o error)   */
            tap({
              next: () => {
                this.isLoading = false;
              },
              error: () => (this.isLoading = false),
            })
          );
        })
      )
      .subscribe((result) => {
        if (!result) {
          return;
        } // id inválido ⇒ vista “vacía”

        this.product = { ...result.listing, ...result.info } as ProductDetail;
        this.locationName = this.countryService.getNameById(
          result.listing!.countryId
        );
        this.isFavorite = false;

        this.title.setTitle(`${this.product.title} | Privium`);
        this.meta.updateTag({
          name: "description",
          content: this.product.description,
        });
        this.meta.updateTag({
          property: "og:title",
          content: this.product.title,
        });
        this.meta.updateTag({
          property: "og:description",
          content: this.product.description,
        });
        if (this.product.mainImage) {
          this.meta.updateTag({
            property: "og:image",
            content: this.product.mainImage,
          });
        }
        this.productJsonLd = this.sanitizer.bypassSecurityTrustHtml(
          JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: this.product.title,
            image: this.getAllImages(),
            description: this.product.description,
            offers: {
              "@type": "Offer",
              priceCurrency: "ARS",
              price: this.product.price,
              availability: "https://schema.org/InStock",
            },
          })
        );

        /* vendedor */
        from(this.profileService.getUser(result.listing!.userId))
          .pipe(map((r) => r.data ?? null))
          .subscribe(
            (u) => (this.seller = u),
            () => (this.seller = null)
          );

        /* relacionados */
        const catIds = result.info.categories?.map((c) => c.categoryId) ?? [];
        this.listingService
          .listListings({
            categoryIds: catIds,
            notShownListing: this.product.id,
            notShownUser: this.authService.getCurrentUserId()!,
            page: 1,
            pageSize: 4,
          })
          .subscribe((r) => (this.relatedProducts = r.data ?? []));
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  /* ════════════════════════════════════════════════════════════════
     HELPERS / UI
     ════════════════════════════════════════════════════════════════ */

  getAllImages(): string[] {
    if (!this.product) {
      return [];
    }

    const urls = [
      this.product.mainImage,
      ...(this.product.auxiliaryImages?.map((a) => a.imgUrl) ?? []),
    ].filter((u) => !!u); // ⇦ quita falsy ('', null, undefined)

    return Array.from(new Set(urls)); // ⇦ quita duplicados
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price);
  }

  getPaymentMethods(): string[] {
    if (!this.product) {
      return [];
    }
    const m: string[] = [];
    if (this.product.acceptsCash) {
      m.push("EFECTIVO");
    }
    if (this.product.acceptsBarter) {
      m.push("TRUEQUE");
    }
    if (this.product.acceptsCard) {
      m.push("TARJETA");
    }
    if (this.product.acceptsTransfer) {
      m.push("TRANSFERENCIA");
    }
    return m;
  }

  getPaymentMethodClass(method: string): string {
    const css: Record<string, string> = {
      EFECTIVO: "efectivo",
      TRUEQUE: "trueque",
      TARJETA: "tarjeta",
      TRANSFERENCIA: "transferencia",
    };
    return css[method] ?? "";
  }

  getProductType(): string {
    return this.product?.type === "PRODUCTO" ? "Cómoda" : "Servicio";
  }

  getCategoryNames(): string {
    return (
      this.product?.categories?.map((c) => c.description).join(", ") ??
      "Muebles"
    );
  }

  /* ════════════════════════════════════════════════════════════════
     MÉTODOS PRIVADOS
     ════════════════════════════════════════════════════════════════ */

  /** Helper: obtiene un listing por ID reutilizando listListings() */
  private getListingById(id: number) {
    return this.listingService
      .listListings({ listingId: id, pageSize: 1 })
      .pipe(
        map((r) => r.data?.find((l) => l.id === id) || null) // <-- filtra local
      );
  }

  /** Limpia estado antes de cargar otro producto */
  private resetState(): void {
    this.product = null;
    this.seller = null;
    this.locationName = null;
    this.relatedProducts = [];
    this.currentImageIndex = 0;
  }
}
