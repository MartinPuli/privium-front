import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  ElementRef,
  ViewChildren,
  HostListener,
  QueryList,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl,
} from "@angular/forms";
import {
  ListingInfoResponseDto,
  ListingResponseDto,
  ListingRequestDto,
  EditPayload,
} from "src/app/shared/models/listing.model";
import {
  DefaultModalComponent,
  ModalButton,
} from "src/app/shared/components/default-modal/default-modal.component";
import { FormFieldComponent } from "src/app/shared/components/form-field/form-field.component";
import { ListCategoriesComponent } from "src/app/shared/components/list-categories/list-categories.component";
import { ButtonCategoriesComponent } from "src/app/shared/components/button-categories/button-categories.component";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { DefaultImageDirective } from "src/app/shared/directives/default-image.directive";

@Component({
  selector: "app-edit-publication",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    DefaultModalComponent,
    ButtonCategoriesComponent,
    ListCategoriesComponent,
    FormFieldComponent,
    MatCheckboxModule,
    DefaultImageDirective,
  ],
  templateUrl: "./edit-publication.component.html",
  styleUrls: ["./edit-publication.component.scss"],
})
export class EditPublicationComponent implements OnInit {
  /* ---------- inputs / outputs ----------------------------- */
  @Input({ required: true }) listing!: ListingResponseDto;
  @Input({ required: true }) fullInfo!: ListingInfoResponseDto;
  /** 'left' (básicos) o 'right' (extra) */
  @Input({ required: true }) side!: "left" | "right";
  @Input() saving = false;

  @Output() saved = new EventEmitter<EditPayload>();
  @Output() closed = new EventEmitter<void>();

  /* ---------- formularios ---------------------------------- */
  leftForm!: FormGroup;
  rightForm!: FormGroup;

  /* ---------- categorías ----------------------------------- */
  categories: { idPath: string; name: string }[] = [];
  showList: boolean[] = [];

  /* ---------- imágenes ------------------------------------- */
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;
  selectedImages: { file: File; preview: string }[] = [];
  readonly maxImages = 5;
  readonly maxSize = 5 * 1024 * 1024; // 5 MB
  readonly minImagesReq = 1; // mínimo requerido

  /* mensaje de error para mostrar debajo de las fotos */
  imageError: string | null = null;

  /** cuántas fotos reales hay */
  get filledImages(): number {
    return this.selectedImages.filter((img) => !!img.preview).length;
  }
  /** índice portada */
  get mainIndex(): number {
    return this.selectedImages.findIndex((img) => !!img.preview);
  }

  /* ---------- botones del modal ---------------------------- */
  get modalButtons(): ModalButton[] {
    return [
      {
        label: "Cancelar",
        type: "secondary",
        action: () => this.closed.emit(),
        disabled: this.saving,
      },
      {
        label: "Modificar",
        type: "primary",
        action: () => this.onSubmit(),
        disabled:
          this.saving ||
          (this.side === "left"
            ? this.leftForm.invalid
            : this.rightForm.invalid),
        loading: this.saving,
      },
    ];
  }

  /* ---------- ctor / init ---------------------------------- */
  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    /* ▸ Imágenes iniciales (portada + auxiliares) */
    this.selectedImages = [
      { file: new File([], ""), preview: this.listing.mainImage },
      ...this.fullInfo.auxiliaryImages.map((ai) => ({
        file: new File([], ""),
        preview: ai.imgUrl,
      })),
    ].slice(0, this.maxImages);

    while (this.selectedImages.length < this.maxImages) {
      this.selectedImages.push({ file: new File([], ""), preview: "" });
    }

    /* ▸ Categorías */
    this.categories = this.fullInfo.categories.map((c) => ({
      idPath: c.categoryId,
      name: c.description,
    }));
    if (
      this.categories.length < 10 &&
      (this.categories.length === 0 || this.categories.at(-1)!.idPath !== "")
    ) {
      this.categories.push({ idPath: "", name: "" });
    }
    this.showList = this.categories.map(() => false);

