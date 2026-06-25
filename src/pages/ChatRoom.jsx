import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  IconButton,
  Drawer,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  PushPin as PinIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Message from '../components/Message';
import MessageInput from '../components/MessageInput';
import Loader from '../components/Loader';
import useAuth from '../hooks/useAuth';
import {
  subscribeMessages,
  subscribeTypingStatus,
  subscribeUsers,
  sendMessage,
} from '../services/firestore';
import { getUserInitials } from '../utils/helpers';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser, profileData } = useAuth();

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);

  // Data states
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typers, setTypers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingRoom, setLoadingRoom] = useState(true);

  // Messaging reply state
  const [replyTo, setReplyTo] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto Scroll to Bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch Chat Room Details & Subscribe to messages/typers
  useEffect(() => {
    if (!roomId) return;

    setLoadingRoom(true);
    setReplyTo(null);

    // Get room details
    const roomRef = doc(db, 'chatRooms', roomId);
    const unsubscribeRoom = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        setRoom(snapshot.data());
      } else {
        // Room not found, redirect to dashboard
        navigate('/');
      }
      setLoadingRoom(false);
    });

    // Subscribe to messages
    const unsubscribeMessages = subscribeMessages(roomId, (msgList) => {
      setMessages(msgList);
    });

    // Subscribe to typing indicators
    const unsubscribeTyping = subscribeTypingStatus(roomId, (typerList) => {
      // Filter out current user from typing indicators
      setTypers(typerList.filter((t) => t.userId !== currentUser?.uid));
    });

    return () => {
      unsubscribeRoom();
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [roomId, navigate, currentUser]);

  // 2. Subscribe to Users list (for showing members panel)
  useEffect(() => {
    const unsubscribeUsers = subscribeUsers((userList) => {
      setUsers(userList);
    });
    return () => unsubscribeUsers();
  }, []);

  // 3. Scroll when messages load or change
  useEffect(() => {
    scrollToBottom();
  }, [messages, typers]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSendMessage = async ({ text, imageFile }) => {
    if (!currentUser || !roomId) return;

    const senderName = profileData?.name || currentUser.displayName || 'User';
    const senderPhoto = profileData?.profilePhoto || currentUser.photoURL || '';

    try {
      await sendMessage({
        roomId,
        senderId: currentUser.uid,
        senderName,
        senderPhoto,
        text,
        imageFile,
        replyTo,
      });
      setReplyTo(null);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message: ' + err.message);
    }
  };

  if (loadingRoom) {
    return <Loader fullPage />;
  }

  const pinnedMessages = messages.filter((m) => m.pinned);
  const onlineUsers = users.filter((u) => u.status === 'online');

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar onSidebarToggle={handleSidebarToggle} roomName={room?.roomName} />

      {/* Main Area */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Responsive Mobile Drawer Sidebar */}
        <Sidebar open={sidebarOpen} onClose={handleSidebarToggle} variant="temporary" />

        {/* Persistent Desktop Sidebar */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar variant="persistent" />
        </Box>

        {/* Messaging Pane */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', bgcolor: 'background.chat' }}>
          
          {/* Room Banner / Sub Header */}
          <Box sx={{ px: 3, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxW: '60%' }}>
              {room?.description || 'No channel description set.'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Pinned Messages">
                <IconButton onClick={() => setPinnedOpen(true)}>
                  <PinIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Channel Members">
                <IconButton onClick={() => setRightPanelOpen(!rightPanelOpen)}>
                  <PeopleIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Messages Flow Area */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 2 }}>
            {messages.length === 0 ? (
              <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56, mb: 2 }}>#</Avatar>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  Welcome to #{room?.roomName}!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  This is the start of the #{room?.roomName} channel.
                </Typography>
              </Box>
            ) : (
              messages.map((message) => (
                <Message
                  key={message.messageId}
                  message={message}
                  roomId={roomId}
                  onReplyClick={(replyObj) => setReplyTo(replyObj)}
                />
              ))
            )}

            {/* Typing Indicator Bar */}
            {typers.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 1 }}>
                <Loader typing />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {typers.map((t) => t.name).join(', ')} {typers.length === 1 ? 'is' : 'are'} typing...
                </Typography>
              </Box>
            )}

            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
          </Box>

          {/* Messaging Input Tray */}
          <MessageInput
            roomId={roomId}
            onSendMessage={handleSendMessage}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
          />
        </Box>

        {/* Right Side Panel: Channel Members (Desktop Drawer Layout) */}
        {rightPanelOpen && (
          <Paper
            elevation={0}
            sx={{
              width: 240,
              borderLeft: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Active Members ({onlineUsers.length})
              </Typography>
              <IconButton size="small" onClick={() => setRightPanelOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />
            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
              {users.map((member) => (
                <ListItem key={member.uid} disablePadding sx={{ mb: 0.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      width: '100%',
                      borderRadius: 1.5,
                      gap: 1.5,
                    }}
                  >
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      sx={{
                        '& .MuiBadge-badge': {
                          backgroundColor: member.status === 'online' ? '#22c55e' : '#94a3b8',
                          color: member.status === 'online' ? '#22c55e' : '#94a3b8',
                        },
                      }}
                    >
                      <Avatar
                        src={member.profilePhoto}
                        sx={{ width: 32, height: 32 }}
                      >
                        {getUserInitials(member.name)}
                      </Avatar>
                    </Badge>
                    <ListItemText
                      primary={member.name}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        noWrap: true,
                        variant: 'body2',
                        color: member.status === 'online' ? 'text.primary' : 'text.secondary',
                      }}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Right Drawer: Pinned Messages Overlay */}
        <Drawer
          anchor="right"
          open={pinnedOpen}
          onClose={() => setPinnedOpen(false)}
          PaperProps={{ sx: { width: 320 } }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <PinIcon fontSize="small" sx={{ transform: 'rotate(45deg)' }} /> Pinned Messages
            </Typography>
            <IconButton size="small" onClick={() => setPinnedOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
            {pinnedMessages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                No pinned messages in this channel.
              </Typography>
            ) : (
              pinnedMessages.map((msg) => (
                <Paper key={msg.messageId} variant="outlined" sx={{ p: 1.5, mb: 1.5, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar src={msg.senderPhoto} sx={{ width: 24, height: 24 }}>
                      {getUserInitials(msg.senderName)}
                    </Avatar>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      {msg.senderName}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </Typography>
                  {msg.imageUrl && (
                    <Box sx={{ mt: 1, borderRadius: 1, overflow: 'hidden' }}>
                      <img src={msg.imageUrl} alt="pinned attachment" style={{ width: '100%', height: 'auto' }} />
                    </Box>
                  )}
                </Paper>
              ))
            )}
          </Box>
        </Drawer>

      </Box>
    </Box>
  );
};

export default ChatRoom;
