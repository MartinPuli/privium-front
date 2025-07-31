import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../models/responses.model';
import { ListingAdminRequestDto } from '../models/listing.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  approveResidence(idUser: number, approved: boolean): Observable<ResponseDto> {
    const body = { idUser, approved };
    return this.http.post<ResponseDto>(`${this.base}/approveResidence`, body);
  }

  deleteListing(payload: ListingAdminRequestDto): Observable<ResponseDto> {
    return this.http.post<ResponseDto>(`${this.base}/deleteListing`, payload);
  }
}
