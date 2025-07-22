import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { CountryResponseDto, Country } from "../models/country.model";
import { BehaviorSubject, map, Observable, tap } from "rxjs";
import { ResponseDataDto } from "../models/responses.model";

@Injectable({
  providedIn: "root",
})
export class CountryService {
  private baseBackendUrl: string;
  private getCountriesUrl: string;

  constructor(private http: HttpClient) {
    this.baseBackendUrl = "http://localhost:8080/api/privium/countries/";
    this.getCountriesUrl = this.baseBackendUrl + "getCountries";
  }

  getCountries(): Observable<ResponseDataDto<CountryResponseDto[]>> {
    return this.http.post<ResponseDataDto<CountryResponseDto[]>>(
      this.getCountriesUrl,
      {}
    );
  }

  private countriesSubject = new BehaviorSubject<Country[]>([]);
  readonly countries$ = this.countriesSubject.asObservable();

  loadCountries(): Observable<Country[]> {
    return this.http
      .post<ResponseDataDto<CountryResponseDto[]>>(this.getCountriesUrl, {})
      .pipe(
        map((res) => res.data ?? []),
        tap((list) => this.countriesSubject.next(list))
      );
  }

  /** Devuelve la lista cacheada (puede estar vacía si no se ha llamado a loadCountries) */
  getCached(): Country[] {
    return this.countriesSubject.getValue();
  }

  getNameById(id: number): string | null {
    const found = this.getCached().find((c) => c.id === id);
    return found ? found.name : null;
  }
}
