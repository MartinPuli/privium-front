// main.ts
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, withRouterConfig } from "@angular/router";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { importProvidersFrom } from "@angular/core";
import { BrowserModule, Title, Meta } from "@angular/platform-browser";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { AppComponent } from "./app/app.component";
import { routes } from "./app/app.routes";
import { authInterceptor } from "./app/core/interceptors/auth.interceptor";
import { errorInterceptor } from "./app/core/interceptors/error.interceptor";

bootstrapApplication(AppComponent, {
  providers: [
    // 1) **Única** llamada a provideRouter con reload
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: "reload" })),

    // 2) HTTP client + interceptors
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),

    // 3) Animaciones y módulos clásicos
    provideAnimationsAsync(),
    importProvidersFrom(BrowserModule, MatSnackBarModule),

    // 4) Servicios de título/meta
    Title,
    Meta,
  ],
}).catch((err) => console.error(err));
