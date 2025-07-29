import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
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
export class ListCategoriesComponent implements OnInit, OnChanges {
  /** ID del nodo padre cuyo listado mostrar (null = nivel raíz) */
  @Input() parentId: string | null = null;
  /** Cadena de IDs seleccionados hasta aquí (ej. "1>3>4") */
  @Input() path = "";
  /** Dirección en la que se abre el sublistado */
  @Input() orientation: "left" | "right" = "right";
  /** Emite la selección final (idPath, name) */
  @Output() categorySelected = new EventEmitter<{
    idPath: string;
    name: string;
  }>();

  /** Listado directo de categorías hijas de parentId */
  categories: CategoryResponseDto[] = [];
  /** Controla expand/collapse por ID */
  expandedMap: Record<string, boolean> = {};

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadChildren();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["parentId"] && !changes["parentId"].isFirstChange()) {
      this.loadChildren();
    }
  }

  /** Carga desde el backend sólo los hijos de parentId */
  private loadChildren(): void {
    const prefix = this.parentId ? this.parentId + ">" : "";
    this.categories = this.categoryService.getByPrefix(prefix);
  }

  /** ¿Esta categoría tiene hijos según el flag? */
  hasChild(cat: CategoryResponseDto): boolean {
    return (cat as any).hasChild === 1;
  }

  /** Expande/contrae el sublistado */
  toggleExpand(cat: CategoryResponseDto): void {
    if (!this.hasChild(cat)) return;
    this.expandedMap[cat.id] = !this.expandedMap[cat.id];
  }

  /** Selección final, emite la ruta completa */
  select(cat: CategoryResponseDto): void {
    this.categorySelected.emit({ idPath: cat.id, name: cat.name });
  }
}
