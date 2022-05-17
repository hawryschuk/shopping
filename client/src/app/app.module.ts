import { ErrorHandler, NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SignupComponent } from './signup/signup.component';
import { DocsComponent } from './docs/docs.component';
import { LoginComponent } from './login/login.component';
import { UsersComponent } from './users/users.component';
import { StoresComponent } from './stores/stores.component';
import { ClarityModule } from '@clr/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreComponent } from './store/store.component';
import { DebugComponent } from './debug/debug.component';
import { MarkdownModule, MarkedOptions, MarkedRenderer } from 'ngx-markdown';
import { GlobalErrorHandler } from './global.error.handler';
import { CartComponent } from './cart/cart.component';
import { PurchasesComponent } from './purchases/purchases.component';
import { ScrollDirective } from './scroll.directive';

@NgModule({
  declarations: [
    AppComponent,
    SignupComponent,
    DocsComponent,
    LoginComponent,
    UsersComponent,
    StoresComponent,
    StoreComponent,
    DebugComponent,
    CartComponent,
    PurchasesComponent,
    ScrollDirective,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ClarityModule,
    BrowserAnimationsModule,
    MarkdownModule.forRoot({
      loader: HttpClient,
      markedOptions: {
        provide: MarkedOptions,
        useValue: {
          renderer: Object.assign(new MarkedRenderer(), {
            // heading: (text, level) => {
            //   const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
            //   return '<h' + level + '>' +
            //     '<a name="' + escapedText + '" class="anchor" href="#' + escapedText + '">' +
            //     '<span class="header-link"></span>' +
            //     '</a>' + text +
            //     '</h' + level + '>';

            //   const html = `<a name="${text.replace(/ /g, '-').replace(/[^ A-Z0-9]/ig, '').toLowerCase()}"></a><h${level}>${text}</h${level}>`;
            //   return html;
            // },
            html: html => html
              .replace(/src=".\//g, 'src="assets/'),
            code: (code = '', language = '') =>
              language.match(/^mermaid/)
                ? `<pre class="mermaid">${code}</pre>`
                : `<pre><code>${code}</code></pre>`
          }),
          gfm: true,
          breaks: false,
          pedantic: false,
          smartLists: true,
          smartypants: false
          // tables: true,
          // sanitize: false,
        },
      },
    })
  ],
  providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
