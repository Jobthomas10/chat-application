import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Forum as ForumIcon,
} from '@mui/icons-material';
import { ColorModeContext } from '../App';
import ProfileMenu from './ProfileMenu';

const Navbar = ({ onSidebarToggle, roomName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleColorMode } = useContext(ColorModeContext);

  // Notifications Popover State
  const [notiAnchorEl, setNotiAnchorEl] = useState(null);
  const openNoti = Boolean(notiAnchorEl);

  // Mock Notifications for Slack/Discord activity feel
  const mockNotifications = [
    { id: 1, sender: 'Alice Smith', room: 'General Discussion', text: 'Hey, are we still on for today?' },
    { id: 2, sender: 'Bob Jones', room: 'Project Alpha', text: 'I updated the Firebase credentials.' },
  ];

  const handleNotiClick = (event) => {
    setNotiAnchorEl(event.currentTarget);
  };

  const handleNotiClose = () => {
    setNotiAnchorEl(null);
  };

  const handleNotiItemClick = () => {
    handleNotiClose();
    navigate('/');
  };

  const showBackButton = location.pathname.includes('/room/');

  return (
    <AppBar
      position="static"
      color="default"
      elevation={1}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
        {/* Left Section: Mobile Menu & Title */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {onSidebarToggle && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onSidebarToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Box
            onClick={() => navigate('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              gap: 1,
            }}
          >
            <ForumIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.5px',
                background: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'linear-gradient(90deg, #818cf8 0%, #22d3ee 100%)'
                    : 'linear-gradient(90deg, #4f46e5 0%, #0891b2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ChatCord
            </Typography>
          </Box>

          {roomName && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 3 }}>
              <Divider orientation="vertical" flexItem sx={{ mx: 2, height: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                # {roomName}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Right Section: Tools, Notifications, Theme, Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Theme Toggle */}
          <IconButton onClick={toggleColorMode} color="inherit" title="Toggle light/dark theme">
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>

          {/* Notifications */}
          <IconButton color="inherit" onClick={handleNotiClick}>
            <Badge badgeContent={mockNotifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Popover
            open={openNoti}
            anchorEl={notiAnchorEl}
            onClose={handleNotiClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: { width: 300, mt: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' },
            }}
          >
            <Box sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Notifications
              </Typography>
            </Box>
            <Divider />
            <List sx={{ p: 0 }}>
              {mockNotifications.map((noti) => (
                <ListItem
                  key={noti.id}
                  button
                  onClick={handleNotiItemClick}
                  sx={{ py: 1, '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                      {noti.sender.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {noti.sender}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {`in #${noti.room}: ${noti.text}`}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Popover>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24 }} />

          {/* Profile Menu */}
          <ProfileMenu />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
