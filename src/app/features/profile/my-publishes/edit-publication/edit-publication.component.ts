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
  ],
  templateUrl: "./edit-publication.component.html",
  styleUrls: ["./edit-publication.component.scss"],
})
export class EditPublicationComponent implements OnInit {
  /* ---------- inputs / outputs ----------------------------- */
  @Input({ required: true }) listing!: ListingResponseDto;
  @Input({ required: true }) fullInfo!: ListingInfoResponseDto;
  /** qué sección se edita: 'left' (básicos) o 'right' (extra) */
  @Input({ required: true }) side!: "left" | "right";

  @Output() saved = new EventEmitter<EditPayload>();
  @Output() closed = new EventEmitter<void>();

  /* ---------- formularios ---------------------------------- */
  leftForm!: FormGroup; // título, fotos, precio, condición
  rightForm!: FormGroup; // descripción, categorías, medios de pago

  /* ---------- categorías ----------------------------------- */
  categories: { idPath: string; name: string }[] = [];
  showList: boolean[] = [];

  /* ---------- imágenes ------------------------------------- */
  @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;
  selectedImages: { file: File; preview: string }[] = [];
  readonly maxImages = 5;
  readonly maxSize = 5 * 1024 * 1024;

  /* ---------- botones del modal ---------------------------- */
  get modalButtons(): ModalButton[] {
    return [
      {
        label: "Cancelar",
        type: "secondary",
        action: () => this.closed.emit(),
      },
      {
        label: "Modificar",
        type: "primary",
        form: this.side === "left" ? "leftForm" : "rightForm",
        action: () => this.onSubmit(),
        disabled:
          this.side === "left" ? this.leftForm.invalid : this.rightForm.invalid,
      },
    ];
  }

  /* ---------- ctor / init ---------------------------------- */
  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    /* ----- IMÁGENES ---------------------------------------- */
    this.selectedImages = [
      { file: new File([], ""), preview: this.listing.mainImage },
      ...this.fullInfo.auxiliaryImages.map((ai) => ({
        file: new File([], ""),
        preview: ai.imgUrl,
      })),
    ].slice(0, this.maxImages);

    /* ----- CATEGORÍAS ------------------------------------- */
    this.categories = this.fullInfo.categories.map((c) => ({
      idPath: c.categoryId,
      name: c.description,
    }));

    /* 👉  si la última NO está vacía y aún caben más, agrega un slot “+” */
    if (
      this.categories.length < 10 &&
      (this.categories.length === 0 ||
        this.categories[this.categories.length - 1].idPath !== "")
    ) {
      this.categories.push({ idPath: "", name: "" });
    }

    this.showList = this.categories.map(() => false);

    /* ----- FORMULARIOS ------------------------------------ */
    this.leftForm = this.fb.group({
      title: [
        this.listing.title,
        [Validators.required, Validators.minLength(3)],
      ],
      price: [this.listing.price, [Validators.required, Validators.min(1)]],
      condition: [this.listing.condition, Validators.required],
      images: [this.selectedImages, Validators.minLength(1)],
    });

    this.rightForm = this.fb.group({
      description: [this.listing.description, Validators.required],
      categories: [[], Validators.minLength(1)],
      paysCash: [this.listing.acceptsCash],
      paysCard: [this.listing.acceptsCard],
      paysTransf: [this.listing.acceptsTransfer],
      paysBarter: [this.listing.acceptsBarter],
    });

