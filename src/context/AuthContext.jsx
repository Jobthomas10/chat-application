import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { updateUserPresenceStatus } from '../services/firestore';

export const AuthContext = createContext({
  currentUser: null,
  profileData: null,
  loading: true,
});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserDoc = null;

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up previous user doc subscription if any
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }

      if (user) {
        setCurrentUser(user);
        
        // Mark user as online on login
        try {
          await updateUserPresenceStatus(user.uid, 'online');
        } catch (e) {
          console.error("Error setting presence status to online:", e);
        }

        // Listen to user's Firestore document for profile changes (e.g. bio, profile photo, etc.)
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setProfileData(docSnap.data());
            } else {
              setProfileData(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Error subscribing to user doc:", error);
            setLoading(false);
          }
        );
      } else {
        setCurrentUser(null);
        setProfileData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
    };
  }, []);

  // Set presence online/offline based on tab visibility
  useEffect(() => {
    if (!currentUser) return;

    const handleVisibilityChange = async () => {
      try {
        if (document.visibilityState === 'visible') {
          await updateUserPresenceStatus(currentUser.uid, 'online');
        } else {
          await updateUserPresenceStatus(currentUser.uid, 'offline');
        }
      } catch (err) {
        console.error("Error updating presence on visibility change:", err);
      }
    };

    const handleBeforeUnload = async () => {
      // Set to offline synchronously before unload
      try {
        await updateUserPresenceStatus(currentUser.uid, 'offline');
      } catch (err) {
        console.error("Error updating presence on unload:", err);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  const value = {
    currentUser,
    profileData,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
