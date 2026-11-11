import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let requests: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('parkit.access', 'expired');
    localStorage.setItem('parkit.refresh', 'refresh-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    requests.verify();
    localStorage.clear();
  });

  it('does not send credentials to the geocoding service', () => {
    http.get('https://nominatim.openstreetmap.org/search').subscribe();
    const request = requests.expectOne('https://nominatim.openstreetmap.org/search');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });

  it('refreshes an expired session and retries the vehicle request', () => {
    let result: unknown;
    http.get(`${environment.apiBaseUrl}/vehicles`).subscribe((value) => result = value);
    const first = requests.expectOne(`${environment.apiBaseUrl}/vehicles`);
    expect(first.request.headers.get('Authorization')).toBe('Bearer expired');
    first.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = requests.expectOne(`${environment.apiBaseUrl}/auth/refresh`);
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-token' });
    refresh.flush({ accessToken: 'new-access', refreshToken: 'new-refresh', user: { id: '1' } });

    const retry = requests.expectOne(`${environment.apiBaseUrl}/vehicles`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush([{ registrationNumber: 'TN 01' }]);
    expect(result).toEqual([{ registrationNumber: 'TN 01' }]);
  });

  it('shares one refresh request between simultaneous expired API requests', () => {
    http.get(`${environment.apiBaseUrl}/vehicles`).subscribe();
    http.get(`${environment.apiBaseUrl}/bookings`).subscribe();
    requests.expectOne(`${environment.apiBaseUrl}/vehicles`).flush({}, { status: 401, statusText: 'Unauthorized' });
    requests.expectOne(`${environment.apiBaseUrl}/bookings`).flush({}, { status: 401, statusText: 'Unauthorized' });
    const refresh = requests.expectOne(`${environment.apiBaseUrl}/auth/refresh`);
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-token' });
    refresh.flush({ accessToken: 'new-access', refreshToken: 'new-refresh', user: { id: '1' } });
    requests.expectOne(`${environment.apiBaseUrl}/vehicles`).flush([]);
    requests.expectOne(`${environment.apiBaseUrl}/bookings`).flush([]);
  });
});
