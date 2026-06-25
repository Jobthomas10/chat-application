import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  Grid,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  PhotoCamera as PhotoIcon,
  Save as SaveIcon,
  Tag as TagIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import { updateProfileData } from '../services/auth';
import { subscribeChatRooms } from '../services/firestore';
import { getUserInitials } from '../utils/helpers';

const Profile = () => {
  const { currentUser, profileData } = useAuth();
  
  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  
  // Rooms created list
  const [myRooms, setMyRooms] = useState([]);
  const fileInputRef = useRef(null);

  // Populate data
  useEffect(() => {
    if (profileData) {
      setName(profileData.name || '');
      setBio(profileData.bio || '');
      setPhotoPreviewUrl(profileData.profilePhoto || '');
    }
  }, [profileData]);

  // Subscribe to rooms to filter those created by user
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = subscribeChatRooms((roomsList) => {
      setMyRooms(roomsList.filter((room) => room.createdBy === currentUser.uid));
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setToast({ open: true, message: 'Please select an image file.', severity: 'error' });
        return;
      }
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast({ open: true, message: 'Display Name is required.', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      await updateProfileData(name.trim(), bio.trim(), photoFile);
      setToast({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      setPhotoFile(null);
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: err.message || 'Failed to update profile.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const displayName = profileData?.name || currentUser?.displayName || 'User';

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Navbar */}
      <Navbar onSidebarToggle={handleSidebarToggle} />

      {/* Main Container */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Mobile Sidebar */}
        <Sidebar open={sidebarOpen} onClose={handleSidebarToggle} variant="temporary" />

        {/* Desktop Sidebar */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar variant="persistent" />
        </Box>

        {/* Content Pane */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            bgcolor: 'background.chat',
            p: { xs: 2, sm: 4 },
          }}
        >
          <Container maxWidth="md" sx={{ p: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
              My Profile
            </Typography>

            <Grid container spacing={4}>
              {/* Profile Editor Card */}
              <Grid item xs={12} md={7}>
                <Paper elevation={1} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    
                    {/* Avatar picker container */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={photoPreviewUrl}
                          sx={{ width: 100, height: 100, border: '3px solid', borderColor: 'primary.main' }}
                        >
                          {getUserInitials(displayName)}
                        </Avatar>
                        <IconButton
                          color="primary"
                          component="label"
                          sx={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            bgcolor: 'background.paper',
                            boxShadow: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <input
                            hidden
                            accept="image/*"
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoSelect}
                          />
                          <PhotoIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Click the camera to upload a new image
                      </Typography>
                    </Box>

                    <Divider />

                    <TextField
                      label="Email Address"
                      disabled
                      value={currentUser?.email || ''}
                      helperText="Login email cannot be changed"
                    />

                    <TextField
                      label="Display Name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />

                    <TextField
                      label="Biography"
                      multiline
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={<SaveIcon />}
                      sx={{ py: 1.2, fontWeight: 700 }}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* Sidebar Statistics/Rooms Info */}
              <Grid item xs={12} md={5}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Account Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Joined: {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Role: Standard Member
                  </Typography>
                </Paper>

                <Paper elevation={1} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    My Channels ({myRooms.length})
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  {myRooms.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      You haven't created any channels yet.
                    </Typography>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {myRooms.map((room) => (
                        <ListItem
                          key={room.id}
                          button
                          onClick={() => navigate(`/room/${room.id}`)}
                          sx={{ px: 1, py: 0.5, borderRadius: 1.5, '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <TagIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={room.roomName} primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>

      {/* Alert toast notifications banner */}
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
