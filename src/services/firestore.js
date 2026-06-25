import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// --- Chat Room Operations ---

// Create a new chat room
export const createChatRoom = async (roomName, description, createdBy) => {
  const roomRef = collection(db, 'chatRooms');
  const docRef = await addDoc(roomRef, {
    roomName,
    description: description || '',
    createdBy,
    createdAt: serverTimestamp(),
  });
  // Add roomId field to the document itself
  await updateDoc(docRef, { roomId: docRef.id });
  return docRef.id;
};

// Subscribe to all chat rooms in real-time
export const subscribeChatRooms = (callback) => {
  const roomsRef = collection(db, 'chatRooms');
  const q = query(roomsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const rooms = [];
    snapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() });
    });
    callback(rooms);
  });
};

// Delete a chat room (only creator/admin)
export const deleteChatRoom = async (roomId) => {
  const roomRef = doc(db, 'chatRooms', roomId);
  await deleteDoc(roomRef);
};

// --- Message Operations ---

// Upload image to Firebase Storage for chat room
export const uploadChatImage = async (file, roomId) => {
  if (!file) return null;
  const imageRef = ref(storage, `chat_images/${roomId}/${Date.now()}_${file.name}`);
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
};

// Send a message
export const sendMessage = async ({
  roomId,
  senderId,
  senderName,
  senderPhoto,
  text = '',
  imageFile = null,
  replyTo = null, // object: { messageId, text, senderName }
}) => {
  let imageUrl = '';
  if (imageFile) {
    imageUrl = await uploadChatImage(imageFile, roomId);
  }

  const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
  const messageData = {
    roomId,
    senderId,
    senderName,
    senderPhoto: senderPhoto || '',
    text,
    imageUrl,
    createdAt: serverTimestamp(),
    edited: false,
    reactions: {}, // format: { emoji: [userId1, userId2] }
    pinned: false,
  };

  if (replyTo) {
    messageData.replyTo = replyTo;
  }

  const docRef = await addDoc(messagesRef, messageData);
  await updateDoc(docRef, { messageId: docRef.id });
  return docRef.id;
};

// Edit a message
export const editMessage = async (roomId, messageId, newText) => {
  const messageRef = doc(db, 'chatRooms', roomId, 'messages', messageId);
  await updateDoc(messageRef, {
    text: newText,
    edited: true,
  });
};

// Delete a message
export const deleteMessage = async (roomId, messageId) => {
  const messageRef = doc(db, 'chatRooms', roomId, 'messages', messageId);
  await deleteDoc(messageRef);
};

// Subscribe to messages of a chat room in real-time
export const subscribeMessages = (roomId, callback, limitCount = 50) => {
  const messagesRef = collection(db, 'chatRooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};

// Toggle Message Reaction
export const toggleMessageReaction = async (roomId, messageId, emoji, userId) => {
  const messageRef = doc(db, 'chatRooms', roomId, 'messages', messageId);
  const docSnap = await getDoc(messageRef);
  if (!docSnap.exists()) return;

  const data = docSnap.data();
  const reactions = { ...data.reactions };

  if (reactions[emoji]) {
    if (reactions[emoji].includes(userId)) {
      // Remove user's reaction
      reactions[emoji] = reactions[emoji].filter((id) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      // Add user's reaction
      reactions[emoji].push(userId);
    }
  } else {
    // Initialize new reaction
    reactions[emoji] = [userId];
  }

  await updateDoc(messageRef, { reactions });
};

// Toggle Message Pin Status
export const togglePinMessage = async (roomId, messageId, currentPinStatus) => {
  const messageRef = doc(db, 'chatRooms', roomId, 'messages', messageId);
  await updateDoc(messageRef, {
    pinned: !currentPinStatus,
  });
};

// --- Typing Indicator ---

// Update typing status in Firestore
export const updateTypingStatus = async (roomId, userId, name, isTyping) => {
  const typingRef = doc(db, 'chatRooms', roomId, 'typing', userId);
  await setDoc(typingRef, {
    name,
    isTyping,
    updatedAt: serverTimestamp(),
  });
};

// Subscribe to typing indicators in a room
export const subscribeTypingStatus = (roomId, callback) => {
  const typingRef = collection(db, 'chatRooms', roomId, 'typing');
  return onSnapshot(typingRef, (snapshot) => {
    const activeTypers = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Only include if isTyping is true and it hasn't timed out (e.g. within last 10 seconds)
      const isRecent = data.updatedAt && (Date.now() - data.updatedAt.toMillis() < 10000);
      if (data.isTyping && (isRecent || !data.updatedAt)) {
        activeTypers.push({ userId: doc.id, name: data.name });
      }
    });
    callback(activeTypers);
  });
};

// --- User Presence ---

// Update user status
export const updateUserPresenceStatus = async (userId, status) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    status,
    lastSeen: serverTimestamp(),
  }, { merge: true });
};

// Subscribe to all users (for listing online members)
export const subscribeUsers = (callback) => {
  const usersRef = collection(db, 'users');
  return onSnapshot(usersRef, (snapshot) => {
    const users = [];
    snapshot.forEach((doc) => {
      users.push(doc.data());
    });
    callback(users);
  });
};
