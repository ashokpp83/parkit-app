import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  BookingDto,
  FacilityDetailDto,
  FacilityCreateRequest,
  FacilityServiceDto,
  FacilitySummaryDto,
  PagedResult,
  PaymentMethod,
  SpaceSearchResult,
  SpaceAvailabilityDto,
  UpsertFacilityServicesRequest,
  UpsertVehicleRequest,
  VehicleDto,
  OwnerDashboardStatisticsDto,
} from './models';

export interface UploadPhotoRequest {
  fileName: string;
  base64Data: string;
}

@Injectable({ providedIn: 'root' })
export class ParkingService {
  private readonly base = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  search(lat: number, lng: number, radiusKm = 3, page = 1, pageSize = 20): Observable<PagedResult<SpaceSearchResult>> {
    const params = new HttpParams()
      .set('lat', lat)
      .set('lng', lng)
      .set('radiusKm', radiusKm)
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<PagedResult<SpaceSearchResult>>(`${this.base}/parking/search`, { params });
  }

  vehicles(): Observable<VehicleDto[]> {
    return this.http.get<VehicleDto[]>(`${this.base}/vehicles`);
  }

  addVehicle(payload: UpsertVehicleRequest): Observable<VehicleDto> {
    return this.http.post<VehicleDto>(`${this.base}/vehicles`, payload);
  }

  updateVehicle(id: string, payload: UpsertVehicleRequest): Observable<VehicleDto> {
    return this.http.put<VehicleDto>(`${this.base}/vehicles/${id}`, payload);
  }

  deleteVehicle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/vehicles/${id}`);
  }

  book(spaceId: string, vehicleId: string, startTime: string, endTime: string): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${this.base}/bookings`, { spaceId, vehicleId, startTime, endTime });
  }

  pay(bookingId: string, method: PaymentMethod): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${this.base}/bookings/${bookingId}/pay`, { method });
  }

  myBookings(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.base}/bookings`);
  }

  ownerBookings(): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.base}/bookings/owner`);
  }

  cancel(id: string): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${this.base}/bookings/${id}/cancel`, {});
  }

  createFacility(payload: FacilityCreateRequest): Observable<FacilitySummaryDto> {
    return this.http.post<FacilitySummaryDto>(`${this.base}/parking/facilities`, payload);
  }

  updateFacility(id: string, payload: FacilityCreateRequest): Observable<FacilitySummaryDto> {
    return this.http.put<FacilitySummaryDto>(`${this.base}/parking/facilities/${id}`, payload);
  }

  myFacilities(): Observable<FacilitySummaryDto[]> {
    return this.http.get<FacilitySummaryDto[]>(`${this.base}/parking/facilities/my`);
  }

  getFacility(id: string): Observable<FacilityDetailDto> {
    return this.http.get<FacilityDetailDto>(`${this.base}/parking/facilities/${id}`);
  }

  facility(id: string): Observable<FacilityDetailDto> {
    return this.http.get<FacilityDetailDto>(`${this.base}/parking/facilities/${id}`);
  }

  availability(spaceId: string): Observable<SpaceAvailabilityDto> {
    return this.http.get<SpaceAvailabilityDto>(`${this.base}/parking/spaces/${spaceId}/availability`);
  }

  uploadFacilityPhoto(facilityId: string, payload: UploadPhotoRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/parking/facilities/${facilityId}/photos`, payload);
  }

  deleteFacilityPhoto(photoId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/parking/photos/${photoId}`);
  }

  ownerDashboardStatistics(): Observable<OwnerDashboardStatisticsDto> {
    return this.http.get<OwnerDashboardStatisticsDto>(`${this.base}/parking/owner/dashboard/statistics`);
  }

  facilityServices(facilityId: string): Observable<FacilityServiceDto[]> {
    return this.http.get<FacilityServiceDto[]>(`${this.base}/parking/facilities/${facilityId}/services`);
  }

  facilityServicesForOwner(facilityId: string): Observable<FacilityServiceDto[]> {
    return this.http.get<FacilityServiceDto[]>(`${this.base}/parking/facilities/${facilityId}/services/manage`);
  }

  upsertFacilityServices(facilityId: string, payload: UpsertFacilityServicesRequest): Observable<FacilityServiceDto[]> {
    return this.http.put<FacilityServiceDto[]>(`${this.base}/parking/facilities/${facilityId}/services`, payload);
  }
}
