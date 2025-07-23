import { Component, type OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Title, Meta } from "@angular/platform-browser";
import { AuthService } from "./shared/services/auth.service";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { CommonModule } from "@angular/common";
import { LoaderService } from "./shared/services/loader.service";
import { LoaderComponent } from "./shared/components/loader/loader.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    MatProgressSpinnerModule,
    CommonModule,
    LoaderComponent,
  ],
  template: `
    <app-default-loader *ngIf="loader.loading$ | async"></app-default-loader>
    <ng-container *ngIf="initialized; else loading">
      <router-outlet></router-outlet>
    </ng-container>

    <ng-template #loading>
      <div class="app-init-loader">
        <mat-spinner diameter="60"></mat-spinner>
      </div>
    </ng-template>
  `,
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  initialized = false;
  constructor(
    private titleService: Title,
    private metaService: Meta,
    private authService: AuthService,
    public loader: LoaderService
  ) {
  }

  async ngOnInit(): Promise<void> {
    await this.authService.loadInitialData();
    this.initialized = true;

    this.titleService.setTitle(
      "Privium - Marketplace Privado de Barrios Cerrados"
    );

    this.metaService.addTags([
      {
        name: "description",
        content:
          "Privium es el marketplace exclusivo para barrios cerrados y countries. Compra y vende productos de forma segura dentro de tu comunidad privada.",
      },
      {
        name: "keywords",
        content:
          "marketplace, barrios cerrados, countries, compra venta, privium, seguridad",
      },
      { name: "author", content: "Privium" },
      { name: "robots", content: "index, follow" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { charset: "UTF-8" },

      {
        property: "og:title",
        content: "Privium - Marketplace Privado de Barrios Cerrados",
      },
      {
        property: "og:description",
        content:
          "Marketplace exclusivo para barrios cerrados. Compra y vende de forma segura en tu comunidad.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://privium.com" },
      {
        property: "og:image",
        content: "https://privium.com/assets/images/og-image.jpg",
      },
      { property: "og:site_name", content: "Privium" },
      { property: "og:locale", content: "es_AR" },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Privium - Marketplace Privado" },
      {
        name: "twitter:description",
        content:
          "Marketplace exclusivo para barrios cerrados. Compra y vende de forma segura.",
      },
      {
        name: "twitter:image",
        content: "https://privium.com/assets/images/twitter-image.jpg",
      },

      { name: "geo.region", content: "AR-B" },
      { name: "geo.placename", content: "Buenos Aires, Argentina" },
      { name: "geo.position", content: "-34.6118;-58.3960" },
      { name: "ICBM", content: "-34.6118, -58.3960" },
    ]);

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Privium",
      url: "https://privium.com",
      description: "Marketplace exclusivo para barrios cerrados y countries",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://privium.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);
  }
}
