import { Component, OnInit } from "@angular/core"
import { ActivatedRoute, Router, RouterModule } from "@angular/router"
import { CommonModule } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatChipsModule } from "@angular/material/chips"
import { MatBadgeModule } from "@angular/material/badge"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { firstValueFrom } from "rxjs"

import { ListingService } from "../../../../shared/services/listing.service"
import {
  ProductDetail,
  ListListingsRequestDto,
  ListingResponseDto,
} from "../../../../shared/models/listing.model"
import { HeaderComponent } from "src/app/shared/components/header/header.component"
import { FooterComponent } from "src/app/shared/components/footer/footer.component"
import { ProfileService } from "src/app/shared/services/profile.service"
import { CountryService } from "src/app/shared/services/country.service"
import { User } from "src/app/shared/models/user.model"
import { ProductCardSmallComponent } from "src/app/shared/components/product-card-small/product-card-small.component"
import { DefaultImageDirective } from "src/app/shared/directives/default-image.directive"

@Component({
  selector: "app-product-detail",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    HeaderComponent,
    FooterComponent,
    ProductCardSmallComponent,
    DefaultImageDirective,
  ],
  templateUrl: "./product-detail.component.html",
  styleUrls: ["./product-detail.component.scss"],
})
export class ProductDetailComponent implements OnInit {

  product: ProductDetail | null = null
  seller: User | null = null
  locationName: string | null = null
  currentImageIndex = 0
  isLoading = true
  isFavorite = false

  additionalInfo = {
    relatedSearch: "Muebles antiguos",
    dimensions: "Medidas: 110 cm de ancho x 51 cm de profundidad x 89 cm de alto.",
  }


  relatedProducts: ListingResponseDto[] = []

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
    private profileService: ProfileService,
    private countryService: CountryService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const productId = Number.parseInt(params["id"], 10)
      if (productId) {
        const nav = this.router.getCurrentNavigation()
        const req = (nav?.extras.state as any)?.request as Partial<ListListingsRequestDto> | undefined
        this.loadProduct(productId, req)
      }
    })
  }

  private async loadProduct(id: number, req?: Partial<ListListingsRequestDto>): Promise<void> {
    try {
      const [listResp, infoResp] = await Promise.all([
        firstValueFrom(
          this.listingService.listListings(
            req ?? { listingId: id, pageSize: 1 }
          )
        ),
        firstValueFrom(this.listingService.getListingInfo(id)),
      ])

      const listing = listResp.data?.[0]
      if (listing) {
        this.product = { ...listing, ...infoResp.data } as ProductDetail
        this.isFavorite = false
        this.locationName = this.countryService.getNameById(listing.countryId)

        try {
          const relatedResp = await firstValueFrom(
            this.listingService.listListings({
              categoryIds: infoResp.data!.categories?.map((c) => c.categoryId) ?? [],
              page: 1,
              pageSize: 4,
            })
          )
          this.relatedProducts = relatedResp.data ?? []
        } catch {
          this.relatedProducts = []
        }
        try {
          const userResp = await this.profileService.getUser(listing.userId)
          this.seller = userResp.data ?? null
        } catch {}
      }
    } finally {
      this.isLoading = false
    }
  }

  getAllImages(): string[] {
    if (!this.product) return []

    const allImages = [this.product.mainImage]
    this.product.auxiliaryImages?.forEach((auxImg) => {
      allImages.push(auxImg.imgUrl)
    })

    return allImages.filter(Boolean)
  }

  onToggleFavorite(): void {
    if (this.product) {
      this.isFavorite = !this.isFavorite
    }
  }

  onContactSeller(): void {
    console.log("Contact seller:", this.product?.userId)
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

  getPaymentMethods(): string[] {
    if (!this.product) return []

    const methods: string[] = []
    if (this.product.acceptsCash) methods.push("EFECTIVO")
    if (this.product.acceptsBarter) methods.push("TRUEQUE")
    if (this.product.acceptsCard) methods.push("TARJETA")
    if (this.product.acceptsTransfer) methods.push("TRANSFERENCIA")
    return methods
  }

  getPaymentMethodClass(method: string): string {
    const classMap: { [key: string]: string } = {
      EFECTIVO: "efectivo",
      TRUEQUE: "trueque",
      TARJETA: "tarjeta",
      TRANSFERENCIA: "transferencia",
    }
    return classMap[method] || ""
  }

  getProductType(): string {
    return this.product?.type === "PRODUCTO" ? "Cómoda" : "Servicio"
  }

  getCategoryNames(): string {
    if (!this.product?.categories) return "Muebles"
    return this.product.categories.map((cat) => cat.description).join(", ")
  }


  goBack(): void {
    this.router.navigate(["/home"])
  }
}

