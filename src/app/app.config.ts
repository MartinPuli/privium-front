import { type ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter, withRouterConfig } from "@angular/router";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { BrowserModule, Title, Meta } from "@angular/platform-browser";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { errorInterceptor } from "./core/interceptors/error.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    // 1) Router con recarga en la misma URL
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: "reload" })),

    // 2) Standalone HTTP + tus interceptors
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),

    // 3) Animaciones y módulos clásicos
    provideAnimationsAsync(),
    importProvidersFrom(BrowserModule, MatSnackBarModule),

    // 4) Servicios de título y meta
    Title,
    Meta,
  ],
};
