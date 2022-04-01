import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class NewsletterService {

  constructor(private readonly _http: HttpClient) {

  }

  addPushSubscriber(sub: any) {
    console.log(sub);
    return this._http.post('/api/notifications', sub);
  }

  send() {
    return this._http.post('/api/newsletter', null);
  }

}
