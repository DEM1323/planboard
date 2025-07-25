import { useState, useEffect, useCallback, useRef } from 'react';
import { nanoid } from 'nanoid';
import { useUser } from './use-user';

// User color palette for presence
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
];

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
  const sessionIdRef = useRef<string | undefined>();

  // Generate user initials from name
  const getInitials = useCallback((name: string): string => {
    const words = name.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return '??';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }, []);

  // Generate consistent color for user
  const getUserColor = useCallback((userId: string): string => {
    // Create a hash from the user ID to consistently assign colors
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
  }, []);

  // Generate session ID once per app session
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session_${nanoid(12)}`;
    }
  }, []);

  // Create user presence when user is available
  useEffect(() => {
    if (user && sessionIdRef.current) {
      const color = getUserColor(user.id);
      const initials = getInitials(user.name);
      
      setUserPresence({
        id: user.id,
        sessionId: sessionIdRef.current,
        name: user.name,
        color,
        initials,
        lastActivity: Date.now(),
      });
    }
  }, [user, getUserColor, getInitials]);

  // Monitor online status
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

  // Update user name and refresh presence
  const updateName = useCallback((newName: string) => {
    updateUserName(newName);
    
    if (userPresence) {
      setUserPresence(prev => prev ? {
        ...prev,
        name: newName,
        initials: getInitials(newName),
        lastActivity: Date.now(),
      } : null);
    }
  }, [updateUserName, userPresence, getInitials]);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    if (userPresence) {
      setUserPresence(prev => prev ? {
        ...prev,
        lastActivity: Date.now(),
      } : null);
    }
  }, [userPresence]);

  // Sign out and clear presence
  const handleSignOut = useCallback(() => {
    setUserPresence(null);
    sessionIdRef.current = undefined;
    signOut();
  }, [signOut]);

  return {
    userPresence,
    isOnline,
    updateName,
    updateActivity,
    signOut: handleSignOut,
    // Helper functions
    getInitials,
    getUserColor,
  };
}

// Hook for generating TLDraw user info
export function useTLDrawUserInfo() {
  const { userPresence } = useUserPresence();

  return userPresence ? {
    id: userPresence.sessionId,
    name: userPresence.name,
    color: userPresence.color,
  } : null;
} 