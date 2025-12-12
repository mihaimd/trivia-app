import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const authService = inject(AuthService);

  return user(auth).pipe(
    take(1), // only take the first emission
    map((firebaseUser) => {
      if (firebaseUser) {
        return true;
      } else {
        const userData = authService.getUserProfileFromLocal();
        if(userData) {
          if(userData.providerId==null && userData.uid!=null) {
            return true;
          }
        } else {
          router.navigate(['/signup']);
        }
        return false;
      }
    })
  );
};
