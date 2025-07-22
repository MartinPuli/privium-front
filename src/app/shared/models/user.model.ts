export interface User {
  id: number
  name: string
  lastname: string
  email: string
  passwordHash?: string
  dni?: string
  contactPhone?: string
  verifiedEmail: boolean
  verifiedResidence: boolean
  countryId: number;
  profilePicture?: string
  createdAt: string
  status: number
  role?: string
}

export interface Country {
  id: number
  name: string
  province?: string
  city?: string
  postalCode?: string
  latitude?: number
  longitude?: number
}

export interface UserRequestDto {
  // Para verificar residencia
  idUser?: number
  // Campos para registro
  name?: string
  lastname?: string
  email?: string
  password?: string
  dni?: string
  phone?: string
  countryId?: number
  // Para prueba de residencia
  proofMessage?: string
  proofImageBase64?: string
  // Para verificación de email/proof
  token?: string
  approved?: boolean
  // Para reset password
  newPassword?: string
  // Para modificar profile picture
  profilePicture?: string
  // Para admin
  idAdmin?: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  lastname: string
  email: string
  password: string
  dni: string
  phone: string
  countryId: number
  proofMessage?: string
  proofImageBase64?: string
}

export interface VerificationRequest {
  idUser: number
  proofMessage: string
  proofImageBase64: string
}
