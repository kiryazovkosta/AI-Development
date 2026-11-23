import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { SESSION_KEY } from './native/first-run.service';
import { NativePlatform } from './native/native-adapters';
import { SecureSessionStorage } from './native/secure-session-storage.service';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabase.url,
    environment.supabase.anonKey,
    // A browser keeps the session in localStorage, as supabase-js does by default
    inject(NativePlatform).isNative
      ? { auth: { storage: inject(SecureSessionStorage), storageKey: SESSION_KEY } }
      : undefined
  );
}
