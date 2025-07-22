import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { ResultWarnComponent } from "src/app/shared/components/result-warn/result-warn.component";

import { ResidenceService } from "src/app/shared/services/residence.service";
import { firstValueFrom } from "rxjs";
import {
  ResidenceProof,
  ResidenceProofDto,
} from "src/app/shared/models/ResidenceProof.model";
import { FooterComponent } from "src/app/shared/components/footer/footer.component";
import { HeaderComponent } from "src/app/shared/components/header/header.component";
import { MatDividerModule } from "@angular/material/divider";

@Component({
  selector: "app-residence-verification",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatPaginatorModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ResultWarnComponent,
    FooterComponent,
    HeaderComponent,
    MatDividerModule,
  ],
  templateUrl: "./residence-verification.component.html",
  styleUrls: ["./residence-verification.component.scss"],
})
export class ResidenceVerificationComponent implements OnInit {
  proofs: ResidenceProofDto[] = [];
  pagedProofs: ResidenceProofDto[] = [];

  isLoading = true;
  pageSize = 10;
  pageIndex = 0;
  length = 0;

  /** Estado del result-warn (null = no mostrar) */
  warn: {
    status: 0 | 1;
    title: string;
    subtitle: string;
    description: string;
  } | null = null;

  constructor(private residenceSvc: ResidenceService) {}

  async ngOnInit() {
    await this.loadProofs();
  }

  /* ----------------------------- helpers ----------------------------- */

  async loadProofs() {
    this.isLoading = true;
    try {
      const res = await firstValueFrom(this.residenceSvc.getResidenceProofs());
      this.proofs = res.data ?? [];
      this.length = this.proofs.length;
      this.setPagedData();
    } finally {
      this.isLoading = false;
    }
  }

  setPagedData() {
    const start = this.pageIndex * this.pageSize;
    this.pagedProofs = this.proofs.slice(start, start + this.pageSize);
  }

  pageChange(ev: PageEvent) {
    this.pageIndex = ev.pageIndex;
    this.pageSize = ev.pageSize;
    this.setPagedData();
  }

  /** Descarga el archivo base-64 de la prueba */
  downloadProof(proof: ResidenceProofDto): void {
    if (!proof.proofImageB64) return;

    /* 1) Convertir base-64 a Blob */
    const byteString = atob(proof.proofImageB64);
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "application/octet-stream" });

    /* 2) Crear URL temporal y disparar descarga */
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `residence-proof-${proof.id}.jpg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /* ------------------------- aprobar / rechazar ---------------------- */

  async handleDecision(proof: ResidenceProofDto, approved: boolean) {
    try {
      await firstValueFrom(
        this.residenceSvc.approveResidence(proof.userId, approved)
      );

      // éxito
      this.warn = {
        status: 1,
        title: approved ? "Residencia aprobada" : "Residencia rechazada",
        subtitle: `${proof.name} ${proof.lastName}`,
        description: approved
          ? "La residencia ha sido verificada correctamente."
          : "La residencia fue rechazada.",
      };

      const idx = this.proofs.findIndex((p) => p.id === proof.id);
      if (idx !== -1) {
        this.proofs.splice(idx, 1);
        this.length = this.proofs.length;
      }

      /* ---------- ajustar paginación ---------- */
      const maxPage = Math.max(0, Math.ceil(this.length / this.pageSize) - 1);
      if (this.pageIndex > maxPage) {
        this.pageIndex = maxPage; // retrocede una página si quedaba vacía
      }

      /* ---------- reconstruir la vista ---------- */
      this.setPagedData();
    } catch (err) {
      // error
      this.warn = {
        status: 0,
        title: "Error",
        subtitle: "No se pudo procesar la solicitud",
        description: "Intenta nuevamente.",
      };
    }
  }

  /** Cierra el result-warn */
  closeWarn() {
    this.warn = null;
  }
}
