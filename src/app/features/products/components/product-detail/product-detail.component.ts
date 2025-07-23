import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
} from "@angular/core"
import { ActivatedRoute, Router, RouterModule } from "@angular/router"
import { CommonModule } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatChipsModule } from "@angular/material/chips"
import { MatBadgeModule } from "@angular/material/badge"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { firstValueFrom } from "rxjs"

import { ListingService } from "../../../../shared/services/listing.service"
import { ProductDetail } from "../../../../shared/models/listing.model"
import { HeaderComponent } from "src/app/shared/components/header/header.component"
import { FooterComponent } from "src/app/shared/components/footer/footer.component"

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
  ],
  templateUrl: "./product-detail.component.html",
  styleUrls: ["./product-detail.component.scss"],
})
export class ProductDetailComponent implements OnInit {
  @ViewChild("relatedProductsScroll") relatedProductsScroll!: ElementRef<HTMLDivElement>

  product: ProductDetail | null = null
  currentImageIndex = 0
  isLoading = true
  isFavorite = false

  additionalInfo = {
    relatedSearch: "Muebles antiguos",
    dimensions: "Medidas: 110 cm de ancho x 51 cm de profundidad x 89 cm de alto.",
  }

  relatedProductTitles = [
    "MESA DE LUZ",
    "BURÓ DE ROBLE",
    "CÓMODA",
    "APARADOR",
    "VAJILLERO DE PINO",
    "MESA AUXILIAR",
  ]

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingService: ListingService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const productId = Number.parseInt(params["id"], 10)
      if (productId) {
        this.loadProduct(productId)
      }
    })
  }

  private async loadProduct(id: number): Promise<void> {
    try {
      const [listResp, infoResp] = await Promise.all([
        firstValueFrom(this.listingService.listListings({ listingId: id, pageSize: 1 })),
        firstValueFrom(this.listingService.getListingInfo(id)),
      ])

      const listing = listResp.data?.[0]
      if (listing) {
        this.product = { ...listing, ...infoResp.data } as ProductDetail
        this.isFavorite = false
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

  getRelatedProductTitle(index: number): string {
    return this.relatedProductTitles[index - 1] || "PRODUCTO"
  }

  scrollRelatedProducts(direction: "left" | "right"): void {
    const scrollContainer = this.relatedProductsScroll.nativeElement
    const scrollAmount = 220

    if (direction === "left") {
      scrollContainer.scrollLeft -= scrollAmount
    } else {
      scrollContainer.scrollLeft += scrollAmount
    }
  }

  goBack(): void {
    this.router.navigate(["/home"])
  }
}

