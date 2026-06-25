import React, { useState, useContext } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  Grid,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { ColorModeContext } from '../App';
import useAuth from '../hooks/useAuth';
import { auth } from '../services/firebase';

const Settings = () => {
  const { currentUser } = useAuth();
  const { mode, toggleColorMode } = useContext(ColorModeContext);

  // Layout states
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notifications preferences states
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('prefSoundNotifications');
    return saved !== 'false';
  });

  const [desktopEnabled, setDesktopEnabled] = useState(() => {
    const saved = localStorage.getItem('prefDesktopNotifications');
    return saved !== 'false';
  });

  // Password reset form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Snackbar Alert state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSoundChange = (e) => {
    const checked = e.target.checked;
    setSoundEnabled(checked);
    localStorage.setItem('prefSoundNotifications', checked.toString());
    setToast({ open: true, message: 'Sound settings updated.', severity: 'success' });
  };

  const handleDesktopChange = (e) => {
    const checked = e.target.checked;
    setDesktopEnabled(checked);
    localStorage.setItem('prefDesktopNotifications', checked.toString());
    setToast({ open: true, message: 'Notification settings updated.', severity: 'success' });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast({ open: true, message: 'Please fill in all password fields.', severity: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ open: true, message: 'New password must be at least 6 characters.', severity: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({ open: true, message: 'New passwords do not match.', severity: 'error' });
      return;
    }

    setLoadingPassword(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user currently logged in.');

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      
      setToast({ open: true, message: 'Password updated successfully!', severity: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setToast({ open: true, message: err.message || 'Failed to update password.', severity: 'error' });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar onSidebarToggle={handleSidebarToggle} />

      {/* Main Panel Content */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Mobile Sidebar */}
        <Sidebar open={sidebarOpen} onClose={handleSidebarToggle} variant="temporary" />

        {/* Desktop Sidebar */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <Sidebar variant="persistent" />
        </Box>

        {/* Content Panel Scroll Frame */}
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
              Settings
            </Typography>

            <Grid container spacing={4}>
              
              {/* Preferences Configuration Left Column */}
              <Grid item xs={12} md={6}>
                
                {/* Visual Settings Card */}
                <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaletteIcon color="primary" /> App Appearance
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={mode === 'dark'}
                        onChange={toggleColorMode}
                        color="primary"
                      />
                    }
                    label={mode === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
                  />
                </Paper>

                {/* Notifications Configurations Card */}
                <Paper elevation={1} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsIcon color="primary" /> Chat Notifications
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={soundEnabled}
                          onChange={handleSoundChange}
                          color="primary"
                        />
                      }
                      label="Play Sound on New Message"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={desktopEnabled}
                          onChange={handleDesktopChange}
                          color="primary"
                        />
                      }
                      label="Enable Desktop Alerts"
                    />
                  </Box>
                </Paper>

              </Grid>

              {/* Password resetting Right Column */}
              <Grid item xs={12} md={6}>
                
                {/* Security Settings Card */}
                <Paper elevation={1} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon color="primary" /> Change Password
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box component="form" onSubmit={handleChangePassword} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      label="Current Password"
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      size="small"
                    />
                    <TextField
                      label="New Password"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      size="small"
                    />
                    <TextField
                      label="Confirm New Password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      size="small"
                    />
                    
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loadingPassword}
                      startIcon={<SaveIcon />}
                      sx={{ py: 1, fontWeight: 700, mt: 1 }}
                    >
                      Update Password
                    </Button>
                  </Box>
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

export default Settings;
