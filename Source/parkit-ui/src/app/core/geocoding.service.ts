import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface GeoPlace {
  displayName: string;
  lat: number;
  lng: number;
}

/**
 * Free, open-source geocoding via OpenStreetMap Nominatim.
 * No API key, no billing. Same OSM ecosystem as the Leaflet map tiles.
 * Nominatim usage policy: <=1 req/sec — we debounce calls in the UI.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly base = 'https://nominatim.openstreetmap.org';
  constructor(private http: HttpClient) {}

  /** Turn a typed address / place name into candidate locations. */
  search(query: string, limit = 5): Observable<GeoPlace[]> {
    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('q', query)
      .set('addressdetails', '1')
      .set('limit', limit)
      // Bias toward India (the app's target market) but still allow global hits.
      .set('countrycodes', 'in');
    return this.http
      .get<any[]>(`${this.base}/search`, { params })
      .pipe(map((rows) => rows.map(this.toPlace)));
  }

  /** Turn coordinates (e.g. from browser geolocation) back into an address. */
  reverse(lat: number, lng: number): Observable<GeoPlace> {
    const params = new HttpParams()
      .set('format', 'jsonv2')
      .set('lat', lat)
      .set('lon', lng);
    return this.http
      .get<any>(`${this.base}/reverse`, { params })
      .pipe(map(this.toPlace));
  }

  private toPlace = (r: any): GeoPlace => ({
    displayName: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  });
}
