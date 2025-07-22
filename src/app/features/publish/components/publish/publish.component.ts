import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  QueryList,
  ViewChildren,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from "@angular/forms";
import { Router } from "@angular/router";
import { MatSnackBar } from "@angular/material/snack-bar";

import { FormFieldComponent } from "src/app/shared/components/form-field/form-field.component";
import { HeaderComponent } from "src/app/shared/components/header/header.component";
import { FooterComponent } from "src/app/shared/components/footer/footer.component";
import { PublishTypeStepComponent } from "../publish-type-step/publish-type-step.component";
import { PublishInfoComponent } from "../publish-info/publish-info.component";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ListCategoriesComponent } from "src/app/shared/components/list-categories/list-categories.component";
import { ButtonCategoriesComponent } from "src/app/shared/components/button-categories/button-categories.component";
import { ListingRequestDto } from "src/app/shared/models/listing.model";
import { ListingService } from "src/app/shared/services/listing.service";
import { ResultSnackbarComponent } from "src/app/shared/components/result-snackbar/result.snackbar.component";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

interface SelectedImage {
  file: File;
  preview: string; // DataURL
  name: string;
  size: number;
  type: string;
}

interface CategorySelection {
  idPath: string; // e.g. '1>3>4'
  name: string; // display name
}

@Component({
  selector: "app-publish",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    /* shared components / material */
    HeaderComponent,
    FooterComponent,
    FormFieldComponent,
    MatCheckboxModule,
    PublishInfoComponent,
    PublishTypeStepComponent,
    MatIconModule,
    ListCategoriesComponent,
    ButtonCategoriesComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: "./publish.component.html",
  styleUrls: ["./publish.component.scss"],
})
export class PublishComponent implements OnInit {
  /* ---------------- wizard ---------------- */
  progress = { currentStep: 1 };
  step2Stage = 0; // sub‑secciones

  /* ---------------- formularios ---------------- */
  detailsForm!: FormGroup;
  commercialForm!: FormGroup;

  categories: CategorySelection[] = [];
  showList: boolean[] = [];

