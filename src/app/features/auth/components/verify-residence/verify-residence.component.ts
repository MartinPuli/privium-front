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
    // puede ser File o string (base64)
    fileProof: [null, [this.fileOrBase64Validator(20 * 1024 * 1024)]],
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
    // Carga inicial del draft completo (incluye proofMessage y proofImageBase64)
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
    if (data.proofImageBase64) {
      this.verificationForm.patchValue({ fileProof: data.proofImageBase64 });
    }

    // Cada cambio en el form actualiza el draft en el servicio
    this.verificationForm.get("textProof")!.valueChanges.subscribe((txt) => {
      const draft = this.regData.getRegistrationData()!;
      this.regData.setRegistrationData({
        ...draft,
        proofMessage: txt,
        proofImageBase64: draft.proofImageBase64,
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

  onFileSelected(file: File) {
    this.selectedImageFile = file;
    this.verificationForm.patchValue({ fileProof: file });
    this.verificationForm.get("fileProof")!.updateValueAndValidity();

    if (file) {
      this.fileToBase64(file).then((base64) => {
        const draft = this.regData.getRegistrationData()!;
        this.regData.setRegistrationData({
          ...draft,
          proofImageBase64: base64,
        });
      });
    } else{
      const draft = this.regData.getRegistrationData()!;
        this.regData.setRegistrationData({
          ...draft,
          proofImageBase64: undefined,
        });
    }
  }

  goBack(): void {
    this.router.navigate(["/auth/register"]);
  }

  async onSubmit(): Promise<void> {
    this.showGeneralError = false;
    this.isLoading = true;

    try {
      // 1) Tomar el base64 viejo o el nuevo File
      let imageBase64 =
        this.regData.getRegistrationData()?.proofImageBase64 ?? "";
      if (this.selectedImageFile) {
        imageBase64 = await this.fileToBase64(this.selectedImageFile);
      }

      // 2) Construir payload
      const payload = {
        ...this.userData,
        proofMessage: this.verificationForm.value.textProof || "",
        proofImageBase64: imageBase64,
      };

      // 3) Guardar el draft antes de llamar al API
      this.regData.setRegistrationData({ ...this.userData, ...payload });

      // 4) Disparar el POST y esperar la respuesta
      await firstValueFrom(this.authService.register(payload));

      // 5) Mostrar snackbar de éxito
      this.snackBar.open(
        "Registro completado! Revisa tu email para verificar tu cuenta.",
        "Cerrar",
        {
          duration: 5000,
          panelClass: ["success-snackbar"],
          horizontalPosition: "center",
          verticalPosition: "bottom",
        }
      );

      // 6) Limpiar formulario (sin emitir valueChanges) y servicio
      this.verificationForm.reset(undefined, { emitEvent: false });
      this.regData.clear();

      // 7) Navegar al siguiente paso
      this.router.navigate(["/auth/login"]);
    } catch (error) {
      console.error("Error during registration:", error);
      // aquí podrías setear showGeneralError = true si quieres alertar al usuario
    } finally {
      this.isLoading = false;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
    });
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

  private fileOrBase64Validator(maxBytes: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const val = control.value;

      // a) si es File -> chequeo tamaño
      if (val instanceof File) {
        return val.size > maxBytes
          ? { maxFileSize: { required: maxBytes, actual: val.size } }
          : null;
      }

      // b) si es string base64 -> doy OK
      if (typeof val === "string" && val.length) {
        return null;
      }

      // c) vacío -> dejo que otros (required) decidan
      return null;
    };
  }
}
