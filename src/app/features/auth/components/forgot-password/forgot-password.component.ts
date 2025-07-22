import { Component } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";

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
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-forgot-password",
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
  templateUrl: "./forgot-password.component.html",
  styleUrls: ["./forgot-password.component.scss", "../../auth-styles.scss"],
})
export class ForgotPasswordComponent {
  emailForm: FormGroup = this.fb.group({
    email: ["", [Validators.required, Validators.email]],
  });

  isLoading = false;
  success = false;

  /* botones para AuthCard */
  get buttons(): AuthButton[] {
    if (this.success) return [];
    return [
      {
        label: "Enviar enlace",
        type: "submit",
        disabled: this.isLoading || this.emailForm.invalid,
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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private sb: MatSnackBar
  ) {}

  /* ------------------------------------------------------------ */
  async onSubmit() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    try {
      await firstValueFrom(
        this.authService.resetPassword(this.emailForm.value.email)
      );

      // si no arroja error → éxito
      this.success = true;
    } catch (err) {
      console.error("resetPassword error", err);
    } finally {
      this.isLoading = false;
    }
  }

  /* Botón dentro de ResultWarn */
  goToLogin(): void {
    this.router.navigate(["/auth/login"]);
  }
}
