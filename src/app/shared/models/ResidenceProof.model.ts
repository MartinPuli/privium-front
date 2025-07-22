export interface ResidenceProof {
  id: number;
  userId: number;
  proofMessage: string | null;
  proofImageB64: string | null;
  createdAt: string; 
}

export interface ResidenceProofDto extends ResidenceProof {
  name: string;
  lastName: string;
  dni: string;
  mail: string;
  countryName: string;
}
