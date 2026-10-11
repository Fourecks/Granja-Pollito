import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_STATE, type FarmState } from './domain';

const STORAGE_KEY = 'granja-pollito-state-v1';
export interface FarmRepository { load(): Promise<FarmState>; save(state: FarmState): Promise<void>; }

class LocalFarmRepository implements FarmRepository {
  async load() {
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? { ...structuredClone(DEFAULT_STATE), ...JSON.parse(raw) } as FarmState : structuredClone(DEFAULT_STATE); }
    catch { return structuredClone(DEFAULT_STATE); }
  }
  async save(state: FarmState) { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
}

class SupabaseFarmRepository implements FarmRepository {
  private client: SupabaseClient;
  private ready: Promise<string>;
  private cache = new LocalFarmRepository();
  constructor(url: string, key: string) {
    this.client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
    this.ready = this.getFarmId();
  }
  private async getFarmId() {
    const { data: { session } } = await this.client.auth.getSession();
    if (session?.user) return session.user.id;
    const { data, error } = await this.client.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) throw new Error('La sesión anónima no se pudo iniciar.');
    return data.user.id;
  }
  async load() {
    try {
      const ownerId = await this.ready;
      const { data, error } = await this.client.from('farm_state').select('state').eq('owner_id', ownerId).maybeSingle();
      if (error) throw error;
      if (data?.state) { await this.cache.save(data.state as FarmState); return { ...structuredClone(DEFAULT_STATE), ...data.state } as FarmState; }
      const local = await this.cache.load(); await this.save(local); return local;
    } catch (error) { console.warn('Supabase no está disponible; se usa el progreso local.', error); return this.cache.load(); }
  }
  async save(state: FarmState) {
    await this.cache.save(state);
    try {
      const ownerId = await this.ready;
      const { error } = await this.client.from('farm_state').upsert({ owner_id: ownerId, state, updated_at: new Date().toISOString() }, { onConflict: 'owner_id' });
      if (error) throw error;
    } catch (error) { console.warn('No se pudo sincronizar la granja. El progreso queda guardado en este dispositivo.', error); }
  }
}

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = import.meta.env;
export const farmRepository: FarmRepository = VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY
  ? new SupabaseFarmRepository(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
  : new LocalFarmRepository();