  isLoading = false;
  selectedImages: SelectedImage[] = []; // array de previews
  maxImages = 5;
  maxSize = 5 * 1024 * 1024;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sb: MatSnackBar,
    private listingsService: ListingService
  ) {}

  ngOnInit(): void {
    this.detailsForm = this.fb.group({
      title: ["", [Validators.required, Validators.minLength(3)]],
      description: ["", [Validators.required, Validators.minLength(10)]],
      brand: [""],
      condition: [2, Validators.required],
      images: [[], Validators.required],
    });

    this.commercialForm = this.fb.group({
      price: [null, [Validators.required, Validators.min(1)]],
      acceptsCash: [false],
      acceptsCard: [false],
      acceptsTransfer: [false],
      acceptsBarter: [false],
    });

    this.resetCategories();
  }

  /* ---------------- helpers de errores (como register) ---------------- */
  hasError(frm: "details" | "commercial", ctrl: string): boolean {
    const c = this.form(frm).get(ctrl);
    return !!c && c.invalid && c.touched;
  }

  getError(frm: "details" | "commercial", field: string): string {
    const c = this.form(frm).get(field);
    if (!c) return "";

    if (c.hasError("required"))
      return `El campo ${this.label(field)} es requerido`;
    if (c.hasError("minlength"))
      return `Debe tener al menos ${
        c.errors!["minlength"].requiredLength
      } caracteres`;
    if (c.hasError("min")) return "Debe ser mayor que cero";
    if (c.hasError("pattern")) return "Formato inválido";
    return "";
  }

  get imagesCtrl() {
    return this.detailsForm.get("images");
  }

  private form(frm: "details" | "commercial") {
    return frm === "details" ? this.detailsForm : this.commercialForm;
  }

  private label(f: string): string {
    return (
      (
        {
          title: "Título",
          description: "Descripción",
          brand: "Marca",
          condition: "Condición",
          images: "Fotos",
          price: "Precio",
        } as const
      )[f] ?? f
    );
  }

  /* ---------------- navegación / guardado ---------------- */
  nextStep(): void {
    this.progress.currentStep++;
  }
  previousStep(): void {
    this.progress.currentStep--;
  }

  continueStage(): void {
    if (this.step2Stage < 5) {
      this.step2Stage++;
    } else {
      this.nextStep();
    }
  }
  clearStage(): void {
    const map = ["title", "description", "brand", "condition", "images"][
      this.step2Stage
    ];
    this.detailsForm.get(map)?.reset(this.step2Stage === 4 ? [] : "");
  }

  cancelStage(): void {
    if (this.step2Stage > 0) {
      this.step2Stage--; // vuelve al card anterior
    } else {
      this.previousStep(); // estaba en el card 0 → vuelve al Paso 1
    }
  }

  cardDisabled(index: number): boolean {
    return this.step2Stage !== index;
  }

  private resetCategories() {
    this.categories = [{ idPath: "", name: "" }];
    this.showList = [false];
  }

  /** Cuando user hace toggle en slot i */
  onToggle(i: number) {
    this.showList[i] = !this.showList[i];
  }

  onCategorySelected(i: number, selection: { idPath: string; name: string }) {
    /* 1) ¿la categoría ya se eligió en otro slot? */
    const isDuplicate = this.categories.some(
      (c, idx) => idx !== i && c.idPath === selection.idPath
    );

    if (isDuplicate) {
      /* ── ya existe ──
       → no la asignamos y dejamos el botón **vacío** */
      this.categories[i] = { idPath: "", name: "" };
      this.showList[i] = false; // cierra el desplegable
      return; // salir
    }

    /* 2) no hay duplicado → guardar selección */
    this.categories[i] = selection;
    this.showList[i] = false;

    /* 3) asegurarnos de que quede un slot vacío al final (máx 10) */
    const last = this.categories[this.categories.length - 1];
    if (last.idPath !== "" && this.categories.length < 10) {
      this.categories.push({ idPath: "", name: "" });
      this.showList.push(false);
    }
  }

  /** Cuando se limpia un slot i */
  onClear(i: number) {
    // remueve slot i
    this.categories.splice(i, 1);
    this.showList.splice(i, 1);

    // si al final no hay slot vacío y count < 10, añade uno
    const last = this.categories[this.categories.length - 1];
    if (last.name !== "" && this.categories.length < 10) {
      this.categories.push({ idPath: "", name: "" });
      this.showList.push(false);
    }
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);

    files.forEach((file) => {
      if (this.selectedImages.length >= this.maxImages) return;

      // 1) Tamaño máximo 5 MB
      if (file.size > this.maxSize) {
        this.sb.openFromComponent(ResultSnackbarComponent, {
          data: {
            message: `La imagen ${file.name} supera los 5 MB`,
            status: "error",
          },
          duration: 4000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
          panelClass: "error-snackbar",
        });
        return;
      }

      // 2) Evita duplicados por nombre+tamaño
      const already = this.selectedImages.some(
        (i) => i.name === file.name && i.size === file.size
      );
      if (already) {
        this.sb.openFromComponent(ResultSnackbarComponent, {
          data: {
            message: `No puedes insertar 2 veces la misma imagen`,
            status: "error",
          },
          duration: 4000,
          horizontalPosition: "center",
          verticalPosition: "bottom",
          panelClass: "error-snackbar",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImages.push({
          file,
          preview: e.target?.result as string,
          name: file.name,
          size: file.size,
          type: file.type,
        });
        this.imagesCtrl?.setValue(this.selectedImages.map((img) => img.file));
        this.imagesCtrl?.markAsTouched();
      };
      reader.readAsDataURL(file);
    });
    input.value = "";
  }

  removeImage(index: number): void {
    if (index < 0 || index >= this.selectedImages.length) return;

    this.selectedImages.splice(index, 1);
    this.imagesCtrl?.setValue(this.selectedImages.map((img) => img.file));
    this.imagesCtrl?.markAsTouched();
  }

  /* ---------------- publicar ---------------- */
  publishListing(): void {
    if (this.detailsForm.invalid || this.commercialForm.invalid) {
      return;
    }

    if (this.selectedImages.length === 0) {
      return;
    }

    // 1) DTO con datos de formularios y categorías
    const dto: ListingRequestDto = {
      title: this.detailsForm.value.title,
      description: this.detailsForm.value.description,
      brand: this.detailsForm.value.brand,
      condition: this.detailsForm.value.condition,
      price: this.commercialForm.value.price,
      acceptsCash: this.commercialForm.value.acceptsCash,
      acceptsCard: this.commercialForm.value.acceptsCard,
      acceptsTransfer: this.commercialForm.value.acceptsTransfer,
      acceptsBarter: this.commercialForm.value.acceptsBarter,
      type: "PRODUCTO", // o según tu lógica
      categoriesId: this.categories
        .filter((c) => c.idPath)
        .map((c) => c.idPath),
    } as any;

    // 2) Archivos
    const main = this.selectedImages[0].file;
    const aux = this.selectedImages.slice(1).map((i) => i.file);

    this.isLoading = true;

    // 3) Llamar servicio
    this.listingsService.addListing(dto, main, aux).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.sb.openFromComponent(ResultSnackbarComponent, {
          data: { message: "¡Publicación creada!", status: "sucess" },
          duration: 4000,
          panelClass: "success-snackbar",
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });
        this.router.navigate(["/home"]);
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  @ViewChildren("slot", { read: ElementRef })
  slots!: QueryList<ElementRef<HTMLElement>>;

  /* ② escucha global de clics */
  @HostListener("document:click", ["$event"])
  handleClickOutside(evt: MouseEvent) {
    if (!this.clickedInsideSomeSlot(evt.target as Node)) {
      /* cierra todos */
      this.showList = this.showList.map(() => false);
    }
  }

  /** true si el clic ocurrió dentro de alguno de los slots */
  private clickedInsideSomeSlot(target: Node): boolean {
    return this.slots?.some((slot) => slot.nativeElement.contains(target));
  }
}
