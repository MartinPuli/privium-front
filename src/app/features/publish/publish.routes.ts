import { Routes } from "@angular/router"
import { PublishComponent } from "./components/publish/publish.component"
import { AuthGuard } from "../../core/guards/auth.guard"

export const publishRoutes: Routes = [
  {
    path: "",
    component: PublishComponent,
    canActivate: [AuthGuard],
    title: "Publicar - Privium",
    data: {
      description: "Publica tu producto o servicio en Privium marketplace",
      keywords: "publicar, vender, producto, servicio, privium",
    },
  },
]
