/*import { Component, Input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { MatCardModule } from "@angular/material/card"
import { MatChipsModule } from "@angular/material/chips"
import { ListingResponseDto } from "../../models/listing.model"

@Component({
  selector: "app-product-card",
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatChipsModule],
  templateUrl: "./product-card.component.html",
  styleUrls: ["./product-card.component.scss"],
})
export class ProductCardComponent {
  @Input() product!: ListingResponseDto
  @Input() showLocation = true
  @Input() showPaymentMethods = false

  formatPrice(price: number): string {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

  getConditionText(): string {
    return this.product.condition === "new" ? "Nuevo" : "Usado"
  }

  getPaymentMethods(): string[] {
    const methods: string[] = []
    if (this.product.acceptsCash) methods.push("Efectivo")
    if (this.product.acceptsBarter) methods.push("Trueque")
    if (this.product.acceptsCard) methods.push("Tarjeta")
    if (this.product.acceptsTransfer) methods.push("Transferencia")
    return methods
  }

  getPaymentMethodClass(method: string): string {
    return `payment-chip ${method.toLowerCase()}`
  }

  getMainImage(): string {
    return this.product.images && this.product.images.length > 0
      ? this.product.images[0]
      : "/assets/images/placeholder.jpg"
  }
}*/
