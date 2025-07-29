// DTOs actualizados según el backend
export interface ListListingsRequestDto {
  userId?: number;
  status?: number;
  searchTerm?: string;
  createdFrom?: string; // ISO 8601 datetime
  createdTo?: string; // ISO 8601 datetime
  categoryIds?: string[]; // CSV de IDs de categoría, tal como los envías al SP
  sortOrder?: "ASC" | "DESC";
  // Filtros geográficos
  countryId?: number;
  centerCountryId?: number;
  maxDistanceKm?: number;
  // Filtros de producto
  conditionFilter?: number; // 1=usado,2=nuevo
  brandFilter?: string;
  listingId?: number;

  type?: string;
  // Medios de pago
  acceptsBarter?: boolean;
  acceptsCash?: boolean;
  acceptsTransfer?: boolean;
  acceptsCard?: boolean;
  // Rango de precio
  minPrice?: number;
  maxPrice?: number;
  // Excluir publicaciones de un usuario
  notShownUser?: number;
  // Paginación
  page?: number;
  pageSize?: number;
}

export interface ListingResponseDto {
  id: number;
  title: string;
  description: string;
  price: number;
  acceptsBarter: boolean;
  acceptsCash: boolean;
  acceptsTransfer: boolean;
  acceptsCard: boolean;
  type: string;
  brand?: string;
  userId: number;
  mainImage: string;
  status: number;
  condition?: number;
  createdAt: string;
  countryId: number;
}

export interface ListingInfoResponseDto {
  categories: ListingCategoryResponseDto[];
  auxiliaryImages: ListingImageResponseDto[];
}

export interface ListingCategoryResponseDto {
  categoryId: string;
  description: string;
}

export interface ListingImageResponseDto {
  imgNumber: number;
  imgUrl: string;
}

export interface ProductDetail extends ListingResponseDto, ListingInfoResponseDto {}

export interface EditPayload {
  dto: ListingRequestDto;
  mainImageFile: File | null;
  auxFiles: (File | null)[] | null;
}

export interface ListingRequestDto {
  listingId?: number;
  title?: string;
  description?: string;
  price?: number;
  mainImage?: File | string | null;
  acceptsBarter?: boolean;
  acceptsCash?: boolean;
  acceptsTransfer?: boolean;
  acceptsCard?: boolean;
  type?: string;
  categoriesId?: string[];
  imagesUrl?: File[] | string[] | null;
  condition?: number;
  brand?: string;
  action?: string;
}


export interface ListingAdminRequestDto {
  listingId: number;
  ownerId: number;
  message: string;
}
