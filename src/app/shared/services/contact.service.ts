import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ResponseDto } from '../models/responses.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private baseUrl = `${environment.apiBaseUrl}/contact/send`;

  constructor(private http: HttpClient) {}

  send(payload: { messageHeader: string; message: string }): Promise<ResponseDto> {
    return firstValueFrom(this.http.post<ResponseDto>(this.baseUrl, payload));
  }
}
