import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

import { RegisterRequest } from "../models/user.model";
import { ResponseDto } from "../models/responses.model";

@Injectable({ providedIn: "root" })
export class ProfileService {
  private baseBackendUrl: string;

  constructor(private http: HttpClient) {
    this.baseBackendUrl = "http://localhost:8080/api/privium/users";
  }


  updateProfile(payload: Partial<RegisterRequest>): Promise<ResponseDto> {
    return firstValueFrom(
      this.http.post<ResponseDto>(`${this.baseBackendUrl}/update`, payload)
    );
  }

  updatePicture(profilePictureB64: string): Promise<ResponseDto> {
    return firstValueFrom(
      this.http.post<ResponseDto>(`${this.baseBackendUrl}/modifyPicture`, {
        profilePicture: profilePictureB64,
      })
    );
  }

  deleteAccount(): Promise<ResponseDto> {
    return firstValueFrom(
      this.http.post<ResponseDto>(`${this.baseBackendUrl}/delete`, null) 
    );
  }
}
