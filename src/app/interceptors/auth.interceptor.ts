import {HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {BehaviorSubject, catchError, filter, switchMap, take, throwError} from 'rxjs';
import {AuthService} from '../auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Skip auth header for login and refresh endpoints
  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  // Add Bearer token to request
  const accessToken = authService.getAccessToken();
  let authReq = req;

  if (accessToken && !isRefreshing) {
    authReq = addTokenToRequest(req, accessToken);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh')) {
        return handleUnauthorizedError(req, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

function addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handleUnauthorizedError(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();

    if (refreshToken) {
      return authService.refreshToken().pipe(
        switchMap((response: any) => {
          isRefreshing = false;
          const newAccessToken = response.data.accessToken;
          refreshTokenSubject.next(newAccessToken);

          // Retry the original request with new token
          return next(addTokenToRequest(request, newAccessToken));
        }),
        catchError((err) => {
          isRefreshing = false;
          // Refresh failed - logout and redirect to login
          authService.logout();
          router.navigate(['/login']);
          return throwError(() => err);
        })
      );
    } else {
      // No refresh token - redirect to login
      isRefreshing = false;
      authService.logout();
      router.navigate(['/login']);
      return throwError(() => new Error('No refresh token available'));
    }
  } else {
    // Wait for the refresh to complete, then retry
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => next(addTokenToRequest(request, token!)))
    );
  }
}

