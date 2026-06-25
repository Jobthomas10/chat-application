import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  Paper,
  Avatar,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Forum as ForumIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatRoomCard from '../components/ChatRoomCard';
import useAuth from '../hooks/useAuth';
import { subscribeChatRooms, createChatRoom } from '../services/firestore';
import { getUserInitials } from '../utils/helpers';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, profileData } = useAuth();
  
  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Channels state
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to chat rooms
  useEffect(() => {
    const unsubscribe = subscribeChatRooms((roomsList) => {
      setRooms(roomsList);
    });
    return () => unsubscribe();
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const displayName = profileData?.name || currentUser?.displayName || 'User';
  const photoURL = profileData?.profilePhoto || currentUser?.photoURL || '';
  const bio = profileData?.bio || 'Hey there! I am using this Chat App.';

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar onSidebarToggle={handleSidebarToggle} />

      {/* Main Layout Container */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Responsive Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onClose={handleSidebarToggle}
          variant="temporary" // for mobile drawer popup
        />
        
        {/* Desktop Sidebar (Persistent left side block) */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar variant="persistent" />
        </Box>

        {/* Content Area */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            bgcolor: 'background.chat',
            p: { xs: 2, sm: 4 },
          }}
        >
          <Container maxWidth="lg" sx={{ p: 0 }}>
            
            {/* Premium Welcome Card */}
            <Paper
              elevation={1}
              sx={{
                p: { xs: 3, sm: 4 },
                mb: 4,
                borderRadius: 3,
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'
                    : 'linear-gradient(135deg, #e0e7ff 0%, #ffffff 100%)',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 3,
              }}
            >
              <Avatar
                src={photoURL}
                alt={displayName}
                sx={{ width: 80, height: 80, border: '2px solid', borderColor: 'primary.main' }}
              >
                {getUserInitials(displayName)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Welcome back, {displayName}!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1, maxW: '600px' }}>
                  {bio}
                </Typography>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                  Select or create a channel to start communicating in real-time.
                </Typography>
              </Box>
            </Paper>

            {/* Channels Search & Actions Bar */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Explore Channels
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {rooms.length} active channels available
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  size="small"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    width: { xs: '100%', sm: 250 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Channels Grid */}
            {filteredRooms.length === 0 ? (
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                <ForumIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  No channels found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {searchQuery ? 'Try matching another spelling or clear the search query.' : 'Create the first channel to start a conversation!'}
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {filteredRooms.map((room) => (
                  <Grid item xs={12} sm={6} md={4} key={room.id}>
                    <ChatRoomCard room={room} />
                  </Grid>
                ))}
              </Grid>
            )}

          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
