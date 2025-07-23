import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';

interface User {
  id: string;
  name: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get or create user from localStorage
    let userId = localStorage.getItem('planboard_user_id');
    let userName = localStorage.getItem('planboard_user_name');

    if (!userId) {
      userId = `user_${nanoid(8)}`;
      localStorage.setItem('planboard_user_id', userId);
    }

    if (!userName) {
      // Generate a guest number based on user ID hash
      const guestNumber = Math.abs(userId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)) % 9999 + 1;
      userName = `Guest ${guestNumber}`;
      localStorage.setItem('planboard_user_name', userName);
    }

    setUser({ id: userId, name: userName });
  }, []);

  const updateUserName = (newName: string) => {
    if (user) {
      const updatedUser = { ...user, name: newName };
      setUser(updatedUser);
      localStorage.setItem('planboard_user_name', newName);
    }
  };

  const signOut = () => {
    // Clear localStorage
    localStorage.removeItem('planboard_user_id');
    localStorage.removeItem('planboard_user_name');
    
    // Reset user state
    setUser(null);
    
    // Refresh the page to reset the app state
    window.location.reload();
  };

  return { user, updateUserName, signOut };
}
