import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ResponseDto } from '../models/responses.model';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private baseUrl = 'http://localhost:8080/api/privium/contact/send';

  constructor(private http: HttpClient) {}

  send(payload: { header: string; message: string }): Promise<ResponseDto> {
    return firstValueFrom(this.http.post<ResponseDto>(this.baseUrl, payload));
  }
}
