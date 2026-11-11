import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ParkingService } from '../../core/parking.service';
import { VehicleType } from '../../core/models';
import { VehiclesComponent } from './vehicles.component';

describe('VehiclesComponent', () => {
  let parking: jasmine.SpyObj<ParkingService>;

  beforeEach(() => {
    parking = jasmine.createSpyObj<ParkingService>('ParkingService', ['vehicles', 'addVehicle', 'updateVehicle', 'deleteVehicle']);
    parking.vehicles.and.returnValue(of([]));
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ParkingService, useValue: parking }],
    });
  });

  it('adds a car and displays the saved registration', () => {
    const vehicle = { id: '1', registrationNumber: 'TN 01 AB 1234', type: VehicleType.Sedan, isVerified: false };
    parking.addVehicle.and.returnValue(of(vehicle));
    const fixture = TestBed.createComponent(VehiclesComponent);
    fixture.detectChanges();
    parking.vehicles.and.returnValue(of([vehicle]));
    fixture.componentInstance.form.registrationNumber = vehicle.registrationNumber;
    fixture.nativeElement.querySelector('button.primary').click();
    fixture.detectChanges();
    expect(parking.addVehicle).toHaveBeenCalledOnceWith({
      registrationNumber: vehicle.registrationNumber, type: VehicleType.Sedan,
      length: null, width: null, height: null,
    });
    expect(fixture.nativeElement.textContent).toContain(vehicle.registrationNumber);
    expect(fixture.componentInstance.success()).toContain('added');
  });

  it('shows a server error rather than reporting a successful save', () => {
    parking.addVehicle.and.returnValue(throwError(() => ({ error: { error: { message: 'Duplicate vehicle.' } } })));
    const component = TestBed.createComponent(VehiclesComponent).componentInstance;
    component.form.registrationNumber = 'TN 01 AB 1234';
    component.submit();
    expect(component.error()).toBe('Duplicate vehicle.');
    expect(component.success()).toBeNull();
    expect(component.loading()).toBeFalse();
  });
});
