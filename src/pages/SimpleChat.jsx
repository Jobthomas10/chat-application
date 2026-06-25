import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  AppBar,
  Toolbar,
  Drawer,
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  ExitToApp as LogoutIcon,
  Forum as ForumIcon,
  Palette as PaletteIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

import { auth, db } from '../services/firebase';
import { signInAsGuest, logoutUser } from '../services/auth';
import {
  subscribeChatRooms,
  createChatRoom,
  deleteChatRoom,
  subscribeMessages,
  sendMessage,
  deleteMessage,
  updateTypingStatus,
  subscribeTypingStatus,
} from '../services/firestore';
import { ColorModeContext } from '../App';
import useAuth from '../hooks/useAuth';
import { getUserInitials } from '../utils/helpers';

const SimpleChat = () => {
  const { currentUser, profileData, loading: authLoading } = useAuth();
  const { mode, toggleColorMode } = useContext(ColorModeContext);

  // Layout & UI States
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');

  // Chat Rooms States
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  // Messages States
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [activeTypers, setActiveTypers] = useState([]);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Subscribe to all chat rooms on load
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeChatRooms((roomsList) => {
      setRooms(roomsList);
      // Auto-select first room if none selected
      if (roomsList.length > 0 && !selectedRoom) {
        setSelectedRoom(roomsList[0]);
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Subscribe to messages and typing status when selected room changes
  useEffect(() => {
    if (!currentUser || !selectedRoom) {
      setMessages([]);
      setActiveTypers([]);
      return;
    }

    // Subscribe to messages
    const unsubscribeMessages = subscribeMessages(selectedRoom.id, (messagesList) => {
      setMessages(messagesList);
      scrollToBottom();
    });

    // Subscribe to typing indicators
    const unsubscribeTyping = subscribeTypingStatus(selectedRoom.id, (typers) => {
      // Exclude current user from typing indicators list
      setActiveTypers(typers.filter((t) => t.userId !== currentUser.uid));
    });

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [currentUser, selectedRoom]);

  // Scroll message list to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle Nickname Sign-in
  const handleJoin = async (e) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;

    setSigningIn(true);
    setError('');
    try {
      // Sign in anonymously
      await signInAsGuest();
      // Update display name using nicknameInput
      if (auth.currentUser) {
        const { updateProfile } = await import('firebase/auth');
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        
        await updateProfile(auth.currentUser, {
          displayName: nicknameInput.trim(),
        });

        // Set user profile in firestore
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, {
          uid: auth.currentUser.uid,
          name: nicknameInput.trim(),
          createdAt: serverTimestamp(),
          status: 'online',
          lastSeen: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to sign in. Make sure Anonymous Authentication is enabled in the Firebase Console.');
    } finally {
      setSigningIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to exit?')) {
      try {
        await logoutUser();
        setSelectedRoom(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedRoom) return;

    const textToSend = messageInput.trim();
    setMessageInput('');
    setSending(true);

    // Stop typing indicator immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    await updateTypingStatus(selectedRoom.id, currentUser.uid, currentUser.displayName || 'Guest', false);

    try {
      await sendMessage({
        roomId: selectedRoom.id,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Guest',
        text: textToSend,
      });
      scrollToBottom();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // Handle Typing indicator update
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    if (!selectedRoom || !currentUser) return;

    // Send typing: true
    updateTypingStatus(selectedRoom.id, currentUser.uid, currentUser.displayName || 'Guest', true);

    // Debounce typing: false after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(selectedRoom.id, currentUser.uid, currentUser.displayName || 'Guest', false);
    }, 3000);
  };

  // Handle Create Room
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      const newRoomId = await createChatRoom(
        newRoomName.trim(),
        newRoomDesc.trim(),
        currentUser.uid
      );
      setNewRoomName('');
      setNewRoomDesc('');
      setCreateDialogOpen(false);
      
      // Auto select the new room
      setSelectedRoom({
        id: newRoomId,
        roomName: newRoomName.trim(),
        description: newRoomDesc.trim(),
      });
    } catch (err) {
      console.error(err);
      alert('Failed to create room.');
    }
  };

  // Handle Delete Room
  const handleDeleteRoom = async (roomId, e) => {
    e.stopPropagation(); // Prevent selecting the room when clicking delete
    if (window.confirm('Are you sure you want to delete this chat room? All messages in this room will be lost.')) {
      try {
        await deleteChatRoom(roomId);
        if (selectedRoom?.id === roomId) {
          setSelectedRoom(null);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to delete room. Only the creator of this room can delete it.');
      }
    }
  };

  // Render Nickname Gate (if not logged in)
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: mode === 'dark'
            ? 'radial-gradient(circle at 10% 20%, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 90.1%)'
            : 'radial-gradient(circle at 10% 20%, rgb(241, 245, 249) 0%, rgb(226, 232, 240) 90.1%)',
          p: 2,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400,
            borderRadius: 3,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 1,
              background: 'linear-gradient(90deg, #4f46e5 0%, #0891b2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ChatCord
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Enter a nickname to join the real-time chat rooms instantly.
          </Typography>

          {error && (
            <Box sx={{ color: 'error.main', mb: 2, fontSize: '0.875rem', textAlign: 'left', p: 1.5, bgcolor: 'error.lighter', borderRadius: 2 }}>
              {error}
            </Box>
          )}

          <Box component="form" onSubmit={handleJoin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Choose a Nickname"
              placeholder="e.g., Alex, GuestCoder"
              required
              fullWidth
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              disabled={signingIn}
              autoFocus
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={signingIn || !nicknameInput.trim()}
              sx={{ py: 1.2, fontWeight: 700 }}
            >
              {signingIn ? <CircularProgress size={24} color="inherit" /> : 'Enter Chat'}
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Sidebar Panel Content
  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      {/* Sidebar Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, background: 'linear-gradient(90deg, #4f46e5 0%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ChatCord
        </Typography>
        <IconButton onClick={toggleColorMode} color="inherit" size="small">
          <PaletteIcon />
        </IconButton>
      </Box>

      {/* User Info Bar */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          >
            {getUserInitials(currentUser.displayName || 'Guest')}
          </Box>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {currentUser.displayName || 'Guest'}
            </Typography>
            <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
              Online
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleLogout} color="error" size="small" title="Sign Out">
          <LogoutIcon />
        </IconButton>
      </Box>

      {/* Rooms List Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: 'text.secondary', letterSpacing: 1 }}>
          Chat Rooms
        </Typography>
        <Button
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setCreateDialogOpen(true)}
          sx={{ fontWeight: 700 }}
        >
          New Room
        </Button>
      </Box>

      <Divider />

      {/* Rooms List */}
      <List sx={{ flexGrow: 1, overflowY: 'auto', px: 1, py: 1 }}>
        {rooms.map((room) => {
          const isSelected = selectedRoom?.id === room.id;
          return (
            <ListItem
              key={room.id}
              disablePadding
              sx={{ mb: 0.5 }}
              secondaryAction={
                room.createdBy === currentUser.uid && (
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    size="small"
                    onClick={(e) => handleDeleteRoom(room.id, e)}
                    sx={{
                      color: isSelected ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                      '&:hover': { color: 'error.main' },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )
              }
            >
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  setSelectedRoom(room);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  pr: room.createdBy === currentUser.uid ? 6 : 2, // Leave space for delete button
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                }}
              >
                <ForumIcon sx={{ mr: 1.5, fontSize: 20, opacity: 0.7 }} />
                <ListItemText
                  primary={room.roomName}
                  secondary={isSelected ? null : room.description}
                  primaryTypographyProps={{ fontWeight: 600, noWrap: true, variant: 'body2' }}
                  secondaryTypographyProps={{ noWrap: true, variant: 'caption' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.chat' }}>
      
      {/* Desktop Sidebar */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, width: 280, minWidth: 280, borderRight: '1px solid', borderColor: 'divider', height: '100%' }}>
        {sidebarContent}
      </Box>

      {/* Mobile Drawer Sidebar */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 280 } }}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {sidebarContent}
      </Drawer>

      {/* Right Chat Panel */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Custom Header Bar */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          height: 64, 
          minHeight: 64, 
          px: 2, 
          bgcolor: 'background.paper', 
          borderBottom: '1px solid', 
          borderColor: 'divider' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={() => setMobileOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            {selectedRoom ? (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  #{selectedRoom.roomName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedRoom.description || 'No description'}
                </Typography>
              </Box>
            ) : (
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                ChatCord
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton onClick={toggleColorMode} color="inherit">
              <PaletteIcon />
            </IconButton>
            <IconButton 
              onClick={handleLogout} 
              color="error"
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
              title="Sign Out"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Chat Feed Area */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedRoom ? (
            <>
              {messages.length === 0 ? (
                <Box sx={{ m: 'auto', textAlign: 'center', color: 'text.secondary' }}>
                  <ForumIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1">No messages yet. Send a message to start the conversation!</Typography>
                </Box>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.senderId === currentUser.uid;
                  return (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, px: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {msg.senderName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {msg.createdAt ? new Date(msg.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                        </Typography>
                      </Box>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          borderTopRightRadius: isOwnMessage ? 1 : 12,
                          borderTopLeftRadius: isOwnMessage ? 12 : 1,
                          bgcolor: isOwnMessage ? 'primary.main' : 'background.paper',
                          color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
                          position: 'relative',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', pr: isOwnMessage ? 4 : 0 }}>
                          {msg.text}
                        </Typography>
                        
                        {/* Delete message icon button */}
                        {isOwnMessage && (
                          <IconButton
                            className="delete-btn"
                            size="small"
                            onClick={() => {
                              if (window.confirm('Delete message?')) {
                                deleteMessage(selectedRoom.id, msg.id);
                              }
                            }}
                            sx={{
                              position: 'absolute',
                              right: 4,
                              top: 4,
                              color: 'rgba(255, 255, 255, 0.7)',
                              opacity: 0.6,
                              transition: 'opacity 0.2s',
                              padding: '2px',
                              '&:hover': { color: '#fff', opacity: 1, bgcolor: 'rgba(0,0,0,0.1)' },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        )}
                      </Paper>
                    </Box>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <Box sx={{ m: 'auto', textAlign: 'center', maxWidth: 400 }}>
              <ForumIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2, opacity: 0.8 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Welcome to ChatCord!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select a chat room on the left side menu to join the conversation, or create a brand new room to start chatting.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Input Bar & Typing indicators */}
        {selectedRoom && (
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
            {/* Active Typers indicator */}
            <Box sx={{ height: 20, mb: 0.5 }}>
              {activeTypers.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', gap: 0.3 }}>
                    <span className="typing-dot" style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor' }} />
                    <span className="typing-dot" style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor', animationDelay: '0.2s' }} />
                    <span className="typing-dot" style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor', animationDelay: '0.4s' }} />
                  </Box>
                  {activeTypers.map((t) => t.name).join(', ')} {activeTypers.length === 1 ? 'is' : 'are'} typing...
                </Typography>
              )}
            </Box>
            
            {/* Message Input form */}
            <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                placeholder={`Message #${selectedRoom.roomName}`}
                fullWidth
                variant="outlined"
                size="small"
                value={messageInput}
                onChange={handleInputChange}
                disabled={sending}
                autoComplete="off"
              />
              <Button
                type="submit"
                variant="contained"
                disabled={!messageInput.trim() || sending}
                sx={{ px: 3 }}
              >
                {sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Create Room Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={handleCreateRoom}>
          <DialogTitle sx={{ fontWeight: 700 }}>Create New Room</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Room Name"
              placeholder="e.g., General, Gaming"
              required
              fullWidth
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              autoFocus
            />
            <TextField
              label="Description (Optional)"
              placeholder="What is this room for?"
              fullWidth
              value={newRoomDesc}
              onChange={(e) => setNewRoomDesc(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!newRoomName.trim()}>
              Create Room
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default SimpleChat;
