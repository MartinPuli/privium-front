import { Component } from "@angular/core";
import {
  FormBuilder,
  Validators,
  AbstractControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
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
  private notBlank: ValidatorFn = (control: AbstractControl) => {
    const value = control.value as string;
    return typeof value === "string" && value.trim().length === 0 && value.length > 0
      ? { required: true }
      : null;
  };

  private passwordsMatch = (group: AbstractControl) => {
    const pass = group.get("password")?.value;
    const confirm = group.get("confirmPassword")?.value;
    return pass === confirm ? null : { mismatch: true };
  };

  /* -----------------------------------------------------------
     Formulario
     ----------------------------------------------------------- */

  private readonly passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  registerForm: FormGroup = this.fb.group(
    {
      name: [
        "",
        [
          Validators.required,
          this.notBlank,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      lastname: [
        "",
        [
          Validators.required,
          this.notBlank,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      dni: [
        "",
        [
          Validators.required,
          this.notBlank,
          Validators.pattern(/^\d{7,9}$/),
          Validators.maxLength(9),
        ],
      ],
      email: [
        "",
        [
          Validators.required,
          this.notBlank,
          Validators.email,
          Validators.maxLength(100),
        ],
      ],
      phone: ["", [Validators.maxLength(20)]],
      countryId: [null, Validators.required],
      password: [
        "",
        [
          Validators.required,
          this.notBlank,
          Validators.minLength(8),
          Validators.maxLength(50),
          Validators.pattern(this.passwordPattern),
        ],
      ],
      confirmPassword: [
        "",
        [Validators.required, this.notBlank, Validators.maxLength(50)],
      ],
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
  showSecurityModal = false;
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
        }
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
    if (c.hasError("required")) return `Este campo es requerido`;
    if (c.hasError("email")) return "Ingresá un email válido";
    if (c.hasError("minlength")) {
      return `El campo ${this.label(field)} debe tener al menos ${
        c.errors!["minlength"].requiredLength
      } caracteres`;
    }
    if (c.hasError("maxlength")) {
      return `El campo ${this.label(field)} debe tener como máximo ${
        c.errors!["maxlength"].requiredLength
      } caracteres`;
    }
    if (this.registerForm.hasError("mismatch") && field === "confirmPassword") {
      return "Las contraseñas no coinciden";
    }
    if (c.hasError("pattern")) {
      if (field === "dni") return "DNI inválido";
      if (field === "password")
        return "Debe incluir mayúscula, minúscula, número y símbolo";
    }
    return "";
  }

  openTerms(): void {
    this.showTermsModal = true;
  }

  openSecurity(): void {
    this.showSecurityModal = true;
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