    /* ▸ Validador “mínimo N imágenes” */
    const minImages: ValidatorFn = (c: AbstractControl) =>
      (c.value as { preview: string }[]).filter((i) => !!i.preview).length >=
      this.minImagesReq
        ? null
        : { tooFew: true };

    /* ▸ Formularios */
    this.leftForm = this.fb.group({
      title: [
        this.listing.title,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      price: [this.listing.price, [Validators.required, Validators.min(1)]],
      condition: [this.listing.condition, Validators.required],
      images: [this.selectedImages, minImages],
    });

    this.rightForm = this.fb.group({
      description: [
        this.listing.description,
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(1000),
        ],
      ],
      categories: [[], Validators.minLength(1)],
      paysCash: [this.listing.acceptsCash],
      paysCard: [this.listing.acceptsCard],
      paysTransf: [this.listing.acceptsTransfer],
      paysBarter: [this.listing.acceptsBarter],
    });

    this.rightForm
      .get("categories")!
      .setValue(this.categories.filter((c) => c.idPath).map((c) => c.idPath));

    /* error inicial si aplica */
    if (this.filledImages < this.minImagesReq) {
      this.imageError = `Debes subir al menos ${this.minImagesReq} fotos`;
    }
  }

  /* =========================================================
     IMÁGENES
  ==========================================================*/
  private setImageError(msg: string) {
    this.imageError = msg;
    this.leftForm.get("images")!.updateValueAndValidity({ emitEvent: false });
  }
  private clearImageError() {
    this.imageError = null;
    this.leftForm.get("images")!.updateValueAndValidity({ emitEvent: false });
  }

  addImages(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    const remaining = this.maxImages - this.filledImages;
    const files = Array.from(input.files ?? []).slice(0, remaining);
    this.clearImageError();

    files.forEach((file) => {
      if (this.filledImages >= this.maxImages) return;

      /* ▸ peso */
      if (file.size > this.maxSize) {
        this.setImageError(`La imagen ${file.name} supera los 5 MB`);
        return;
      }

      /* ▸ duplicado: comparar contra todas las previews existentes */
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target!.result as string;
        const dup = this.selectedImages.some((im) => im.preview === preview);
        if (dup) {
          this.setImageError(
            `La imagen ${file.name} ya fue cargada en esta modificación`
          );
          return;
        }

        const slot = this.selectedImages.findIndex((im) => !im.preview);
        const img = { file, preview };
        slot === -1
          ? this.selectedImages.push(img)
          : (this.selectedImages[slot] = img);

        this.leftForm.get("images")!.updateValueAndValidity();
      };
      reader.readAsDataURL(file);
    });

    input.value = "";
  }

  removeImage(i: number): void {
    if (!this.selectedImages[i]) return;
    this.selectedImages[i] = { file: new File([], ""), preview: "" };

    if (this.filledImages < this.minImagesReq) {
      this.setImageError(`Debes subir al menos ${this.minImagesReq} fotos`);
    } else {
      this.clearImageError();
    }
    this.leftForm.get("images")!.setValue(this.selectedImages);
  }

  /* =========================================================
     PORTADA SIEMPRE PRIMER SLOT
  ==========================================================*/
  private normalizeOrder(): void {
    while (this.selectedImages.length < this.maxImages) {
      this.selectedImages.push({ file: new File([], ""), preview: "" });
    }
    if (!this.selectedImages[0].preview) {
      const next = this.selectedImages.findIndex(
        (im, idx) => idx > 0 && im.preview
      );
      if (next > 0) {
        [this.selectedImages[0], this.selectedImages[next]] = [
          this.selectedImages[next],
          this.selectedImages[0],
        ];
      }
    }
  }

  /* =========================================================
     CATEGORÍAS (métodos sin cambios)
  ==========================================================*/
  toggleList(i: number) {
    this.showList[i] = !this.showList[i];
  }
  clearCat(i: number) {
    this.categories.splice(i, 1);
    this.showList.splice(i, 1);
    const reales = this.categories.filter((c) => c.idPath);
    this.categories = [...reales, { idPath: "", name: "" }];
    this.showList = this.categories.map(() => false);
    this.patchCats();
  }
  onCategorySelected(i: number, sel: { idPath: string; name: string }) {
    const dup = this.categories.some(
      (c, idx) => idx !== i && c.idPath === sel.idPath
    );
    if (dup) {
      this.categories[i] = { idPath: "", name: "" };
      this.showList[i] = false;
      return;
    }
    this.categories[i] = sel;
    this.showList[i] = false;

    if (
      i === this.categories.length - 1 &&
      this.categories.length < 10 &&
      sel.idPath
    ) {
      this.categories.push({ idPath: "", name: "" });
      this.showList.push(false);
    }
    this.patchCats();
  }
  private patchCats() {
    this.rightForm
      .get("categories")!
      .setValue(this.categories.filter((c) => c.idPath).map((c) => c.idPath));
  }

  /* =========================================================
     DTO
  ==========================================================*/
  private buildRequest(): ListingRequestDto {
    this.normalizeOrder();

    const mainPreview = this.selectedImages[0].preview || null;
    const mainImageStr =
      mainPreview && mainPreview !== this.listing.mainImage
        ? mainPreview
        : null;

    const auxCurrent = this.selectedImages
      .slice(1, this.maxImages)
      .map((im) => im.preview || null);

    const origAux = this.fullInfo.auxiliaryImages.map(
      (ai) => ai.imgUrl ?? null
    );
    const auxChanged = auxCurrent.some((p, i) => p !== (origAux[i] ?? null));

    return {
      listingId: this.listing.id,
      title: this.leftForm.value.title ?? this.listing.title,
      description: this.rightForm.value.description ?? this.listing.description,
      price: this.leftForm.value.price ?? this.listing.price,
      condition: this.leftForm.value.condition ?? this.listing.condition,
      brand: this.listing.brand,
      mainImage: mainImageStr,
      imagesUrl: auxChanged ? auxCurrent : null,
      categoriesId: this.rightForm.value.categories?.length
        ? this.rightForm.value.categories
        : this.fullInfo.categories.map((c) => c.categoryId),
      acceptsCash: this.rightForm.value.paysCash ?? this.listing.acceptsCash,
      acceptsCard: this.rightForm.value.paysCard ?? this.listing.acceptsCard,
      acceptsTransfer:
        this.rightForm.value.paysTransf ?? this.listing.acceptsTransfer,
      acceptsBarter:
        this.rightForm.value.paysBarter ?? this.listing.acceptsBarter,
      type: this.listing.type,
    };
  }

  /* =========================================================
     GUARDAR
  ==========================================================*/
  onSubmit(): void {
    if (this.filledImages < this.minImagesReq) {
      this.setImageError(`Debes subir al menos ${this.minImagesReq} fotos`);
      return;
    }

    const dto = this.buildRequest();

    /* ▶️  Solo adjuntar el archivo si realmente hay
         un *nombre* y su preview cambió                 */
    const f0 = this.selectedImages[0].file;
    const changed = dto.mainImage !== null; // preview cambió
    const mainFile = changed && f0 && f0.name?.length ? f0 : null;

    /* auxiliares ― misma idea */
    const auxFiles =
      dto.imagesUrl !== null
        ? this.selectedImages
            .slice(1, this.maxImages)
            .map((im, idx) =>
              im.preview &&
              im.preview !== this.fullInfo.auxiliaryImages[idx]?.imgUrl &&
              im.file.name?.length
                ? im.file
                : null
            )
        : null;

    this.saved.emit({ dto, mainImageFile: mainFile, auxFiles });
  }

  /* =========================================================
     CLICK FUERA PARA CERRAR DROPDOWNS
  ==========================================================*/
  @ViewChildren("catSlot", { read: ElementRef })
  catSlots!: QueryList<ElementRef<HTMLElement>>;
  @HostListener("document:click", ["$event"])
  clickOut(evt: MouseEvent) {
    const inside = this.catSlots.some((slot) =>
      slot.nativeElement.contains(evt.target as Node)
    );
    if (!inside) this.showList = this.showList.map(() => false);
  }
}
