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
  private approveEndpoint = `${this.baseUrl}/approveResidence`;

  constructor(private http: HttpClient) {}

  getResidenceProofs(): Observable<ResponseDataDto<ResidenceProofDto[]>> {
    return this.http.post<ResponseDataDto<ResidenceProofDto[]>>(this.proofsEndpoint, { });
  }

  approveResidence(
    idUser: number,
    approved: boolean
  ): Observable<ResponseDto> {
    const body = { idUser, approved };
    return this.http.post<ResponseDto>(this.approveEndpoint, body);
  }
}
