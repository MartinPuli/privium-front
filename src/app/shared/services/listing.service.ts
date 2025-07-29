import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  ListingRequestDto,
  ListListingsRequestDto,
  ListingResponseDto,
  ListingInfoResponseDto,
} from "../models/listing.model";
import { ResponseDto, ResponseDataDto } from "../models/responses.model";
import { AuthService } from "./auth.service";
import { lastValueFrom, firstValueFrom, map, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ListingService {
  private readonly base = "http://localhost:8080/api/privium/listings/";

  constructor(private http: HttpClient, private auth: AuthService) {}

  /* ───────────── Obtener publicaciones ───────────── */
  listListings(opts: Partial<ListListingsRequestDto> = {}) {
    const body: ListListingsRequestDto = {
      sortOrder: opts.sortOrder ?? "DESC",
      page: opts.page ?? 1,
      pageSize: opts.pageSize ?? 20,
      ...opts,
    };
    return this.http.post<ResponseDataDto<ListingResponseDto[]>>(
      this.base + "listListings",
      body
    );
  }

  /* ───────────── Detalle de una publicación ───────────── */
  getListingInfo(
    listingId: number
  ): Observable<ResponseDataDto<ListingInfoResponseDto>> {
    return this.http.get<ResponseDataDto<ListingInfoResponseDto>>(
      `${this.base}info/${listingId}`
    );
  }

  /* ───────────── Alta de publicación ───────────── */
  addListing(
    dto: ListingRequestDto,
    mainImageFile: File,
    auxFiles: File[] = []
  ): Observable<ResponseDataDto<ListingResponseDto>> {
    const form = new FormData();

    form.append(
      "data",
      new Blob([JSON.stringify(dto)], { type: "application/json" })
    );
    form.append("mainImage", mainImageFile, mainImageFile.name);
    auxFiles.slice(0, 4).forEach((f) => form.append("images", f, f.name));

    return this.http.post<ResponseDataDto<ListingResponseDto>>(
      this.base + "addListing",
      form
    );
  }

  /** ───────────── Edición de publicación con archivos ───────────── */
  editListing(
    dto: ListingRequestDto,
    mainImageFile?: File | null,
    auxFiles: File[] | null = []
  ): Observable<ResponseDto> {
    const form = new FormData();

    // 1) JSON con el DTO
    form.append(
      "data",
      new Blob([JSON.stringify(dto)], { type: "application/json" })
    );

    // 2) Imagen principal (si viene)
    if (mainImageFile) {
      form.append("mainImage", mainImageFile, mainImageFile.name);
    }

    // 3) Imágenes auxiliares numeradas (hasta 4)
    if (auxFiles && auxFiles.length) {
      auxFiles.slice(0, 4).forEach((f, idx) => {
        if (f) {
          form.append(`image${idx + 1}`, f, f.name);
        }
      });
    }

    // 4) Post multipart/form-data
    return this.http.post<ResponseDto>(`${this.base}editListing`, form);
  }

  /* ───────────── Cambio de estado (pausar / reactivar / eliminar) ───────────── */
  manageListingStatus(req: ListingRequestDto): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(this.base + "listingStatus", req);
  }

  /* ---------- helpers usados solo por Home (sin cambios) ---------- */

  async getNeighborhoodProducts(
    page = 1,
    pageSize = 3,
    maxKm = 10
  ): Promise<{ products: ListingResponseDto[]; hasMore: boolean }> {
    const resp = await lastValueFrom(
      this.listListings({
        centerCountryId: this.auth.getCurrentCountryId()!,
        maxDistanceKm: maxKm,
        page,
        pageSize,
        notShownUser: this.auth.getCurrentUserId()!,
      })
    );
    const products = resp.data!;
    return { products, hasMore: products.length === pageSize };
  }

  async getProductsByCategory(
    categoryIds: string[],
    page = 1,
    pageSize = 4
  ): Promise<{ products: ListingResponseDto[]; hasMore: boolean }> {
    const resp = await lastValueFrom(
      this.listListings({
        categoryIds,
        page,
        pageSize,
        notShownUser: this.auth.getCurrentUserId()!,
      })
    );
    const products = resp.data!;
    return { products, hasMore: products.length === pageSize };
  }

  async getProductsByType(
    type: string,
    page = 1,
    pageSize = 4
  ): Promise<{ products: ListingResponseDto[]; hasMore: boolean }> {
    const resp = await lastValueFrom(
      this.listListings({
        type: type,
        page,
        pageSize,
        notShownUser: this.auth.getCurrentUserId()!,
      })
    );
    const products = resp.data ?? [];
    return { products, hasMore: products.length === pageSize };
  }

  /**
   * Envía al backend un mensaje para solicitar la eliminación de una
   * publicación. El backend se encargará de notificar al usuario dueño
   * de la misma por email.
   */
  sendDeleteMessage(payload: {
    listingId: number;
    userId: number;
    message: string;
  }): Promise<ResponseDto> {
    return firstValueFrom(
      this.http.post<ResponseDto>(this.base + 'deleteMessage', payload)
    );
  }
}
