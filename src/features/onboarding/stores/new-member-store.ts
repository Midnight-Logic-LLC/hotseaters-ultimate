/**
 * new-member-store.ts — Zustand store for the invitee (NewMember)
 * 5-step micro-wizard. Mirrors the bible's
 * `NewMemberOnboarding.jsx` (503 LOC). RULE D — only place that calls
 * supabase / fetch in this sub-flow.
 */
import { create } from 'zustand';
import { supabase } from '@/shared/db/supabase-client';
import { useAuthSession } from '@/shared/db/auth-session';

export type MemberStep = 'intro' | 'welcome' | 'services' | 'photo' | 'done';

interface NewMemberState {
  step: MemberStep;
  // Context (set by AcceptInvite after server-side acceptance).
  companyName: string | null;
  role: string | null;
  assignedServiceNames: string[];
  // Photo state.
  photoPreview: string | null;
  photoFile: File | null;
  googlePhotoUrl: string | null;
  uploading: boolean;
  error: string | null;

  // Actions.
  setContext: (ctx: { companyName: string; role: string; assignedServiceNames?: string[] }) => void;
  setStep: (s: MemberStep) => void;
  goNext: () => void;
  goBack: () => void;
  setPhoto: (file: File | null) => Promise<void>;
  useGooglePhoto: () => void;
  hydrateGooglePhoto: () => Promise<void>;
  savePhoto: () => Promise<void>;
  reset: () => void;
}

const ORDER: MemberStep[] = ['intro', 'welcome', 'services', 'photo', 'done'];

export const useNewMemberStore = create<NewMemberState>()((set, get) => ({
  step: 'intro',
  companyName: null,
  role: null,
  assignedServiceNames: [],
  photoPreview: null,
  photoFile: null,
  googlePhotoUrl: null,
  uploading: false,
  error: null,

  setContext: ({ companyName, role, assignedServiceNames }) =>
    set({ companyName, role, assignedServiceNames: assignedServiceNames ?? [] }),
  setStep: (s) => set({ step: s }),
  goNext: () => {
    const i = ORDER.indexOf(get().step);
    if (i < ORDER.length - 1) set({ step: ORDER[i + 1] ?? 'done' });
  },
  goBack: () => {
    const i = ORDER.indexOf(get().step);
    if (i > 0) set({ step: ORDER[i - 1] ?? 'intro' });
  },

  setPhoto: async (file) => {
    if (!file) {
      set({ photoFile: null, photoPreview: null });
      return;
    }
    if (!file.type.startsWith('image/')) {
      set({ error: 'Please choose an image file.' });
      return;
    }
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    set({ photoFile: file, photoPreview: dataUrl, error: null });
  },

  useGooglePhoto: () => {
    const url = get().googlePhotoUrl;
    if (url) set({ photoPreview: url, photoFile: null });
  },

  // Pulls the Google profile photo from the session user's metadata and
  // upscales sizing hints to s400. Bible: NewMemberOnboarding.jsx mounts.
  hydrateGooglePhoto: async () => {
    try {
      const user = useAuthSession.getState().user;
      const meta = (user?.user_metadata ?? {}) as { avatar_url?: string; picture?: string };
      const raw = meta.avatar_url ?? meta.picture;
      if (!raw) return;
      const upscaled = raw
        .replace(/=s\d+/i, '=s400')
        .replace(/\?sz=\d+/i, '?sz=400');
      set({ googlePhotoUrl: upscaled });
    } catch {
      // ignore
    }
  },

  savePhoto: async () => {
    const { photoFile, photoPreview, googlePhotoUrl } = get();
    set({ uploading: true, error: null });
    try {
      const user = useAuthSession.getState().user;
      if (!user) throw new Error('not authenticated');

      let photoUrl: string | null = null;

      if (photoFile) {
        // Upload to storage bucket `avatars` (already provisioned by the
        // base supabase stack). Path: <auth_uid>/<filename>.
        const path = `${user.id}/avatar-${Date.now()}-${photoFile.name.replace(/[^a-z0-9._-]+/gi, '_')}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
        if (uploadErr) throw uploadErr;
        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
        photoUrl = pub.publicUrl;
      } else if (photoPreview && photoPreview === googlePhotoUrl) {
        photoUrl = googlePhotoUrl;
      }

      if (photoUrl) {
        const { error: updateErr } = await supabase
          .from('user_info')
          .update({ profile_photo: photoUrl })
          .eq('auth_user_id', user.id);
        if (updateErr) throw updateErr;
      }
      set({ uploading: false, step: 'done' });
    } catch (err: unknown) {
      set({
        uploading: false,
        error: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  },

  reset: () =>
    set({
      step: 'intro',
      companyName: null,
      role: null,
      assignedServiceNames: [],
      photoPreview: null,
      photoFile: null,
      googlePhotoUrl: null,
      uploading: false,
      error: null,
    }),
}));
