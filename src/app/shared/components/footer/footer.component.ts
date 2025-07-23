import { Component, Input } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent {
  @Input() logged: boolean = true;
  currentYear = new Date().getFullYear()

  categories = [
    { name: "Vehículos", link: "/products?category=vehiculos" },
    { name: "Hogar", link: "/products?category=hogar" },
    { name: "Muebles", link: "/products?category=muebles" },
    { name: "Indumentaria", link: "/products?category=indumentaria" },
    { name: "Electrónica", link: "/products?category=electronica" },
  ]

  helpLinks = [
    { name: "Publicar", link: "/publish" },
    { name: "Solución de problemas", link: "/help/problems" },
    { name: "Centro de seguridad", link: "/help/security" },
  ]
}
