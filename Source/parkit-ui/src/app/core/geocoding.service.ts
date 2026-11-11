import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GeoPlace {
  displayName: string;
  lat: number;
  lng: number;
}

interface NominatimPlace {
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly base = `${environment.apiBaseUrl}/geocoding`;
  constructor(private http: HttpClient) {}

  /** Turn a typed address / place name into candidate locations. */
  search(query: string, limit = 5): Observable<GeoPlace[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit);
    return this.http
      .get<NominatimPlace[]>(`${this.base}/search`, { params })
      .pipe(map((rows) => rows.map(this.toPlace)));
  }

  /** Turn coordinates (e.g. from browser geolocation) back into an address. */
  reverse(lat: number, lng: number): Observable<GeoPlace> {
    const params = new HttpParams()
      .set('lat', lat)
      .set('lng', lng);
    return this.http
      .get<NominatimPlace>(`${this.base}/reverse`, { params })
      .pipe(map(this.toPlace));
  }

  private toPlace = (r: NominatimPlace): GeoPlace => ({
    displayName: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  });
}
