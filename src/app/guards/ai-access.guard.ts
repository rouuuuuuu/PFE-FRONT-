import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

/**
 * Guards AI Engine routes — allows access only if the user has an
 * approved access request OR is a staff/admin user.
 * Otherwise redirects to the access-request page.
 */
export const aiAccessGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const aiService = inject(AiEngineService);
  const router = inject(Router);

  // Staff/admin users always have access
  if (authService.isAdmin()) {
    return true;
  }

  return aiService.getMyAccessStatus().pipe(
    map(response => {
      if (response.status === 'approved') {
        return true;
      }
      return router.createUrlTree(['/ai-engine/request-access']);
    }),
    catchError(() => {
      // If the endpoint fails (e.g. no record), redirect to request page
      return of(router.createUrlTree(['/ai-engine/request-access']));
    })
  );
};
