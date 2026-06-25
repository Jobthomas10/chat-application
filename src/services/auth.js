import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';

const googleProvider = new GoogleAuthProvider();

// Helper to upload profile picture to Firebase Storage
export const uploadProfilePhoto = async (file, userId) => {
  if (!file) return null;
  const photoRef = ref(storage, `profile_photos/${userId}/${Date.now()}_${file.name}`);
  await uploadBytes(photoRef, file);
  return getDownloadURL(photoRef);
};

// Sign in with Google
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if user already exists in Firestore; if not, create document
  const userDocRef = doc(db, 'users', user.uid);
  const userSnapshot = await getDoc(userDocRef);

  if (!userSnapshot.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      name: user.displayName || 'Anonymous',
      email: user.email,
      profilePhoto: user.photoURL || '',
      bio: 'Hey there! I am using this Chat App.',
      createdAt: serverTimestamp(),
      status: 'online',
      lastSeen: serverTimestamp(),
    });
  } else {
    // If user exists, update status to online
    await updateDoc(userDocRef, {
      status: 'online',
      lastSeen: serverTimestamp(),
    });
  }

  return user;
};

// Register with Email and Password
export const registerWithEmail = async (name, email, password, photoFile, bio) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  let profilePhotoUrl = '';
  if (photoFile) {
    profilePhotoUrl = await uploadProfilePhoto(photoFile, user.uid);
  }

  // Update Auth Profile
  await updateProfile(user, {
    displayName: name,
    photoURL: profilePhotoUrl,
  });

  // Create User document in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    uid: user.uid,
    name,
    email,
    profilePhoto: profilePhotoUrl,
    bio: bio || 'Hey there! I am using this Chat App.',
    createdAt: serverTimestamp(),
    status: 'online',
    lastSeen: serverTimestamp(),
  });

  return user;
};

// Sign in with Email and Password
export const signInWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update status to online in Firestore
  const userDocRef = doc(db, 'users', user.uid);
  await updateDoc(userDocRef, {
    status: 'online',
    lastSeen: serverTimestamp(),
  });

  return user;
};

// Reset Password
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

// User Logout
export const logoutUser = async () => {
  const user = auth.currentUser;
  if (user) {
    // Set status to offline before signing out
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      status: 'offline',
      lastSeen: serverTimestamp(),
    });
  }
  await signOut(auth);
};

// Update user details
export const updateProfileData = async (name, bio, photoFile, currentPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user is currently authenticated.');

  const userDocRef = doc(db, 'users', user.uid);
  const updates = {};

  if (name && name !== user.displayName) {
    await updateProfile(user, { displayName: name });
    updates.name = name;
  }

  if (photoFile) {
    const photoUrl = await uploadProfilePhoto(photoFile, user.uid);
    await updateProfile(user, { photoURL: photoUrl });
    updates.profilePhoto = photoUrl;
  }

  if (bio !== undefined) {
    updates.bio = bio;
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(userDocRef, updates);
  }
};

// Sign in Anonymously (Guest Login)
export const signInAsGuest = async () => {
  const result = await signInAnonymously(auth);
  const user = result.user;

  const guestNumber = Math.floor(1000 + Math.random() * 9000);
  const guestName = `Guest_${guestNumber}`;

  await updateProfile(user, {
    displayName: guestName,
    photoURL: '',
  });

  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(userDocRef, {
    uid: user.uid,
    name: guestName,
    email: '',
    profilePhoto: '',
    bio: 'Hey there! I am using this Chat App as a Guest.',
    createdAt: serverTimestamp(),
    status: 'online',
    lastSeen: serverTimestamp(),
  });

  return user;
};
