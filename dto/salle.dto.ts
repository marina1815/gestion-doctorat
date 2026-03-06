
export interface CreateSalleDto {
  nomSalle: string;
  capaciteSalle: number;
}

export interface UpdateSalleDto {
  nomSalle?: string;
  capaciteSalle?: number;
}

export interface SalleResponseDto {
  idSalle: string;
  nomSalle: string;
  capaciteSalle: number;
}