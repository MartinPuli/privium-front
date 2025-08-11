import { Routes } from "@angular/router";
import { AuthGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "/home",
    pathMatch: "full",
    title: "Redirigir a Inicio - Privium",
    data: {
      description: "Redirige automáticamente a la página de inicio de Privium.",
      keywords: "redirect, inicio, Privium",
    },
  },
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.routes").then((m) => m.authRoutes),
    title: "Iniciar Sesión - Privium",
    data: {
      description: "Accede a tu cuenta de Privium para comprar y vender en tu barrio cerrado.",
      keywords: "iniciar sesión, login, autenticación, Privium",
    },
  },
  {
    path: "home",
    loadChildren: () =>
      import("./features/home/home.routes").then((m) => m.homeRoutes),
    canActivate: [AuthGuard],
    title: "Inicio - Privium Marketplace",
    data: {
      description:
        "Descubre productos únicos en tu barrio cerrado. Marketplace exclusivo y seguro para tu comunidad.",
      keywords: "marketplace, barrios cerrados, productos, compra, venta, Privium",
    },
  },
  {
    path: "search",
    loadComponent: () => import('./features/search/search.component').then(m => m.SearchComponent),
    canActivate: [AuthGuard],
    title: "Buscar - Privium Marketplace",
    data: {
      description:
        "Busca publicaciones en tu barrio cerrado con filtros personalizados.",
      keywords: "buscar, filtros, barrio, productos, Privium",
    },
  },
  {
    path: "products",
    loadChildren: () =>
      import("./features/products/products.routes").then(
        (m) => m.productRoutes
      ),
    canActivate: [AuthGuard],
    title: "Productos - Privium Marketplace",
    data: {
      description: "Explora todos los productos disponibles en Privium.",
      keywords: "productos, catálogo, Privium, marketplace",
    },
  },
  {
    path: "publish",
    loadChildren: () =>
      import("./features/publish/publish.routes").then(
        (m) => m.publishRoutes
      ),
    canActivate: [AuthGuard],
    title: "Publicar - Privium",
    data: {
      description:
        "Publica un nuevo producto o servicio en Privium y llega a tu comunidad.",
      keywords: "publicar, venta, servicio, Privium",
    },
  },
  {
    path: "perfil/:userId",
    loadComponent: () => import('./features/profile/profile-info/profile-info.component').then(m => m.ProfileInfoComponent),
    canActivate: [AuthGuard],
    title: "Mi Perfil - Privium",
    data: {
      description: "Visualiza y edita la información de tu perfil en Privium.",
      keywords: "perfil, usuario, cuenta, Privium",
    },
  },
  {
    path: "admin/residence-verifications",
    loadComponent: () => import('./features/profile/residence-verification/residence-verification.component').then(m => m.ResidenceVerificationComponent),
    canActivate: [AuthGuard],
    title: "Verificaciones de Residencia - Privium",
    data: {
      description:
        "Gestiona y revisa las verificaciones de residencia de los usuarios.",
      keywords: "verificaciones, residencia, administración, Privium",
    },
  },
  {
    path: "**",
    redirectTo: "/home",
    title: "Página No Encontrada - Privium",
    data: {
      description: "Ruta no válida. Redirige a la página de inicio.",
      keywords: "404, not found, Privium",
    },
  },
];


