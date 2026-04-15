'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/provider/AuthProvider';

/**
 * Reusable hook to navigate to the messenger with a specific user.
 * Handles auth check and navigation. The messenger page owns conversation creation.
 */
export function useMessageUser() {
  const router = useRouter();
  const { user } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);

  const messageUser = useCallback(
    (userId: string) => {
      if (!user) {
        // Not authenticated — redirect to auth with return URL
        router.push(`/auth?returnUrl=${encodeURIComponent(`/messenger?user=${userId}`)}`);
        return;
      }

      // Don't message yourself
      if (user.id === userId) return;

      setIsNavigating(true);
      router.push(`/messenger?user=${userId}`);
    },
    [user, router]
  );

  return { messageUser, isNavigating };
}
