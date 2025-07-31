import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDataDto, ResponseDto } from '../models/responses.model';
import { ResidenceProofDto } from '../models/ResidenceProof.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ResidenceService {
  private baseUrl = `${environment.apiBaseUrl}/residence`;
  private proofsEndpoint = `${this.baseUrl}/proofs`;

  constructor(private http: HttpClient) {}

  getResidenceProofs(): Observable<ResponseDataDto<ResidenceProofDto[]>> {
    return this.http.post<ResponseDataDto<ResidenceProofDto[]>>(this.proofsEndpoint, { });
  }

}
