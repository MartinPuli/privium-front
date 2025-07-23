import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";

import { AuthService } from "src/app/shared/services/auth.service";
import {
  AuthCardComponent,
  AuthButton,
  AuthLink,
} from "src/app/features/auth/components/auth-card/auth-card.component";
import { FormFieldComponent } from "src/app/shared/components/form-field/form-field.component";
import { LoginRequest } from "src/app/shared/models/user.model";
import { HeaderComponent } from "src/app/shared/components/header/header.component";
import { FooterComponent } from "src/app/shared/components/footer/footer.component";
import { ResultSnackbarComponent } from "src/app/shared/components/result-snackbar/result.snackbar.component";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthCardComponent,
    FormFieldComponent,
    HeaderComponent,
    FooterComponent, //  wrapper para <mat-form-field>
  ],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss", "../../auth-styles.scss"],
})
export class LoginComponent {
  /** Bandera global de carga / spinner */
  isLoading = false;

  /** Reactive Form con sus validaciones */
  readonly loginForm = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  });

  /** Botones que mostrará <app-auth-card>. */
  get buttons(): AuthButton[] {
    return [
      {
        label: "Iniciar sesión",
        color: "primary",
        type: "submit",
        form: "loginForm",
        disabled: this.loginForm.invalid || this.isLoading,
        loading: this.isLoading,
        action: () => this.onSubmit(),
      },
    ];
  }

  /** Enlaces auxiliares (Crear cuenta / Olvidaste…) */
  links: AuthLink[] = [
    {
      label: "Crear cuenta",
      type: "primary",
      action: () => this.router.navigate(["/auth/register"]),
    },
    {
      label: "¿Olvidaste tu contraseña?",
      type: "secondary",
      action: () => this.router.navigate(["/auth/forgot-password"]),
    },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  /* ------------------------------------------------------------------ */
  /*  ENVÍO DEL FORMULARIO                                              */
  /* ------------------------------------------------------------------ */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const creds = this.loginForm.value as LoginRequest;

    this.authService.login(creds).subscribe({
      next: (res) => {
        this.router.navigate(["/home"]);
        this.snackBar.openFromComponent(ResultSnackbarComponent, {
          data: {
            message: "Login exitoso",
            status: "success",
          },
          duration: 5000,
          panelClass: "success-snackbar",
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers para mensajes de error                                    */
  /* ------------------------------------------------------------------ */
  getError(field: "email" | "password"): string {
    const ctrl = this.loginForm.get(field);
    if (ctrl?.hasError("required")) return "Este campo es requerido";
    if (ctrl?.hasError("email")) return "Ingresá un e-mail válido";
    if (ctrl?.hasError("minlength"))
      return "La contraseña debe tener al menos 6 caracteres";
    return "";
  }
}
