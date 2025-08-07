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
  ValidatorFn,
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
import { DefaultImageDirective } from "../../../../shared/directives/default-image.directive";

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
    DefaultImageDirective,
  ],
  templateUrl: "./publish.component.html",
  styleUrls: ["./publish.component.scss"],
})
export class PublishComponent implements OnInit {
  /* ---------------- wizard ---------------- */
  progress = { currentStep: 1 };
  step2Stage = 0; // sub‑secciones

  type: 'PRODUCTO' | 'VEHICULO' | 'INMUEBLE' | 'MUEBLE' | 'SERVICIO' | null = null;
  skipCondition = false;

  /* ---------------- formularios ---------------- */
  detailsForm!: FormGroup;
  commercialForm!: FormGroup;

  private notBlank: ValidatorFn = (control: AbstractControl) => {
    const value = control.value as string;
    return typeof value === "string" && value.trim().length === 0 && value.length > 0
      ? { required: true }
      : null;
  };

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

  onTypeContinue(
    type: 'PRODUCTO' | 'VEHICULO' | 'INMUEBLE' | 'MUEBLE' | 'SERVICIO'
  ): void {
    this.type = type;
    this.skipCondition = type === 'SERVICIO';
    if (this.skipCondition) {
      this.detailsForm.get('condition')?.setValue(2);
    }
    this.nextStep();
  }

  ngOnInit(): void {
    this.detailsForm = this.fb.group({
      title: [
        "",
        [
          Validators.required,
          this.notBlank,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: [
        "",
        [
          Validators.required,
          this.notBlank,
          Validators.minLength(10),
          Validators.maxLength(1000),
        ],
      ],
      condition: [2, Validators.required],
      images: [[], Validators.required],
    });

    this.commercialForm = this.fb.group({
      price: [null, [
        Validators.required,
        Validators.min(1),
        Validators.max(99999999),
        Validators.pattern(/^\d+$/)
      ]],
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
    if (c.hasError("maxlength"))
      return `Debe tener como máximo ${
        c.errors!["maxlength"].requiredLength
      } caracteres`;
    if (c.hasError("min")) return "Debe ser mayor que cero";
    if (c.hasError("max")) return "El precio debe ser menor o igual a $99.999.999";
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
    const maxStage = this.skipCondition ? 3 : 4;
    if (this.step2Stage < maxStage) {
      this.step2Stage++;
    } else {
      this.nextStep();
    }
  }
  clearStage(): void {
    const mapArr = this.skipCondition
      ? ["title", "", "description", "images"]
      : ["title", "", "description", "condition", "images"];
    const map = mapArr[this.step2Stage];
    if (map) {
      const imgStage = this.skipCondition ? 3 : 4;
      this.detailsForm.get(map)?.reset(this.step2Stage === imgStage ? [] : "");
    }
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

    const remaining = this.maxImages - this.selectedImages.length;
    const files = Array.from(input.files).slice(0, remaining);

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

  onDetailsSubmit(): void {
    const validMap = [
      () => this.detailsForm.get('title')!.valid,
      () => this.categories[0].idPath !== '',
      () => this.detailsForm.get('description')!.valid,
      () =>
        this.skipCondition
          ? this.selectedImages.length > 0
          : this.detailsForm.get('condition')!.valid,
      () => this.selectedImages.length > 0,
    ];

    if (validMap[this.step2Stage]()) {
      this.continueStage();
    }
  }

  /* ---------------- publicar ---------------- */
  publishListing(): void {
    if (
      this.detailsForm.invalid ||
      this.commercialForm.invalid ||
      this.selectedImages.length === 0 ||
      !this.isPriceValid()
    ) {
      return;
    }

    // 1) DTO con datos de formularios y categorías
    const dto: ListingRequestDto = {
      title: this.detailsForm.value.title,
      description: this.detailsForm.value.description,
      condition: this.detailsForm.value.condition,
      price: this.commercialForm.value.price,
      acceptsCash: this.commercialForm.value.acceptsCash,
      acceptsCard: this.commercialForm.value.acceptsCard,
      acceptsTransfer: this.commercialForm.value.acceptsTransfer,
      acceptsBarter: this.commercialForm.value.acceptsBarter,
      type: this.type ?? "PRODUCTO",
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
          data: { message: "¡Publicación creada!", status: "success" },
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

  isPriceValid(): boolean {
    const price = this.commercialForm.get('price')?.value;
    return price >= 1 && price <= 99999999;
  }

  @HostListener('window:keydown.enter', ['$event'])
  onEnterPress(event: KeyboardEvent) {
    event.preventDefault();

    if (this.progress.currentStep === 2) {
      this.onDetailsSubmit();
    } else if (this.progress.currentStep === 3) {
      this.publishListing();
    }
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
