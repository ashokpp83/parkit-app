import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { AuthResponse, UserRole } from '../../core/models';
import { ForgotPasswordComponent } from './forgot-password.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register.component';
import { ResetPasswordComponent } from './reset-password.component';

describe('account forms', () => {
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'register', 'forgotPassword', 'resetPassword', 'logout']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
  });

  function passwordToggle<T>(fixture: ComponentFixture<T>, inputSelector: string): void {
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const input = root.querySelector<HTMLInputElement>(inputSelector)!;
    const toggle = root.querySelector<HTMLButtonElement>('.password-toggle')!;
    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Show password');
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Hide password');
    toggle.click();
    fixture.detectChanges();
    expect(input.type).toBe('password');
  }

  it('toggles password visibility on login and registration', () => {
    passwordToggle(TestBed.createComponent(LoginComponent), 'input[name="password"]');
    passwordToggle(TestBed.createComponent(RegisterComponent), 'input[name="password"]');
  });

  it('registers a car owner and navigates to search', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const response: AuthResponse = {
      accessToken: 'access', refreshToken: 'refresh', accessTokenExpiresAt: '2027-01-01T00:00:00Z',
      user: {
        id: '1', fullName: 'Test Driver', email: 'driver@example.test', phoneNumber: '1234567890',
        role: UserRole.Driver, kycStatus: 0, phoneVerified: false, reliabilityScore: 100, preferredLanguage: 'en',
      },
    };
    auth.register.and.returnValue(of(response));
    component.fullName = 'Test Driver';
    component.email = 'driver@example.test';
    component.phoneNumber = '1234567890';
    component.password = 'Password1!';
    component.submit();
    expect(auth.register).toHaveBeenCalledOnceWith({
      fullName: 'Test Driver', email: 'driver@example.test', phoneNumber: '1234567890',
      password: 'Password1!', role: UserRole.Driver,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/search']);
  });

  it('shows registration errors and allows retry', () => {
    const component = TestBed.createComponent(RegisterComponent).componentInstance;
    auth.register.and.returnValue(throwError(() => ({ error: { error: { message: 'Already registered.' } } })));
    component.fullName = 'Test';
    component.email = 'driver@example.test';
    component.phoneNumber = '1234567890';
    component.password = 'Password1!';
    component.submit();
    expect(component.error()).toBe('Already registered.');
    expect(component.loading()).toBeFalse();
  });

  it('requests a recovery link and reports rate limits', () => {
    const component = TestBed.createComponent(ForgotPasswordComponent).componentInstance;
    component.email = ' driver@example.test ';
    auth.forgotPassword.and.returnValue(of({ message: 'Check your email.' }));
    component.submit();
    expect(auth.forgotPassword).toHaveBeenCalledOnceWith('driver@example.test');
    expect(component.message()).toBe('Check your email.');
    auth.forgotPassword.and.returnValue(throwError(() => ({ status: 429 })));
    component.submit();
    expect(component.error()).toContain('Too many attempts');
    expect(component.loading()).toBeFalse();
  });

  it('validates matching passwords before sending a reset request', () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: { snapshot: { fragment: 'reset-token' } } });
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    const component = fixture.componentInstance;
    passwordToggle(fixture, '#new-password');
    component.password = 'Password1!';
    component.confirmPassword = 'different';
    component.submit();
    expect(auth.resetPassword).not.toHaveBeenCalled();
    expect(component.error()).toContain('Passwords must match');
    auth.resetPassword.and.returnValue(of({ message: 'Password updated.' }));
    component.confirmPassword = component.password;
    component.submit();
    expect(auth.resetPassword).toHaveBeenCalledOnceWith('reset-token', 'Password1!');
    expect(component.message()).toBe('Password updated.');
    expect(component.password).toBe('');
  });
});
