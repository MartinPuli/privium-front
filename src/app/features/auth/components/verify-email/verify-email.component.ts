import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AuthService } from "src/app/shared/services/auth.service";
import { ResultWarnComponent } from "src/app/shared/components/result-warn/result-warn.component";
import { catchError, of, tap } from "rxjs";
import { FooterComponent } from "src/app/shared/components/footer/footer.component";
import { HeaderComponent } from "src/app/shared/components/header/header.component";

@Component({
  selector: "app-verify-email",
  standalone: true,
  imports: [CommonModule, RouterModule, ResultWarnComponent, FooterComponent, HeaderComponent],
  templateUrl: "./verify-email.component.html",
  styleUrls: ["./verify-email.component.scss", "../../auth-styles.scss"],
})
export class VerifyEmailComponent implements OnInit {
  // nulo = loading, 1 = éxito, 0 = error
  status: 0 | 1 | null = null;

  title = "";
  subtitle = "";
  description = "";
  buttonLabel = "";

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get("token");

    if (!token) {
      this.setError(
        "Token inválido",
        "No pudimos verificar tu correo.",
        "El enlace puede haber expirado o ya fue utilizado."
      );
      return;
    }

    this.authService
      .verifyEmail(token)
      .pipe(
        tap(() =>
          this.setSuccess(
            "Verificación de correo electrónico",
            "Tu correo ha sido verificado correctamente.",
            "¡Gracias por confiar en Privium! Ya puedes iniciar sesión con tu cuenta."
          )
        ),
        catchError((err) => {
          console.error("verifyEmail error", err);
          this.setError(
            "Token inválido",
            "No pudimos verificar tu correo.",
            "Si es necesario contactenos vía email a priviumcontacto@gmail.com."
          );
          return of(null);
        })
      )
      .subscribe();
  }

  /* ----------------------- helpers de UI ----------------------- */
  private setSuccess(t: string, s: string, d: string) {
    this.status = 1;
    this.title = t;
    this.subtitle = s;
    this.description = d;
  }

  private setError(t: string, s: string, d: string) {
    this.status = 0;
    this.title = t;
    this.subtitle = s;
    this.description = d;
  }

  /* ------------- callback para el botón del child -------------- */
  onAction(): void {
    // éxito → home; error → login
    if (this.status === 1) {
      this.router.navigate(["/"]);
    } else {
      this.router.navigate(["/auth/login"]);
    }
  }
}
