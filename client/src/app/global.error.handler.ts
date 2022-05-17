import { ErrorHandler, Injectable } from '@angular/core';
import { ApplicationService } from './application.service';
@Injectable({ providedIn: 'root' })
export class GlobalErrorHandler implements ErrorHandler {
    constructor(public api: ApplicationService) { }
    async handleError(error: Error) {
        if ((error as any).error) error.message = (error as any).error.message || (error as any).error;
        error.message = error.message
            .replace(/(?:^|.+\n)Error: (.+?)(\n.*|$)/s, '$1')
            .replace(/^Uncaught \(in promise\): (.+?)\n.+/s, '$1')
            .replace(/^Uncaught \(in promise\): HttpErrorResponse: ({.+})$/, (_, json) => {
                return JSON.stringify(JSON.parse(json)?.error?.message || JSON.parse(json)?.error || JSON.parse(json)?.message)
            });
        if (/NG0100|Cannot read.*initialize/.test(error.message)) return;
        this.api.errors$.next([error, ...this.api.errors$.value]);
        console.error(error);
        debugger;
    }
}
