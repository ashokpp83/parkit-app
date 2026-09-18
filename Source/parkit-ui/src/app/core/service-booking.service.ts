import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreateServiceBookingRequest, OwnerServiceBookingDto, ServiceBookingDto } from './models';

@Injectable({ providedIn: 'root' })
export class ServiceBookingService {
  private readonly base = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  list(): Observable<ServiceBookingDto[]> {
    return this.http.get<ServiceBookingDto[]>(`${this.base}/service-bookings`);
  }

  create(payload: CreateServiceBookingRequest): Observable<ServiceBookingDto> {
    return this.http.post<ServiceBookingDto>(`${this.base}/service-bookings`, payload);
  }

  cancel(id: string): Observable<ServiceBookingDto> {
    return this.http.post<ServiceBookingDto>(`${this.base}/service-bookings/${id}/cancel`, {});
  }

  listForFacility(facilityId: string): Observable<OwnerServiceBookingDto[]> {
    return this.http.get<OwnerServiceBookingDto[]>(`${this.base}/service-bookings/facility/${facilityId}`);
  }
}
