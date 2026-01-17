import {TestBed} from '@angular/core/testing';
import {HttpClient, provideHttpClient, withInterceptors} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {Router} from '@angular/router';
import {of, Subject, throwError} from 'rxjs';

import {authInterceptor} from './auth.interceptor';
import {AuthService} from '../auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  /**
   * The interceptor has module-scoped state (isRefreshing + refreshTokenSubject).
   * To keep tests isolated, load it fresh for each test.
   */
  let interceptorUnderTest: typeof authInterceptor;

  beforeEach(async () => {
    // Load a fresh copy each time so module-level state resets.
    interceptorUnderTest = (await import('./auth.interceptor')).authInterceptor;

    authService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getAccessToken',
      'getRefreshToken',
      'refreshToken',
      'logout'
    ]);

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([interceptorUnderTest])),
        provideHttpClientTesting(),
        {provide: AuthService, useValue: authService},
        {provide: Router, useValue: router}
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds Authorization header for normal requests when access token exists', () => {
    authService.getAccessToken.and.returnValue('access-123');

    http.get('/api/v1/employees').subscribe();

    const req = httpMock.expectOne('/api/v1/employees');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-123');
    req.flush({ok: true});
  });

  it('does not add Authorization header for /auth/login', () => {
    authService.getAccessToken.and.returnValue('access-123');

    http.post('/auth/login', {username: 'u', password: 'p'}).subscribe();

    const req = httpMock.expectOne('/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({data: {}});
  });

  it('on 401, refreshes token and retries the original request with new token', () => {
    authService.getAccessToken.and.returnValue('expired-access');
    authService.getRefreshToken.and.returnValue('refresh-123');

    // refresh happens via AuthService.refreshToken() observable, not via HttpClientTestingController
    authService.refreshToken.and.returnValue(
      of({
        status: 'success',
        data: {accessToken: 'new-access', expiresIn: 3600, tokenType: 'Bearer'},
        message: ''
      } as any)
    );

    let result: any;
    http.get('/api/v1/protected').subscribe(r => (result = r));

    // 1) first attempt with expired token
    const first = httpMock.expectOne('/api/v1/protected');
    expect(first.request.headers.get('Authorization')).toBe('Bearer expired-access');
    first.flush({message: 'unauthorized'}, {status: 401, statusText: 'Unauthorized'});

    // 2) original request retried with new token
    const retried = httpMock.expectOne('/api/v1/protected');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-access');
    retried.flush({ok: true});

    expect(result).toEqual({ok: true});
    expect(authService.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('on refresh failure, logs out and navigates to /login', () => {
    authService.getAccessToken.and.returnValue('expired-access');
    authService.getRefreshToken.and.returnValue('refresh-123');
    authService.refreshToken.and.returnValue(throwError(() => new Error('refresh failed')));

    let err: any;
    http.get('/api/v1/protected').subscribe({
      next: () => fail('expected error'),
      error: (e) => (err = e)
    });

    const first = httpMock.expectOne('/api/v1/protected');
    first.flush({message: 'unauthorized'}, {status: 401, statusText: 'Unauthorized'});

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(err).toBeTruthy();
  });

  it('queues concurrent 401s so only one refresh happens and both requests retry', () => {
    authService.getAccessToken.and.returnValue('expired-access');
    authService.getRefreshToken.and.returnValue('refresh-123');

    // Hold refresh open while two requests fail.
    const refresh$ = new Subject<any>();
    authService.refreshToken.and.returnValue(refresh$.asObservable());

    const r1: any[] = [];
    const r2: any[] = [];

    http.get('/api/v1/protected/1').subscribe(v => r1.push(v));
    http.get('/api/v1/protected/2').subscribe(v => r2.push(v));

    const first1 = httpMock.expectOne('/api/v1/protected/1');
    const first2 = httpMock.expectOne('/api/v1/protected/2');

    first1.flush({}, {status: 401, statusText: 'Unauthorized'});
    first2.flush({}, {status: 401, statusText: 'Unauthorized'});

    expect(authService.refreshToken).toHaveBeenCalledTimes(1);

    // Resolve refresh with a new access token
    refresh$.next({status: 'success', data: {accessToken: 'new-access'}});
    refresh$.complete();

    const retry1 = httpMock.expectOne('/api/v1/protected/1');
    const retry2 = httpMock.expectOne('/api/v1/protected/2');

    expect(retry1.request.headers.get('Authorization')).toBe('Bearer new-access');
    expect(retry2.request.headers.get('Authorization')).toBe('Bearer new-access');

    retry1.flush({ok: 1});
    retry2.flush({ok: 2});

    expect(r1).toEqual([{ok: 1}]);
    expect(r2).toEqual([{ok: 2}]);
  });

  it('if no refresh token is available, logs out and navigates to /login', () => {
    authService.getAccessToken.and.returnValue('expired-access');
    authService.getRefreshToken.and.returnValue(null);

    let err: any;
    http.get('/api/v1/protected').subscribe({
      next: () => fail('expected error'),
      error: (e) => (err = e)
    });

    const first = httpMock.expectOne('/api/v1/protected');
    first.flush({}, {status: 401, statusText: 'Unauthorized'});

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    expect(err).toBeTruthy();
  });
});
