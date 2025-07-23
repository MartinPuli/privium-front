import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";

import {
  ListingResponseDto,
  ListingInfoResponseDto,
  ListingRequestDto,
  EditPayload,
} from "src/app/shared/models/listing.model";
import { ListingService } from "src/app/shared/services/listing.service";
import { ResultSnackbarComponent } from "src/app/shared/components/result-snackbar/result.snackbar.component";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { EditPublicationComponent } from "../edit-publication/edit-publication.component";
import { MatIconModule } from "@angular/material/icon";
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from "@angular/material/checkbox";
import { DefaultImageDirective } from "src/app/shared/directives/default-image.directive";

@Component({
  selector: "app-publication-card",
  templateUrl: "./publication-card.component.html",
  styleUrls: ["./publication-card.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    EditPublicationComponent,
    MatIconModule,
    MatCheckboxModule,
    DefaultImageDirective,
  ],
})
export class PublicationCardComponent {
  @Input({ required: true }) listing!: ListingResponseDto;
  @Output() reload = new EventEmitter<void>();
  @Input() selected = false;
  @Output() selectionChange = new EventEmitter<boolean>();
  @Output() listingModified = new EventEmitter<boolean>();

  editingSide: "left" | "right" | null = null; // qué modal mostrar
  fullData!: ListingInfoResponseDto; // info extra (cats + imgs)

  constructor(private listingSrv: ListingService, private sb: MatSnackBar) {}

  /* ----------------------------------------------------- abrimos modal */
  openEdit(side: "left" | "right") {

    this.listingSrv.getListingInfo(this.listing.id).subscribe({
      next: ({ data }) => {
        this.fullData = data!;
        this.editingSide = side;
      },
    });
  }

  onSave(payload: EditPayload): void {
    const { dto, mainImageFile, auxFiles } = payload;
    this.listingSrv.editListing(dto, mainImageFile!, auxFiles!).subscribe({
      next: () => {
        /* snackbar de éxito */
        this.sb.openFromComponent(ResultSnackbarComponent, {
          data: { message: "¡Publicación modificada!", status: "success" },
          duration: 4000,
          panelClass: "success-snackbar",
          horizontalPosition: "center",
          verticalPosition: "bottom",
        });

        /* cerrar modal y refrescar la grilla */
        this.editingSide = null;
        this.reload.emit(); // el padre ejecuta listListings()
      },
    });
  }

  onCheckboxChange(e: MatCheckboxChange): void {
    this.selectionChange.emit(e.checked);
  }

  onListingModified(): void {
    this.listingModified.emit(true);
  }

  /* ----------------------------------------------------- cancelar modal */
  closeModal(): void {
    this.editingSide = null;
  }
}
