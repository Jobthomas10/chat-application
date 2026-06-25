import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Tag as TagIcon,
  Search as SearchIcon,
  Forum as ForumIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { createChatRoom, subscribeChatRooms } from '../services/firestore';
import useAuth from '../hooks/useAuth';

const Sidebar = ({ open, onClose, variant = 'temporary' }) => {
  const navigate = useNavigate();
  const { roomId: currentRoomId } = useParams();
  const { currentUser } = useAuth();
  
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Subscribe to chat rooms
  useEffect(() => {
    const unsubscribe = subscribeChatRooms((roomsList) => {
      setRooms(roomsList);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim() || !currentUser) return;

    setLoading(true);
    try {
      const roomId = await createChatRoom(
        newRoomName.trim(),
        newRoomDescription.trim(),
        currentUser.uid
      );
      setNewRoomName('');
      setNewRoomDescription('');
      setCreateDialogOpen(false);
      navigate(`/room/${roomId}`);
    } catch (err) {
      console.error('Error creating chat room:', err);
      alert('Failed to create room: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.roomName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.paper' }}>
      {/* Header / Brand */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <ForumIcon color="primary" /> Channels
        </Typography>
        <Tooltip title="Create New Channel">
          <IconButton size="small" onClick={() => setCreateDialogOpen(true)} color="primary">
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Dashboard Shortcut */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            selected={!currentRoomId}
            onClick={() => {
              navigate('/');
              if (onClose) onClose();
            }}
            sx={{
              borderRadius: 1.5,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" primaryTypographyProps={{ fontWeight: 600 }} />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ mb: 1 }} />

      {/* Search Channels */}
      <Box sx={{ px: 2, mb: 1 }}>
        <TextField
          size="small"
          placeholder="Search channels..."
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'slate-800' : 'grey.100',
            },
          }}
        />
      </Box>

      {/* Channels List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1 }}>
        <List>
          {filteredRooms.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
              No channels found
            </Typography>
          ) : (
            filteredRooms.map((room) => (
              <ListItem key={room.id} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={currentRoomId === room.id}
                  onClick={() => {
                    navigate(`/room/${room.id}`);
                    if (onClose) onClose();
                  }}
                  sx={{
                    borderRadius: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <TagIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={room.roomName}
                    primaryTypographyProps={{
                      fontWeight: currentRoomId === room.id ? 700 : 500,
                      noWrap: true,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Box>

      {/* Create Room Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Channel</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleCreateRoom} sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Channel Name"
              required
              fullWidth
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="e.g. general"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              placeholder="What is this channel about?"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreateRoom} variant="contained" disabled={loading || !newRoomName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  if (variant === 'persistent') {
    return (
      <Box sx={{ width: 260, borderRight: '1px solid', borderColor: 'divider', height: '100%' }}>
        {sidebarContent}
      </Box>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      PaperProps={{
        sx: { width: 260 },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;
