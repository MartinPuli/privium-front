import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  AfterViewInit,
  HostListener,
  ElementRef,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { CategoryService } from "src/app/shared/services/category.service";
import { CategoryResponseDto } from "src/app/shared/models/category.model";

@Component({
  selector: "app-list-categories",
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: "./list-categories.component.html",
  styleUrls: ["./list-categories.component.scss"],
})
export class ListCategoriesComponent implements OnInit, OnChanges, AfterViewInit {
  /** ID del nodo padre cuyo listado mostrar (null = nivel raíz) */
  @Input() parentId: string | null = null;

  /** Cadena de IDs seleccionados hasta aquí (ej. "1>3>4") */
  @Input() path = "";

  /**
   * Si se setea, fuerza orientación y desactiva el cálculo automático.
   * Si queda null/undefined, usa autoOrientation (por defecto: true).
   */
  @Input() orientation: "left" | "right" | null = null;

  /** Auto-orientación por la mitad del viewport (default: true) */
  @Input() autoOrientation = true;

  /** Emite la selección final (idPath, name) */
  @Output() categorySelected = new EventEmitter<{ idPath: string; name: string }>();

  categories: CategoryResponseDto[] = [];
  expandedMap: Record<string, boolean> = {};

  /** Orientación efectiva usada en clases e iconos */
  effectiveOrientation: "left" | "right" = "right"; // valor inicial para que se vean flechas

  constructor(
    private categoryService: CategoryService,
    private el: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Fallback inicial: si forzás orientación, úsala
    if (this.orientation) this.effectiveOrientation = this.orientation;
    this.loadChildren();
  }

  ngAfterViewInit(): void {
    this.scheduleRecompute();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["parentId"] && !changes["parentId"].isFirstChange()) {
      this.loadChildren();
      this.scheduleRecompute();
    }
    if (changes["orientation"] && !changes["orientation"].isFirstChange()) {
      this.scheduleRecompute();
    }
    if (changes["autoOrientation"] && !changes["autoOrientation"].isFirstChange()) {
      this.scheduleRecompute();
    }
  }

  private isForced(): boolean {
    return this.orientation === "left" || this.orientation === "right";
  }

  /** Agenda recálculo en el próximo tick (evita NG0100) */
  private scheduleRecompute(): void {
    setTimeout(() => {
      this.recomputeOrientation();
      this.cdr.markForCheck();
    }, 0);
  }

  /** Auto: izquierda si el centro del panel está a la derecha de la mitad del viewport */
  private recomputeOrientation(): void {
    if (this.isForced()) {
      this.effectiveOrientation = this.orientation as "left" | "right";
      return;
    }
    if (!this.autoOrientation) {
      // Compatibilidad: sin auto y sin orientación → mantené el valor actual
      return;
    }
    const rect = this.el.nativeElement.getBoundingClientRect();
    const panelCenter = rect.left + rect.width / 2;
    const viewportCenter = window.innerWidth / 2;
    this.effectiveOrientation = panelCenter > viewportCenter ? "left" : "right";
  }

  @HostListener("window:resize")
  @HostListener("window:scroll")
  onViewportChanged(): void {
    // Sólo recalcular si no está forzado y el auto está activo
    if (!this.isForced() && this.autoOrientation) this.scheduleRecompute();
  }

  /** Carga hijos de parentId */
  private loadChildren(): void {
    if (this.parentId) {
      const prefix = this.parentId + ">";
      this.categories = this.sortCategories(this.categoryService.getByPrefix(prefix));
      return;
    }
    this.categories = this.sortCategories(
      this.categoryService.getCached().filter((c) => c.id.split(">").length === 2)
    );
  }

  /** Ordena alfabéticamente y deja "Otros..." al final */
  private sortCategories(list: CategoryResponseDto[]): CategoryResponseDto[] {
    return list.sort((a, b) => {
      const aIsOther = a.name.toLowerCase().startsWith("otros");
      const bIsOther = b.name.toLowerCase().startsWith("otros");
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return a.name.localeCompare(b.name);
    });
  }

  hasChild(cat: CategoryResponseDto): boolean {
    return (cat as any).hasChild === 1;
  }

  toggleExpand(cat: CategoryResponseDto): void {
    if (!this.hasChild(cat)) return;
    this.expandedMap[cat.id] = !this.expandedMap[cat.id];
  }

  select(cat: CategoryResponseDto): void {
    this.categorySelected.emit({ idPath: cat.id, name: cat.name });
  }
}
