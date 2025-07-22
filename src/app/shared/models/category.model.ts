export interface CategoryRequestDto {
  rootId?: string
  leafId?: string
}

export interface CategoryResponseDto {
  id: string
  name: string
  hasChild: number
}

export interface Category {
  id: string
  name: string
  hasChild: number
}
