import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDataDto, ResponseDto } from '../models/responses.model';
import { ResidenceProofDto } from '../models/ResidenceProof.model';

@Injectable({
  providedIn: 'root',
})
export class ResidenceService {
  private baseUrl = 'http://localhost:8080/api/privium/residence';
  private proofsEndpoint = `${this.baseUrl}/proofs`;

  constructor(private http: HttpClient) {}

  getResidenceProofs(): Observable<ResponseDataDto<ResidenceProofDto[]>> {
    return this.http.post<ResponseDataDto<ResidenceProofDto[]>>(this.proofsEndpoint, { });
  }

}
