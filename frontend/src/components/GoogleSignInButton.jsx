import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import api from '../lib/api.js';
import { useAuth } from '../store/auth.js';

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.getElementById('google-identity-services');
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => reject(new Error('Google sign-in could not load.')), { once: true });
    if (window.google?.accounts?.id) resolve();
  });
}

export default function GoogleSignInButton({ onSuccess, disabled = false }) {
  const buttonRef = useRef(null);
  const onSuccessRef = useRef(onSuccess);
  const signIn = useAuth((state) => state.loginWithGoogle);
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    let active = true;
    let initialized = false;

    (async () => {
      try {
        const { data: config } = await api.get('/auth/google/config');
        if (!active || !config.clientId) return;
        await loadGoogleIdentityServices();
        const { data: nonceData } = await api.get('/auth/google/nonce');
        if (!active || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: config.clientId,
          nonce: nonceData.nonce,
          callback: async ({ credential }) => {
            if (!active || !credential) return;
            setBusy(true);
            try {
              const user = await signIn(credential);
              onSuccessRef.current(user);
            } catch (error) {
              toast.error(error.response?.data?.error || 'Google sign-in failed. Please try again.');
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with',
          width: Math.min(buttonRef.current.clientWidth || 400, 400),
        });
        initialized = true;
        setAvailable(true);
      } catch (error) {
        if (active) toast.error(error.response?.data?.error || error.message || 'Google sign-in is unavailable.');
      }
    })();

    return () => {
      active = false;
      if (initialized) window.google?.accounts?.id?.cancel();
    };
  }, [signIn]);

  if (!available) return null;
  return <>
    <div className="mt-5 flex items-center gap-3 text-xs text-ink-400"><span className="h-px flex-1 bg-ink-200" />OR<span className="h-px flex-1 bg-ink-200" /></div>
    <div className="relative mt-5">
      <div ref={buttonRef} className={disabled || busy ? 'pointer-events-none opacity-60' : ''} />
      {busy && <div className="absolute inset-0 grid place-items-center rounded bg-white/60 text-sm text-ink-600">Signing in…</div>}
    </div>
  </>;
}
