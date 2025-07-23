import { Component } from "@angular/core";
import {
  FormBuilder,
  Validators,
  AbstractControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { CommonModule } from "@angular/common";

import { AuthService } from "src/app/shared/services/auth.service";
import { CountryService } from "src/app/shared/services/country.service";
import { RegisterRequest } from "src/app/shared/models/user.model";

import {
  AuthCardComponent,
  AuthButton,
  AuthLink,
} from "src/app/features/auth/components/auth-card/auth-card.component";
import { HeaderComponent } from "src/app/shared/components/header/header.component";
import { FooterComponent } from "src/app/shared/components/footer/footer.component";
import {
  FormFieldComponent,
  SelectOption,
} from "src/app/shared/components/form-field/form-field.component";
import { CountryResponseDto } from "src/app/shared/models/country.model";
import { ResponseDataDto } from "src/app/shared/models/responses.model";
import { map } from "rxjs";
import {
  DefaultModalComponent,
  ModalButton,
} from "src/app/shared/components/default-modal/default-modal.component";
import { RegistrationDataService } from "src/app/shared/services/registration-data.service";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AuthCardComponent,
    HeaderComponent,
    FooterComponent,
    FormFieldComponent,
    DefaultModalComponent,
  ],
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss", "../../auth-styles.scss"],
})
export class RegisterComponent {
  private passwordsMatch = (group: AbstractControl) => {
    const pass = group.get("password")?.value;
    const confirm = group.get("confirmPassword")?.value;
    return pass === confirm ? null : { mismatch: true };
  };

  /* -----------------------------------------------------------
     Formulario
     ----------------------------------------------------------- */

  registerForm: FormGroup = this.fb.group(
    {
      name: ["", [Validators.required, Validators.minLength(2)]],
      lastname: ["", [Validators.required, Validators.minLength(2)]],
      dni: ["", [Validators.required, Validators.pattern(/^\d{7,9}$/)]],
      email: ["", [Validators.required, Validators.email]],
      phone: [""],
      countryId: [null, Validators.required],
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", Validators.required],
      acceptTerms: [false, Validators.requiredTrue],
    },
    { validators: this.passwordsMatch }
  );

  /* -----------------------------------------------------------
     Estado local
     ----------------------------------------------------------- */
  isLoading = false;
  hidePassword = true;
  countryOptions: SelectOption[] = [];
  showTermsModal = false;
  showPrivacyModal = false;

  /* -----------------------------------------------------------
     Botones y links del wrapper
     ----------------------------------------------------------- */
  get buttons(): AuthButton[] {
    return [
      {
        label: "Continuar",
        type: "submit",
        form: "registerForm",
        action: () => this.onSubmit(),
        disabled: this.isLoading || this.registerForm.invalid,
      },
    ];
  }

  readonly links: AuthLink[] = [
    {
      label: "Iniciar sesión",
      action: () => this.router.navigate(["/auth/login"]),
    },
  ];

  /* -----------------------------------------------------------
     Constructor
     ----------------------------------------------------------- */
  constructor(
    private fb: FormBuilder,
    private regData: RegistrationDataService,
    private countryService: CountryService,
    private router: Router,
    private sb: MatSnackBar
  ) {
    /* carga de barrios */
    this.loadCountries();
  }

  ngOnInit(): void {
    const saved = this.regData.getRegistrationData();
    if (saved) {
      this.registerForm.patchValue(saved);
    }
    // Cada vez que cambie el form, actualizamos el draft
    this.registerForm.valueChanges.subscribe((val) => {
      const prev = this.regData.getRegistrationData() ?? {};
      this.regData.setRegistrationData({
        ...prev, // conserva lo que ya estaba (incluido proof…)
        ...val, // actualiza sólo los campos del registerForm
      });
    });
  }

  /* -----------------------------------------------------------
     Cargar lista de barrios
     ----------------------------------------------------------- */
  private loadCountries(): void {
    this.countryService
      .getCountries()
      .pipe(
        map((res: ResponseDataDto<CountryResponseDto[]>) => res.data ?? []),
        map((countries) =>
          countries.map((c) => ({
            value: c.id,
            label: c.name,
          }))
        )
      )
      .subscribe({
        next: (opts) => {
          this.countryOptions = opts;
        },
        error: (err) => console.error("Error cargando países", err),
      });
  }

  termsButtons: ModalButton[] = [
    {
      label: "Cancelar",
      type: "secondary",
      action: () => (this.showTermsModal = false),
    },
    {
      label: "Aceptar",
      type: "primary",
      action: () => {
        this.registerForm.patchValue({ acceptTerms: true });
        this.showTermsModal = false;
      },
    },
  ];

  /* -----------------------------------------------------------
     Helpers para template
     ----------------------------------------------------------- */
  hasError(ctrl: string): boolean {
    const c = this.registerForm.get(ctrl);
    return !!c && c.invalid && c.touched;
  }

  getError(field: string): string {
    const c = this.registerForm.get(field);
    if (!c) return "";
    if (c.hasError("required")) return `${this.label(field)} es requerido`;
    if (c.hasError("email")) return "Ingresá un email válido";
    if (c.hasError("minlength")) {
      return `El campo ${this.label(field)} debe tener al menos ${
        c.errors!["minlength"].requiredLength
      } caracteres`;
    }
    if (this.registerForm.hasError("mismatch") && field === "confirmPassword") {
      return "Las contraseñas no coinciden";
    }
    if (c.hasError("pattern") && field === "dni") return "DNI inválido";
    return "";
  }

  openTerms(): void {
    this.showTermsModal = true;
  }

  private label(f: string) {
    return (
      {
        name: "Nombre",
        lastname: "Apellido",
        dni: "DNI",
        email: "Email",
        phone: "Teléfono",
        countryId: "Barrio",
        password: "Contraseña",
        confirmPassword: "Confirmación",
      } as const
    )[f];
  }

  /* -----------------------------------------------------------
     Enviar y pasar al paso de verificación
     ----------------------------------------------------------- */
  async onSubmit() {
    if (this.registerForm.invalid) {
      /* … */ return;
    }

    const prev = this.regData.getRegistrationData() ?? {};
    this.regData.setRegistrationData({
      ...prev,
      ...this.registerForm.value, // completa/actualiza datos del paso 1
    });
    this.router.navigate(["/auth/verify-residence"]);
  }
}
