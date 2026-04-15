import { useState, useEffect, useCallback } from 'react';

export function useWakeLock(shouldLock: boolean) {
  const [wakeLock, setWakeLock] = useState<any>(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLock(lock);
        console.log('Wake Lock is active');
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLock !== null) {
      await wakeLock.release();
      setWakeLock(null);
      console.log('Wake Lock released');
    }
  }, [wakeLock]);

  useEffect(() => {
    if (shouldLock) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      if (wakeLock !== null) {
        wakeLock.release();
      }
    };
  }, [shouldLock, requestWakeLock, releaseWakeLock]);

  // Re-acquire wake lock if visibility changes (e.g., user switches tabs and comes back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible' && shouldLock) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [wakeLock, shouldLock, requestWakeLock]);
}
