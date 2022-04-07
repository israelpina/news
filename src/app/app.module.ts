import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { environment } from '../environments/environment.prod';
import { ServiceWorkerModule } from '@angular/service-worker';

import { MaterialModule } from '../material.module';
import { DigitOnlyModule } from '@uiowa/digit-only';


import { AppComponent } from './app.component';
import { SelectComponent } from './components/select/select.component';
import { ArticleCardComponent } from './components/article-card/article-card.component';
import { DataService } from './services/data.service';
import { NewsletterService } from './services/newsletter.service';
import { ApiKeyInterceptor } from './shared/interceptors/api-key.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    SelectComponent,
    ArticleCardComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    DigitOnlyModule,
    FlexLayoutModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // // Register the ServiceWorker as soon as the application is stable
      // // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
  providers: [
    DataService,
    NewsletterService,
    { provide: HTTP_INTERCEPTORS, useClass: ApiKeyInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
