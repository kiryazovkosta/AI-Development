import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FunctionsHttpError, User } from '@supabase/supabase-js';
import { AppLockService } from './native/app-lock.service';
import { SecureSessionStorage } from './native/secure-session-storage.service';
import { SupabaseService } from './supabase.service';

const BEFORE_SIGN_OUT_TIMEOUT_MS = 3000;

export interface AuthUser {
  uid: string;
  email: string | null;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface NewUser {
  email: string;
  password: string;
  displayName: string;
  phone: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly router = inject(Router);
  private readonly appLock = inject(AppLockService);
  private readonly sessionStorage = inject(SecureSessionStorage);

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly loadingSignal = signal<boolean>(true);
  private readonly profileLoadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<AuthError | null>(null);
  private readonly displayNameSignal = signal<string | null>(null);
  private readonly rolesSignal = signal<string[]>([]);
  private readonly beforeSignOutTasks: (() => Promise<void>)[] = [];

  readonly currentUser = computed<AuthUser | null>(() => {
    const user = this.currentUserSignal();
    return user ? { uid: user.id, email: user.email ?? null } : null;
  });
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  // Guards wait on this, so it stays true until the user's roles are known
  readonly isLoading = computed(() => this.loadingSignal() || this.profileLoadingSignal());
  readonly authError = computed(() => this.errorSignal());
  readonly displayName = computed(() => this.displayNameSignal());
  readonly roles = computed(() => this.rolesSignal());
  readonly isAdmin = computed(() => this.rolesSignal().includes('Administrator'));

  constructor() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      // Avoid re-emitting the same user on token refresh, which would re-trigger collection loading
      if (user?.id !== this.currentUserSignal()?.id) {
        this.currentUserSignal.set(user);
        if (user) {
          this.profileLoadingSignal.set(true);
          // Deferred: awaiting Supabase calls inside the auth callback can deadlock supabase-js
          setTimeout(() => this.loadProfile(user.id));
        } else {
          this.displayNameSignal.set(null);
          this.rolesSignal.set([]);
        }
      }
      this.loadingSignal.set(false);
    });
  }

  /**
   * Registers work that must finish while the session is still valid, such as saving the
   * last changes. Sign-out waits for it, but never longer than BEFORE_SIGN_OUT_TIMEOUT_MS.
   */
  onBeforeSignOut(task: () => Promise<void>): void {
    this.beforeSignOutTasks.push(task);
  }

  async login(email: string, password: string): Promise<boolean> {
    this.errorSignal.set(null);
    this.loadingSignal.set(true);
    try {
      const { error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return true;
    } catch (error: unknown) {
      this.errorSignal.set(this.parseAuthError(error));
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async createUser(newUser: NewUser): Promise<boolean> {
    this.errorSignal.set(null);
    try {
      const { error } = await this.supabase.functions.invoke('create-user', { body: newUser });
      if (error) {
        // The function returns { code, message } in the body of non-2xx responses
        if (error instanceof FunctionsHttpError) {
          throw await error.context.json().catch(() => error);
        }
        throw error;
      }
      return true;
    } catch (error: unknown) {
      this.errorSignal.set(this.parseAuthError(error));
      return false;
    }
  }

  async logout(): Promise<void> {
    this.errorSignal.set(null);
    await Promise.race([
      Promise.allSettled(this.beforeSignOutTasks.map((task) => task())),
      new Promise((resolve) => setTimeout(resolve, BEFORE_SIGN_OUT_TIMEOUT_MS)),
    ]);
    await this.supabase.auth.signOut();
    this.router.navigate(['/login']);
  }

  /**
   * Native app: leaves the lock screen without unlocking, by dropping the session on this
   * device. Needs no network. The content stays covered until the session is gone.
   */
  async signOutLocal(): Promise<void> {
    this.errorSignal.set(null);
    await this.sessionStorage.discard();
    // Finds no stored session any more, so it only tells the app that the user is signed out
    await this.supabase.auth.signOut({ scope: 'local' });
    await this.router.navigate(['/login']);
    this.appLock.release(false);
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  private async loadProfile(uid: string): Promise<void> {
    try {
      const [profileResult, rolesResult] = await Promise.all([
        this.supabase.from('profiles').select('display_name').eq('id', uid).maybeSingle(),
        this.supabase.from('user_roles').select('roles(name)').eq('user_id', uid),
      ]);
      if (profileResult.error) throw profileResult.error;
      if (rolesResult.error) throw rolesResult.error;

      // Ignore the result if the user changed while loading
      if (this.currentUserSignal()?.id !== uid) return;

      this.displayNameSignal.set(profileResult.data?.display_name ?? null);
      const rows = (rolesResult.data ?? []) as { roles: { name: string } | { name: string }[] | null }[];
      this.rolesSignal.set(
        rows.flatMap((row) => (Array.isArray(row.roles) ? row.roles : row.roles ? [row.roles] : []))
          .map((role) => role.name)
      );
    } catch (error) {
      console.error('Failed to load user profile:', error);
      this.displayNameSignal.set(null);
      this.rolesSignal.set([]);
    } finally {
      this.profileLoadingSignal.set(false);
    }
  }

  private parseAuthError(error: unknown): AuthError {
    if (error && typeof error === 'object' && 'message' in error) {
      const authError = error as { code?: string; message: string };
      const code = authError.code ?? 'unknown';
      const friendlyMessages: Record<string, string> = {
        user_already_exists: 'This email is already registered.',
        email_exists: 'This email is already registered.',
        email_address_invalid: 'Please enter a valid email address.',
        validation_failed: 'Please enter a valid email address.',
        weak_password: 'Password must be at least 6 characters.',
        invalid_credentials: 'Invalid email or password.',
        over_request_rate_limit: 'Too many attempts. Please try again later.',
        over_email_send_rate_limit: 'Too many attempts. Please try again later.',
        email_not_confirmed: 'Please confirm your email first.',
        forbidden: 'Only administrators can create users.',
      };
      return {
        code,
        message: friendlyMessages[code] ?? authError.message,
      };
    }
    return { code: 'unknown', message: 'An unexpected error occurred.' };
  }
}
