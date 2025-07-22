// Step 1: Type Selection Data
export interface PublishStep1Data {
  type: "PRODUCTO" | "VEHICULO" | "INMUEBLE" | "MUEBLE" | "SERVICIO" | null
}

// Step 2: Product Details Data (removed stock, color, model)
export interface PublishStep2Data {
  title: string
  description: string
  brand?: string
  condition: "Nuevo" | "Usado" | null
  images: ImageFile[]
}

// Step 3: Commercial Information Data
export interface PublishStep3Data {
  price: number | null
  acceptsCash: boolean
  acceptsCard: boolean
  acceptsTransfer: boolean
  acceptsBarter: boolean
}

// Complete Publish Data
export interface CompletePublishData {
  step1: PublishStep1Data
  step2: PublishStep2Data
  step3: PublishStep3Data
}

// Image File Interface
export interface ImageFile {
  file: File
  preview: string
  url?: string
  name: string
  size: number
  type: string
}

// Form Section States
export interface SectionState {
  title: boolean
  description: boolean
  characteristics: boolean
  condition: boolean
  photos: boolean
  price: boolean
  payment: boolean
}

// Validation States
export interface ValidationState {
  step1Valid: boolean
  step2Valid: boolean
  step3Valid: boolean
  currentStepValid: boolean
}

// Available Options (simplified)
export interface PublishOptions {
  conditions: { value: string; label: string }[]
}

// Type Configuration
export interface TypeConfig {
  id: string
  name: string
  icon: string
  showCharacteristics: boolean
  showCondition: boolean
  requiredFields: string[]
  categoryMapping: string
}

// Progress Tracking
export interface PublishProgress {
  currentStep: number
  totalSteps: number
  completedSections: string[]
  isPublishing: boolean
  hasUnsavedChanges: boolean
}
