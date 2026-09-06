import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .then(() => registerServiceWorker())
  .catch((err) => console.error(err));

function registerServiceWorker(): void {
  const isSecureContext =
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if ('serviceWorker' in navigator && isSecureContext) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('sw.js');
    });
  }
}
