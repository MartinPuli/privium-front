import { Routes } from "@angular/router"
import { HomeComponent } from "./components/home/home.component"

export const homeRoutes: Routes = [
  {
    path: "",
    component: HomeComponent,
    title: "Inicio - Privium Marketplace",
    data: {
      description: "Descubre productos únicos en tu barrio cerrado. Marketplace exclusivo y seguro para tu comunidad.",
      keywords: "marketplace, barrios cerrados, productos, compra, venta, privium",
    },
  },
]
