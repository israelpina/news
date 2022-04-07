import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  //#region [Properties]
  private readonly _API = environment.API_URL;
  private readonly _CATEGORIES: string[] = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
  //#endregion

  constructor(private readonly _http: HttpClient) { }

  //#region [Endpoints]
  getCategories(): Observable<string[]> {
    return of(this._CATEGORIES);
  }

  getSources(): Observable<any> {
    return this._http.get<any>(`${this._API}top-headlines/sources`);
  }

  getNews(sources: string[], page: number, from: string = '', to: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('sources', sources.join(','))
      .set('page', page);

    if (from) {
      params = params
        .append('from', from)
        .append('to', to);
    }

    return this._http.get<any>(`${this._API}everything`, { params: params });
  }
  //#endregion

}
