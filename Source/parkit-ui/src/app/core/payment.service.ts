import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AddPaymentMethodRequest, SavedPaymentMethodDto } from './models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly base = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  list(): Observable<SavedPaymentMethodDto[]> {
    return this.http.get<SavedPaymentMethodDto[]>(`${this.base}/payment-methods`);
  }

  add(payload: AddPaymentMethodRequest): Observable<SavedPaymentMethodDto> {
    return this.http.post<SavedPaymentMethodDto>(`${this.base}/payment-methods`, payload);
  }

  setDefault(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/payment-methods/${id}/default`, {});
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/payment-methods/${id}`);
  }
}
