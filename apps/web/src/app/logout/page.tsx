'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth';

export default function LogoutPage() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    clearSession();
    router.replace('/login');
  }, [clearSession, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-semibold text-muted-foreground">
          Logging you out securely...
        </p>
      </div>
    </div>
  );
}