    /* categorías iniciales al form */
    this.rightForm
      .get("categories")!
      .setValue(this.categories.filter((c) => c.idPath).map((c) => c.idPath));
  }

  /* =========================================================
     MÉTODOS PARA MANEJAR IMÁGENES  (solo en side 'left')
  ==========================================================*/
  addImages(evt: Event): void {
    const files = Array.from((evt.target as HTMLInputElement).files || []);
    for (const f of files) {
      if (this.selectedImages.length >= this.maxImages) break;
      if (f.size > this.maxSize) continue;

      const reader = new FileReader();
      reader.onload = (e) =>
        this.selectedImages.push({
          file: f,
          preview: e.target!.result as string,
        });
      reader.readAsDataURL(f);
    }
    this.leftForm.get("images")!.setValue(this.selectedImages);
    (evt.target as HTMLInputElement).value = "";
  }

  removeImage(i: number): void {
    this.selectedImages.splice(i, 1);
    this.leftForm.get("images")!.setValue(this.selectedImages);
  }

  /* =========================================================
     MÉTODOS PARA MANEJAR CATEGORÍAS  (solo en side 'right')
  ==========================================================*/
  toggleList(i: number): void {
    this.showList[i] = !this.showList[i];
  }

  clearCat(i: number) {
    this.categories.splice(i, 1);
    this.showList.splice(i, 1);

    const reales = this.categories.filter((c) => c.idPath !== "");

    this.categories = [...reales, { idPath: "", name: "" }];

    this.showList = this.categories.map(() => false);

    this.rightForm
      .get("categories")!
      .setValue(this.categories.filter((c) => c.idPath).map((c) => c.idPath));
  }

  onCategorySelected(i: number, sel: { idPath: string; name: string }): void {
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
      sel.idPath !== ""
    ) {
      this.categories.push({ idPath: "", name: "" });
      this.showList.push(false);
    }
    this.patchCategoriesToForm();
  }

  private patchCategoriesToForm(): void {
    this.rightForm
      .get("categories")!
      .setValue(this.categories.filter((c) => c.idPath).map((c) => c.idPath));
  }

  /* =========================================================
     CONSTRUIR DTO COMPLETO PARA editListing
  ==========================================================*/
  private buildRequest(): ListingRequestDto {
    const orig = this.listing;
    const origAux = this.fullInfo.auxiliaryImages.map((ai) => ai.imgUrl);

    const origCatIds = this.fullInfo.categories.map((c) => c.categoryId);

    /* --- imagen principal -------------------------------- */
    const mainImgCurrent = this.selectedImages[0]?.preview || "";
    const mainImage = mainImgCurrent !== orig.mainImage ? mainImgCurrent : null;

    /* --- auxiliares -------------------------------------- */
    const auxCurrent = this.selectedImages.slice(1).map((i) => i.preview);
    const auxChanged =
      auxCurrent.length !== origAux.length ||
      !auxCurrent.every((p) => origAux.includes(p));
    const imagesUrl = auxChanged ? auxCurrent : null;

    /* --- request ----------------------------------------- */
    return {
      listingId: orig.id,
      title: this.leftForm.value.title ?? orig.title,
      description: this.rightForm.value.description ?? orig.description,
      price: this.leftForm.value.price ?? orig.price,
      condition: this.leftForm.value.condition ?? orig.condition,
      brand: orig.brand,
      mainImage,
      imagesUrl,
      categoriesId: this.rightForm.value.categories?.length
        ? this.rightForm.value.categories // nuevas si cambió
        : origCatIds,
      acceptsCash: this.rightForm.value.paysCash ?? orig.acceptsCash,
      acceptsCard: this.rightForm.value.paysCard ?? orig.acceptsCard,
      acceptsTransfer: this.rightForm.value.paysTransf ?? orig.acceptsTransfer,
      acceptsBarter: this.rightForm.value.paysBarter ?? orig.acceptsBarter,
      type: orig.type,
      /* action se omite */
    };
  }

  /* =========================================================
     GUARDAR
  ==========================================================*/
  onSubmit(): void {
    // 1) Armo el DTO con buildRequest()
    const dto = this.buildRequest();

    // 2) Extraigo siempre el archivo principal (si cambió)
    const mainFile =
      dto.mainImage !== null ? this.selectedImages[0].file : null;

    // 3) Auxiliares: si dto.imagesUrl===null → null
    //    si dto.imagesUrl!==null → file[] (aunque sea [])
    const auxFiles =
      dto.imagesUrl !== null
        ? this.selectedImages.slice(1).map((i) => i.file)
        : null;

    // 4) Emito
    this.saved.emit({ dto, mainImageFile: mainFile, auxFiles });
  }

  @ViewChildren("catSlot", { read: ElementRef })
  catSlots!: QueryList<ElementRef<HTMLElement>>;

  /** Cuando se hace clic en cualquier parte del documento */
  @HostListener("document:click", ["$event"])
  handleClickOutside(evt: MouseEvent) {
    const target = evt.target as Node;

    // Si el clic NO ocurrió dentro de ningún cat-slot, cerramos todos
    const clickedInside = this.catSlots.some((slot) =>
      slot.nativeElement.contains(target)
    );

    if (!clickedInside) {
      this.showList = this.showList.map(() => false);
    }
  }
}
