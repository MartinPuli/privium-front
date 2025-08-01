export interface Parameter {
  name: string;
}

export interface ErrorMessage {
  code: string;
  message: string;
  type: string;
  parameters?: Parameter[];
}

export interface ResponseDataDto<T = unknown> {
  code?: number;
  description?: string;
  data?: T;
  messages?: ErrorMessage[];
}

export interface ResponseDto {
  code: string
  description: string
  success?: boolean
}


