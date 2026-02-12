import { Injectable, signal, computed, inject, EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';

export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthError {
  code: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly injector = inject(EnvironmentInjector);
  private readonly router = inject(Router);

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly loadingSignal = signal<boolean>(true);
  private readonly errorSignal = signal<AuthError | null>(null);

  readonly currentUser = computed<AuthUser | null>(() => {
    const user = this.currentUserSignal();
    return user ? { uid: user.uid, email: user.email } : null;
  });
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly isLoading = computed(() => this.loadingSignal());
  readonly authError = computed(() => this.errorSignal());

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUserSignal.set(user);
      this.loadingSignal.set(false);
    });
  }

  async register(email: string, password: string): Promise<boolean> {
    this.errorSignal.set(null);
    this.loadingSignal.set(true);
    try {
      await runInInjectionContext(this.injector, () =>
        createUserWithEmailAndPassword(this.auth, email, password)
      );
      return true;
    } catch (error: unknown) {
      this.errorSignal.set(this.parseFirebaseError(error));
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this.errorSignal.set(null);
    this.loadingSignal.set(true);
    try {
      await runInInjectionContext(this.injector, () =>
        signInWithEmailAndPassword(this.auth, email, password)
      );
      return true;
    } catch (error: unknown) {
      this.errorSignal.set(this.parseFirebaseError(error));
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async logout(): Promise<void> {
    this.errorSignal.set(null);
    await runInInjectionContext(this.injector, () => signOut(this.auth));
    this.router.navigate(['/login']);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  private parseFirebaseError(error: unknown): AuthError {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const firebaseError = error as { code: string; message: string };
      const friendlyMessages: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      return {
        code: firebaseError.code,
        message: friendlyMessages[firebaseError.code] ?? firebaseError.message,
      };
    }
    return { code: 'unknown', message: 'An unexpected error occurred.' };
  }
}
