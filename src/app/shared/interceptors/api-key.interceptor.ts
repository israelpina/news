import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable()
export class ApiKeyInterceptor implements HttpInterceptor {

  private readonly _API_KEY = environment.API_KEY;

  constructor() { }

  public intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const CLONE_REQUEST = request.clone({
      params: request.params.appendAll({
        'apiKey': this._API_KEY
      })
    });

    return next.handle(CLONE_REQUEST);
  }
}
