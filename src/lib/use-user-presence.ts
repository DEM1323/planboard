import { useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { useUser } from './use-user';

// User color palette for presence
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
];

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30 * 1000;

// Helper function to generate user initials from name
const getInitials = (name: string): string => {
  const words = name.split(' ').filter(word => word.length > 0);
  if (words.length === 0) return '??';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// Helper function to generate a consistent color for a user
const getUserColor = (userId: string): string => {
  // Create a hash from the user ID to consistently assign colors
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

interface UserPresence {
  id: string;
  sessionId: string;
  name: string;
  color: string;
  initials: string;
  lastActivity: number;
}

export function useUserPresence() {
  const { user, updateUserName, signOut } = useUser();
  const [userPresence, setUserPresence] = useState<UserPresence | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | undefined>();
  const lastActivityRef = useRef<number>(0);

  // Generate and store session ID once per app session
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionIdRef.current === null) {
      try {
        let sessionId = sessionStorage.getItem('planboard_sessionId');
        if (!sessionId) {
          sessionId = `session_${Date.now()}_${nanoid(8)}`;
          sessionStorage.setItem('planboard_sessionId', sessionId);
        }
        sessionIdRef.current = sessionId;
      } catch (e) {
        console.error('Could not access sessionStorage:', e);
        // Fallback if sessionStorage is disabled
        sessionIdRef.current = `session_${Date.now()}_${nanoid(8)}`;
      }
    }
  }, []);

  // Create user presence when user is available
  useEffect(() => {
    if (user && sessionIdRef.current) {
      const color = getUserColor(user.id);
      const initials = getInitials(user.name);
      const now = Date.now();

      setUserPresence({
        id: user.id,
        sessionId: sessionIdRef.current,
        name: user.name,
        color,
        initials,
        lastActivity: now,
      });

      lastActivityRef.current = now;
    }
  }, [user]);

  // Monitor online status with debouncing
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Start heartbeat when user presence is established
  useEffect(() => {
    if (userPresence && isOnline) {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
      heartbeatTimerRef.current = setInterval(() => {
        const now = Date.now();
        setUserPresence(prev => (prev ? { ...prev, lastActivity: now } : null));
        lastActivityRef.current = now;
      }, HEARTBEAT_INTERVAL);

      return () => {
        if (heartbeatTimerRef.current) {
          clearInterval(heartbeatTimerRef.current);
        }
      };
    }
  }, [userPresence, isOnline]);

  // Update user name and refresh presence
  const updateName = useCallback(
    (newName: string) => {
      updateUserName(newName);
      if (userPresence) {
        const now = Date.now();
        setUserPresence(prev =>
          prev
            ? {
                ...prev,
                name: newName,
                initials: getInitials(newName),
                lastActivity: now,
              }
            : null
        );
        lastActivityRef.current = now;
      }
    },
    [updateUserName, userPresence]
  );

  // Update last activity timestamp (throttled)
  const updateActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > 5000) {
      if (userPresence) {
        setUserPresence(prev => (prev ? { ...prev, lastActivity: now } : null));
      }
      lastActivityRef.current = now;
    }
  }, [userPresence]);

  // Sign out and clear presence
  const handleSignOut = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
    }
    try {
      sessionStorage.removeItem('planboard_sessionId');
    } catch (e) {
      console.error('Could not access sessionStorage:', e);
    }
    setUserPresence(null);
    sessionIdRef.current = null;
    signOut();
  }, [signOut]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
      }
    };
  }, []);

  return {
    userPresence,
    isOnline,
    updateName,
    updateActivity,
    signOut: handleSignOut,
  };
}

export function useTLDrawUserInfo() {
  const { userPresence } = useUserPresence();

  return userPresence ? {
    id: userPresence.sessionId,
    name: userPresence.name,
    color: userPresence.color,
  } : null;
} 