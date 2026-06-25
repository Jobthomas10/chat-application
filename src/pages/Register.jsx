import React, { useState, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Alert,
  Snackbar,
  IconButton,
} from '@mui/material';
import {
  PersonAdd as RegisterIcon,
  PhotoCamera as PhotoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { registerWithEmail } from '../services/auth';

const Register = () => {
  const navigate = useNavigate();

  // Registration form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Toast State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const handleToastClose = () => setToast({ ...toast, open: false });

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file for your avatar.');
        return;
      }
      setPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(name.trim(), email.trim(), password, photoFile, bio.trim());
      setToast({ open: true, message: 'Account registered successfully!', severity: 'success' });
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 10% 20%, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 90.1%)'
            : 'radial-gradient(circle at 10% 20%, rgb(241, 245, 249) 0%, rgb(226, 232, 240) 90.1%)',
        p: 2,
        py: 4,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 450,
          borderRadius: 3,
          boxShadow: 8,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo/Branding */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
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
            <Typography variant="body2" color="text.secondary">
              Register a new account to get started.
            </Typography>
          </Box>

          {/* Form Alert Errors */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Registration Form */}
          <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            
            {/* Avatar Selector section */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1, gap: 1 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={photoPreviewUrl}
                  sx={{ width: 80, height: 80, border: '2px dashed rgba(255,255,255,0.2)' }}
                />
                {photoPreviewUrl ? (
                  <IconButton
                    size="small"
                    onClick={handleClearPhoto}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: -8,
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <IconButton
                    color="primary"
                    aria-label="upload picture"
                    component="label"
                    sx={{
                      position: 'absolute',
                      bottom: -8,
                      right: -8,
                      bgcolor: 'background.paper',
                      boxShadow: 1,
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
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Upload Profile Picture (Optional)
              </Typography>
            </Box>

            <TextField
              label="Full Name *"
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
            <TextField
              label="Email Address *"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <TextField
              label="Password *"
              type="password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
            />
            <TextField
              label="Confirm Password *"
              type="password"
              required
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
            />
            <TextField
              label="Biography"
              fullWidth
              multiline
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other users a bit about yourself..."
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              endIcon={<RegisterIcon />}
              sx={{ py: 1.2, mt: 1, fontWeight: 700 }}
            >
              Sign Up
            </Button>
          </Box>

          {/* Login Redirect */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <RouterLink to="/login" style={{ textDecoration: 'none', color: '#4f46e5', fontWeight: 600 }}>
                Sign In
              </RouterLink>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Toast Notification banner */}
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleToastClose}>
        <Alert onClose={handleToastClose} severity={toast.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Register;
