import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  //#region [Properties]
  private readonly _API = environment.API_URL;
  private readonly _API_KEY = environment.API_KEY;
  private readonly _CATEGORIES: string[] = ['business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology'];
  //#endregion

  constructor(private readonly _http: HttpClient) { }

  //#region [Endpoints]
  getCategories(): Observable<string[]> {
    return of(this._CATEGORIES);
  }

  getSources(): Observable<any> {
    const PARAMS = new HttpParams()
      .set('apiKey', this._API_KEY);
    return this._http.get<any>(`${this._API}top-headlines/sources`, { params: PARAMS });
  }

  getNews(sources: string[], page: number, from: string = '', to: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('sources', sources.join(','))
      .set('page', page)
      .set('apiKey', this._API_KEY);

    if (from) {
      params = params
        .append('from', from)
        .append('to', to);
    }

    return this._http.get<any>(`${this._API}everything`, { params: params });
  }
  //#endregion

}
