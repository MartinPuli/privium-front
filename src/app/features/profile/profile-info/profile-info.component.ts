import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { CommonModule } from "@angular/common";

import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { AuthService } from "src/app/shared/services/auth.service";
import { ProfileService } from "src/app/shared/services/profile.service";
import { User } from "src/app/shared/models/user.model";
import { HeaderComponent } from "src/app/shared/components/header/header.component";
import { FooterComponent } from "src/app/shared/components/footer/footer.component";
import { FormFieldComponent } from "src/app/shared/components/form-field/form-field.component";
import {
  DefaultModalComponent,
  ModalButton,
} from "src/app/shared/components/default-modal/default-modal.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MyPublishesComponent } from "../my-publishes/my-publishes.component";
import { CountryService } from "src/app/shared/services/country.service";
import { ResultSnackbarComponent } from "src/app/shared/components/result-snackbar/result.snackbar.component";

@Component({
  selector: "app-profile-info",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    HeaderComponent,
    FooterComponent,
    FormFieldComponent,
    DefaultModalComponent,
    MatButtonModule,
    MatIconModule,
    MyPublishesComponent,
  ],
  templateUrl: "./profile-info.component.html",
  styleUrls: ["./profile-info.component.scss"],
})
export class ProfileInfoComponent implements OnInit {
  user!: User;

  /* ----- modal ----- */
  modalOpen = false;
  editForm!: FormGroup;
  modalButtons: any[] = [];
  saveBtn!: ModalButton;
  cancelBtn!: ModalButton;
  isSaving = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private profileSvc: ProfileService,
    private snackBar: MatSnackBar,
    public countryService: CountryService
  ) {}

  ngOnInit(): void {
    const current = this.auth.getCurrentUser();
    if (!current) {
      this.router.navigate(["/auth/login"]);
      return;
    }
    this.user = current;
  }

  /* ---------- editar teléfono ---------- */
  editPhone(): void {
    this.editForm = this.fb.group({
      value: [this.user.contactPhone || "", Validators.required],
    });

    /* botón “Modificar” (lo guardamos en variable para mutarlo después) */
    this.saveBtn = {
      label: "Modificar",
      type: "primary",
      action: () => this.savePhone(),
      disabled: true, // arranca deshabilitado
      form: "editPhoneForm",
      loading: this.isSaving,
    };

    this.cancelBtn = {
      label: "Cancelar",
      type: "secondary",
      action: () => this.closeModal(),
      disabled: this.isSaving,
    };

    this.modalButtons = [this.cancelBtn, this.saveBtn];

    /* habilita/inhabilita en tiempo real */
    this.editForm.valueChanges.subscribe(({ value }) => {
      this.saveBtn.disabled = !value || value === this.user.contactPhone;
    });

    this.modalOpen = true;
  }

  async savePhone(): Promise<void> {
    if (this.editForm.invalid) return;
    const phone = this.editForm.value.value.trim();

    this.isSaving = true;
    if (this.saveBtn) this.saveBtn.loading = true;
    if (this.cancelBtn) this.cancelBtn.disabled = true;

    /* 1) Actualiza UI + storage */
    this.user.contactPhone = phone;
    localStorage.setItem("user", JSON.stringify(this.user));
    this.auth["currentUserSubject"].next(this.user);

    /* 2) PATCH backend */
    await this.profileSvc.updateProfile({ phone });

    this.snackBar.openFromComponent(ResultSnackbarComponent, {
      data: {
        message: "Teléfono actualizado correctamente",
        status: "success",
      },
      duration: 5000,
      panelClass: "success-snackbar",
      horizontalPosition: "center",
      verticalPosition: "bottom",
    });

    this.isSaving = false;
    if (this.saveBtn) this.saveBtn.loading = false;
    if (this.cancelBtn) this.cancelBtn.disabled = false;
    this.closeModal();
  }

  getError(): string {
    const ctrl = this.editForm.get("value");
    if (ctrl?.hasError("required") && ctrl.touched) return "Campo obligatorio";
    return "";
  }

  closeModal(): void {
    this.modalOpen = false;
  }
}
