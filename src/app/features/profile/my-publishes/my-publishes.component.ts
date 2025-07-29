import { Component, Input, input, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";

import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import {
  MatPaginator,
  MatPaginatorModule,
  PageEvent,
} from "@angular/material/paginator";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";

import { ListingService } from "src/app/shared/services/listing.service";
import {
  ListingRequestDto,
  ListingResponseDto,
} from "src/app/shared/models/listing.model";
import { User } from "src/app/shared/models/user.model";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { finalize, forkJoin } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ResultSnackbarComponent } from "src/app/shared/components/result-snackbar/result.snackbar.component";
import { PublicationCardComponent } from "./publish-card/publication-card.component";

@Component({
  selector: "app-my-publishes",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    PublicationCardComponent
  ],
  templateUrl: "./my-publishes.component.html",
  styleUrls: ["./my-publishes.component.scss"],
})
export class MyPublishesComponent implements OnInit {
  @Input() user!: User;

  /** Lista completa obtenida del backend */
  allListings: ListingResponseDto[] = [];
  /** Lista filtrada y ordenada */
  filteredListings: ListingResponseDto[] = [];
  /** Datos a mostrar en la página actual */
  listings: ListingResponseDto[] = [];

  /* filtros */
  sort: "DESC" | "ASC" = "DESC";
  search = "";

  /* paginación */
  pageSize = 6;
  pageIndex = 0;
  length = 0;

  isPausing = false;
  isReactivating = false;
  isDeleting = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ls: ListingService, 
    private router: Router,
    private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.load();
  }

  /* --- carga inicial del backend --- */
  load(): void {
    this.ls
      .listListings({ userId: this.user.id, pageSize: 9999 })
      .subscribe((r) => {
        this.allListings = r.data ?? [];
        this.applyFilters();
      });
  }

  /* --- cambia orden --- */
  setSort(ord: "DESC" | "ASC") {
    this.sort = ord;
    this.pageIndex = 0;
    this.applyFilters();
  }
  doSearch(term: string) {
    this.search = term.trim();
    this.pageIndex = 0;
    this.applyFilters();
  }

  /* --- manejador del paginador --- */
  pageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.setPagedData();
  }

  private setPagedData() {
    const start = this.pageIndex * this.pageSize;
    this.listings = this.filteredListings.slice(start, start + this.pageSize);
  }

  /** Aplica filtros de búsqueda y orden */
  private applyFilters() {
    let data = [...this.allListings];

    if (this.search) {
      const term = this.search.toLowerCase();
      data = data.filter((l) => l.title.toLowerCase().includes(term));
    }

    data.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return this.sort === "DESC" ? db - da : da - db;
    });

    this.filteredListings = data;
    this.length = this.filteredListings.length;
    this.setPagedData();
  }

  /* --- navegar a publicar --- */
  goToPublish() {
    this.router.navigate(["/publish"]);
  }

  /* dentro de la clase MyPublishesComponent */
  selectedIds = new Set<number>();

  /** verdadero sólo si hay al menos un elemento y todos están seleccionados */
  get allSelected(): boolean {
    return (
      this.listings.length > 0 && this.selectedIds.size === this.listings.length
    );
  }

  /** EXACTAMENTE uno y su estado es Activa (status === 1) */
  get canPauseSelected(): boolean {
    if (this.selectedIds.size !== 1) return false;
    const id = Array.from(this.selectedIds)[0];
    const listing = this.listings.find((l) => l.id === id);
    return listing?.status === 1;
  }

  /** EXACTAMENTE uno y su estado es Pausada (status !== 1) */
  get canReactivateSelected(): boolean {
    if (this.selectedIds.size !== 1) return false;
    const id = Array.from(this.selectedIds)[0];
    const listing = this.listings.find((l) => l.id === id);
    return listing?.status !== 1;
  }

  toggleAll(checked: boolean): void {
    this.selectedIds.clear();
    if (checked) this.listings.forEach((l) => this.selectedIds.add(l.id));
    this.selectedIds = new Set(this.selectedIds);
  }

  onCardSelect(id: number, selected: boolean) {
    selected ? this.selectedIds.add(id) : this.selectedIds.delete(id);
    this.selectedIds = new Set(this.selectedIds);
  }

  changeStatus(action: "PAUSE" | "REACTIVATE"): void {
    if (this.selectedIds.size !== 1) return;
    const id = Array.from(this.selectedIds)[0];
    const req: ListingRequestDto = { listingId: id, action };
    this.isPausing = action === 'PAUSE';
    this.isReactivating = action === 'REACTIVATE';

    this.ls.manageListingStatus(req).subscribe({
      next: () => {
        // Actualizo estado local
        const listing = this.listings.find((l) => l.id === id);
        if (listing) {
          listing.status = action === "PAUSE" ? 0 : 1;
        }
        const all = this.allListings.find((l) => l.id === id);
        if (all) {
          all.status = action === "PAUSE" ? 0 : 1;
        }

        // Muestro snackbar con tu componente
        this.snackBar.openFromComponent(ResultSnackbarComponent, {
          data: {
            message:
              action === "PAUSE"
                ? "Publicación pausada correctamente"
                : "Publicación reactivada correctamente",
            status: "success",
          },
          duration: 5000,
          panelClass: "success-snackbar",
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });

        this.selectedIds.clear();
      },
      complete: () => {
        this.isPausing = false;
        this.isReactivating = false;
      },
      error: () => {
        this.isPausing = false;
        this.isReactivating = false;
      }
    });
  }

  /** ELIMINAR una o varias publicaciones */
  deleteSelected(): void {
    if (this.selectedIds.size === 0) return;

    const ids = Array.from(this.selectedIds);
    const calls = ids.map((id) => {
      const req: ListingRequestDto = { listingId: id, action: "DELETE" };
      return this.ls.manageListingStatus(req);
    });

    this.isDeleting = true;
    forkJoin(calls).subscribe({
      next: () => {
        // Quito las tarjetas eliminadas
        this.allListings = this.allListings.filter(
          (l) => !this.selectedIds.has(l.id)
        );
        this.applyFilters();

        // Muestro snackbar con tu componente
        this.snackBar.openFromComponent(ResultSnackbarComponent, {
          data: {
            message: `${ids.length} publicación${
              ids.length > 1 ? "es" : ""
            } eliminada${ids.length > 1 ? "s" : ""} correctamente`,
            status: "success",
          },
          duration: 5000,
          panelClass: "success-snackbar",
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });

        this.selectedIds.clear();
      },
      complete: () => {
        this.isDeleting = false;
      },
      error: () => {
        this.isDeleting = false;
      }
    });
  }
}
