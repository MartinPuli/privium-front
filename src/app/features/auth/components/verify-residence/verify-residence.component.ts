import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  AbstractControl,
  ValidatorFn,
  ValidationErrors,
} from "@angular/forms";
import { Router, Navigation, RouterModule } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { AuthService } from "src/app/shared/services/auth.service";
import { HeaderComponent } from "src/app/shared/components/header/header.component";
import { FooterComponent } from "src/app/shared/components/footer/footer.component";
import {
  AuthCardComponent,
  AuthButton,
  AuthLink,
} from "src/app/features/auth/components/auth-card/auth-card.component";
import { FormFieldComponent } from "src/app/shared/components/form-field/form-field.component";
import { RegisterRequest } from "src/app/shared/models/user.model";
import { RegistrationDataService } from "src/app/shared/services/registration-data.service";
import { firstValueFrom } from "rxjs";
import { ResultSnackbarComponent } from "src/app/shared/components/result-snackbar/result.snackbar.component";

@Component({
  selector: "app-verify-residence",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    HeaderComponent,
    FooterComponent,
    AuthCardComponent,
    FormFieldComponent,
  ],
  templateUrl: "./verify-residence.component.html",
  styleUrls: ["./verify-residence.component.scss", "../../auth-styles.scss"],
})
export class VerifyResidenceComponent implements OnInit {
  verificationForm: FormGroup = this.fb.group({
    fileProof: [null, [this.fileValidator(20 * 1024 * 1024)]],
    textProof: [""],
  });

  isLoading = false;
  selectedImageFile: File | null = null;
  userData!: RegisterRequest;
  showGeneralError = false;

  constructor(
    private fb: FormBuilder,
    private regData: RegistrationDataService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    const nav: Navigation | null = this.router.getCurrentNavigation();
    this.userData = nav?.extras?.state?.["userData"] ?? null;
  }

  ngOnInit(): void {
    // Carga inicial del draft completo (incluye proofMessage y proofDocument)
    const data = this.regData.getRegistrationData();
    if (!data) {
      this.router.navigate(["/auth/register"]);
      return;
    }
    this.userData = data;

    // Parchea el texto guardado
    if (data.proofMessage) {
      this.verificationForm.get("textProof")!.setValue(data.proofMessage);
    }

    // Parchea el file guardado
    if (data.proofDocument) {
      this.verificationForm.patchValue({ fileProof: data.proofDocument });
    }

    // Cada cambio en el form actualiza el draft en el servicio
    this.verificationForm.get("textProof")!.valueChanges.subscribe((txt) => {
      const draft = this.regData.getRegistrationData()!;
      this.regData.setRegistrationData({
        ...draft,
        proofMessage: txt,
        proofDocument: draft.proofDocument,
      });
    });
  }

  get buttons(): AuthButton[] {
    const hasFile = !!this.verificationForm.get("fileProof")?.value;
    const hasText = !!this.verificationForm.get("textProof")?.value?.trim();
    return [
      {
        label: "Registrar",
        type: "submit",
        color: "primary",
        form: "verificationForm",
        disabled:
          // disabled si está cargando
          this.isLoading ||
          // o si NO hay ni archivo ni texto
          !(hasFile || hasText),
        loading: this.isLoading,
        action: () => this.onSubmit(),
      },
    ];
  }

  readonly links: AuthLink[] = [
    {
      label: "Datos registro",
      action: () => this.goBack(),
    },
  ];

  onFileSelected(file: File | null) {
    this.selectedImageFile = file;
    this.verificationForm.patchValue({ fileProof: file });
    this.verificationForm.get("fileProof")!.updateValueAndValidity();
    const draft = this.regData.getRegistrationData()!;
    this.regData.setRegistrationData({
      ...draft,
      proofDocument: file || undefined,
    });
  }

  goBack(): void {
    this.router.navigate(["/auth/register"]);
  }

  async onSubmit(): Promise<void> {
    this.showGeneralError = false;
    this.isLoading = true;

    try {
      // 1) Tomar el File guardado o el recién seleccionado
      const file =
        this.selectedImageFile ||
        this.regData.getRegistrationData()?.proofDocument ||
        null;

      // 2) Armar el DTO SIN el File
      const dto: RegisterRequest = {
        ...this.userData,
        proofMessage: this.verificationForm.value.textProof || "",
        // OJO: NO metas el File dentro del DTO JSON
        proofDocument: undefined as any,
      };

      // 3) Guardar draft antes de llamar al API
      this.regData.setRegistrationData({
        ...dto,
        proofDocument: file ?? undefined,
      });

      // 4) Construir el FormData con las PARTES correctas
      const formData = new FormData();

      // Parte JSON llamada "request"
      formData.append(
        "request",
        new Blob([JSON.stringify(dto)], { type: "application/json" })
      );

      // Parte archivo llamada "document" (si hay)
      if (file instanceof File) {
        formData.append("document", file, file.name);
      }

      // 5) POST (no seteés Content-Type manualmente)
      await firstValueFrom(this.authService.register(formData));

      // 6) Snackbar éxito
      this.snackBar.openFromComponent(ResultSnackbarComponent, {
        data: {
          message:
            "Registro completado! Revisa tu email para verificar tu cuenta.",
          status: "success",
        },
        duration: 5000,
        panelClass: "success-snackbar",
        horizontalPosition: "center",
        verticalPosition: "bottom",
      });

      // 7) Limpiar
      this.verificationForm.reset(undefined, { emitEvent: false });
      this.regData.clear();
      this.router.navigate(["/auth/login"]);
    } catch (err) {
      this.showGeneralError = true;
    } finally {
      this.isLoading = false;
    }
  }

  getError(field: string): string {
    const ctrl = this.verificationForm.get(field);
    if (ctrl?.hasError("required")) {
      return "Este campo es requerido";
    }
    if (ctrl?.hasError("minlength")) {
      return "Debe tener al menos 10 caracteres";
    }
    if (ctrl?.hasError("maxFileSize")) {
      return "El archivo no puede superar los 10 MB";
    }
    return "";
  }

  private fileValidator(maxBytes: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;
      if (val instanceof File) {
        return val.size > maxBytes
          ? { maxFileSize: { required: maxBytes, actual: val.size } }
          : null;
      }
      // vacío -> dejo que otros (required) decidan
      return null;
    };
  }
}
