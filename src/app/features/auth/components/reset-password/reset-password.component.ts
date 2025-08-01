import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { firstValueFrom } from "rxjs";

import { AuthService } from "src/app/shared/services/auth.service";
import {
  AuthCardComponent,
  AuthButton,
  AuthLink,
} from "src/app/features/auth/components/auth-card/auth-card.component";
import { HeaderComponent } from "src/app/shared/components/header/header.component";
import { FooterComponent } from "src/app/shared/components/footer/footer.component";
import { FormFieldComponent } from "src/app/shared/components/form-field/form-field.component";
import { ResultWarnComponent } from "src/app/shared/components/result-warn/result-warn.component";

@Component({
  selector: "app-reset-password",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AuthCardComponent,
    HeaderComponent,
    FooterComponent,
    FormFieldComponent,
    ResultWarnComponent,
  ],
  templateUrl: "./reset-password.component.html",
  styleUrls: ["./reset-password.component.scss", "../../auth-styles.scss"],
})
export class ResetPasswordComponent implements OnInit {
  /** nulo = loading, 'form' = muestra formulario, 1 = éxito, 0 = error */
  status: "form" | 1 | 0 | null = null;

  /* ----- texts para ResultWarn ----- */
  rwTitle = "";
  rwSubtitle = "";
  rwDescription = "";
  rwBtn = "";

  token!: string;

  private passwordsMatch = (ctrl: AbstractControl): ValidationErrors | null => {
    const pass = ctrl.get("password")?.value;
    const conf = ctrl.get("confirmPassword")?.value;
    return pass === conf ? null : { mismatch: true };
  };


  /* ------------------------- formulario ------------------------- */
  passwordForm: FormGroup = this.fb.group(
    {
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", Validators.required],
    },
    { validators: this.passwordsMatch }
  );

  get buttons(): AuthButton[] {
    if (this.status !== "form") return [];
    return [
      {
        label: "Actualizar contraseña",
        type: "submit",
        form: "passwordForm",
        disabled: this.isLoading || this.passwordForm.invalid,
        loading: this.isLoading,
        action: () => this.onSubmit(),
      },
    ];
  }

  readonly links: AuthLink[] = [
    {
      label: "Iniciar sesión",
      action: () => this.router.navigate(["/auth/login"]),
    },
  ];

  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private sb: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get("token") || "";

    if (!this.token) {
      this.setError(
        "Token inválido",
        "No pudimos procesar tu solicitud.",
        "El enlace puede haber expirado o ya fue utilizado. Si es necesario, comunicate con nosotros vía mail a priviumcontacto@gmail.com"
      );
      return;
    }

    // token presente → mostramos el form
    this.status = "form";
  }

  /* ------------------- lógica de envío ------------------- */
  async onSubmit() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    try {
      await firstValueFrom(
        this.authService.updatePassword(
          this.token,
          this.passwordForm.value.password
        )
      );

      this.setSuccess(
        "Contraseña actualizada",
        "¡Tu contraseña se cambió correctamente!",
        "Ahora puedes ingresar con tu nueva contraseña."
      );
    } catch (err) {
      this.setError(
        "Error al actualizar",
        "No pudimos cambiar tu contraseña.",
        "El enlace puede haber expirado o tu token es inválido."
      );
    } finally {
      this.isLoading = false;
    }
  }
  
  /* ------------------- helpers de UI ------------------- */
  private setSuccess(t: string, s: string, d: string) {
    this.status = 1;
    this.rwTitle = t;
    this.rwSubtitle = s;
    this.rwDescription = d;
  }

  private setError(t: string, s: string, d: string) {
    this.status = 0;
    this.rwTitle = t;
    this.rwSubtitle = s;
    this.rwDescription = d;
  }

  onWarnAction(): void {
    this.router.navigate(["/auth/login"]);
  }
}
