import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { firestoreUtils } from '@/lib/firestore';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const LOCAL_USER_KEY = 'panotour_demo_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is not configured or auth is not initialized, operate in instant local mode
    if (!isFirebaseConfigured || !auth) {
      const localStored = localStorage.getItem(LOCAL_USER_KEY);
      if (localStored) {
        try {
          setUser(JSON.parse(localStored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
          try {
            const userData = await firestoreUtils.getUser(fbUser.uid);
            setUser(userData);
          } catch {
            setUser({
              id: fbUser.uid,
              displayName: fbUser.displayName || 'Creator',
              email: fbUser.email || 'user@example.com',
              photoURL: fbUser.photoURL,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } else {
          // Check local storage session fallback
          const localStored = localStorage.getItem(LOCAL_USER_KEY);
          if (localStored) {
            try {
              setUser(JSON.parse(localStored));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });
    } catch {
      // Local storage fallback if auth listener fails
      const localStored = localStorage.getItem(LOCAL_USER_KEY);
      if (localStored) {
        try {
          setUser(JSON.parse(localStored));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    }

    // Safety timeout: Never leave app in loading state longer than 1.2 seconds
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const createUserProfile = async (fbUser: FirebaseUser, displayName: string) => {
    const userData: Omit<User, 'createdAt' | 'updatedAt'> = {
      id: fbUser.uid,
      displayName,
      email: fbUser.email!,
      photoURL: fbUser.photoURL,
    };
    try {
      await firestoreUtils.createUser(userData);
    } catch {
      // Fallback
    }
    return userData;
  };

  const setLocalFallbackUser = (email: string, displayName: string, id?: string) => {
    const localUser: User = {
      id: id || `user-${Date.now()}`,
      displayName,
      email,
      photoURL: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
    setUser(localUser);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!isFirebaseConfigured) {
      setLocalFallbackUser(email, displayName);
      return;
    }

    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(result.user, displayName);
    } catch (err: any) {
      if (err?.code === 'auth/invalid-api-key' || err?.code === 'auth/network-request-failed' || !isFirebaseConfigured) {
        setLocalFallbackUser(email, displayName);
      } else {
        throw err;
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      setLocalFallbackUser(email, email.split('@')[0]);
      return;
    }

    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err?.code === 'auth/invalid-api-key' || err?.code === 'auth/network-request-failed' || !isFirebaseConfigured) {
        setLocalFallbackUser(email, email.split('@')[0]);
      } else {
        throw err;
      }
    }
  };

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      setLocalFallbackUser('creator@panotour.dev', 'Google Creator');
      return;
    }

    try {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const existingUser = await firestoreUtils.getUser(result.user.uid);
      if (!existingUser) {
        await createUserProfile(result.user, result.user.displayName || 'User');
      }
    } catch (err: any) {
      if (!isFirebaseConfigured || err?.code === 'auth/invalid-api-key') {
        setLocalFallbackUser('creator@panotour.dev', 'Google Creator');
      } else {
        throw err;
      }
    }
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_USER_KEY);
    setUser(null);
    try {
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      await firebaseSignOut(auth);
    } catch {
      // Ignored
    }
  };

  const resetPassword = async (email: string) => {
    if (!isFirebaseConfigured) return;
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    const updated = { ...user, ...data, updatedAt: new Date() };
    setUser(updated);
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));

    if (firebaseUser && isFirebaseConfigured) {
      try {
        await firestoreUtils.updateUser(firebaseUser.uid, data);
      } catch {
        // Ignored in offline
      }
    }
  };

  const refreshUser = async () => {
    if (firebaseUser && isFirebaseConfigured) {
      const userData = await firestoreUtils.getUser(firebaseUser.uid);
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}