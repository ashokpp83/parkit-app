import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GeocodingService } from '../../core/geocoding.service';
import { ParkingService } from '../../core/parking.service';
import { ServiceBookingService } from '../../core/service-booking.service';
import { SearchComponent } from './search.component';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let geo: jasmine.SpyObj<GeocodingService>;
  let parking: jasmine.SpyObj<ParkingService>;

  beforeEach(() => {
    geo = jasmine.createSpyObj<GeocodingService>('GeocodingService', ['search']);
    parking = jasmine.createSpyObj<ParkingService>('ParkingService', ['vehicles', 'search']);
    parking.vehicles.and.returnValue(of([]));
    parking.search.and.returnValue(of({ items: [], totalCount: 0, page: 1, pageSize: 5000 }));
    TestBed.configureTestingModule({
      providers: [
        SearchComponent,
        { provide: GeocodingService, useValue: geo },
        { provide: ParkingService, useValue: parking },
        { provide: ServiceBookingService, useValue: {} },
      ],
    });
    component = TestBed.inject(SearchComponent);
    component.ngOnInit();
  });

  afterEach(() => component.ngOnDestroy());

  it('searches the typed location only when submitted', () => {
    component.query = 'Chennai';
    expect(geo.search).not.toHaveBeenCalled();
    geo.search.and.returnValue(of([{ displayName: 'Chennai, Tamil Nadu', lat: 13.08, lng: 80.27 }]));
    component.search();
    expect(geo.search).toHaveBeenCalledOnceWith('Chennai', 1);
    expect(parking.search).toHaveBeenCalledWith(13.08, 80.27, 20000, 1, 5000);
    expect(component.placeLabel()).toBe('Chennai, Tamil Nadu');
  });

  it('reports location lookup errors instead of searching the old location', () => {
    component.query = 'Chennai';
    geo.search.and.returnValue(throwError(() => new Error('offline')));
    component.search();
    expect(component.error()).toContain('unavailable');
    expect(component.loading()).toBeFalse();
    expect(parking.search).not.toHaveBeenCalled();
  });
});
