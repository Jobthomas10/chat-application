import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Login as LoginIcon,
  Mail as MailIcon,
} from '@mui/icons-material';
import { signInWithEmail, signInWithGoogle, resetPassword, signInAsGuest } from '../services/auth';

const Login = () => {
  const navigate = useNavigate();
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password Reset State
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Toast notifications State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const handleToastClose = () => setToast({ ...toast, open: false });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signInWithEmail(email, password);
      setToast({ open: true, message: 'Logged in successfully!', severity: 'success' });
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      setToast({ open: true, message: 'Logged in successfully with Google!', severity: 'success' });
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAsGuest();
      setToast({ open: true, message: 'Logged in as Guest!', severity: 'success' });
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in as Guest. Make sure Anonymous auth is enabled in your Firebase console.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;

    setResetLoading(true);
    try {
      await resetPassword(resetEmail);
      setToast({
        open: true,
        message: 'Password reset link sent to your email!',
        severity: 'success',
      });
      setResetOpen(false);
      setResetEmail('');
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setResetLoading(false);
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
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 400,
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
              Sign in to join rooms and start chatting.
            </Typography>
          </Box>

          {/* Form Alert Errors */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email Address"
              type="email"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              type="password"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => setResetOpen(true)}
                sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 600 }}
              >
                Forgot Password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              endIcon={<LoginIcon />}
              sx={{ py: 1.2, fontWeight: 700 }}
            >
              Sign In
            </Button>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Google Login Option */}
          <Button
            variant="outlined"
            fullWidth
            size="large"
            onClick={handleGoogleSignIn}
            disabled={loading}
            startIcon={<GoogleIcon />}
            sx={{
              py: 1.2,
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'text.secondary',
                bgcolor: 'action.hover',
              },
            }}
          >
            Sign in with Google
          </Button>

          {/* Guest Login Option */}
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            size="large"
            onClick={handleGuestSignIn}
            disabled={loading}
            sx={{
              mt: 2,
              py: 1.2,
              fontWeight: 700,
            }}
          >
            Continue as Guest
          </Button>

          {/* Register Redirect */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              New to ChatCord?{' '}
              <Link
                component={RouterLink}
                to="/register"
                sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 600 }}
              >
                Create an account
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Password</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter your email address and we'll send you a link to reset your password.
          </DialogContentText>
          <Box component="form" onSubmit={handleResetPassword}>
            <TextField
              label="Email Address"
              type="email"
              required
              fullWidth
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="you@example.com"
              InputProps={{
                startAdornment: <MailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResetOpen(false)} disabled={resetLoading}>
            Cancel
          </Button>
          <Button onClick={handleResetPassword} variant="contained" disabled={resetLoading || !resetEmail}>
            Send Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert toast notifier */}
      <Snackbar open={toast.open} autoHideDuration={3000} onClose={handleToastClose}>
        <Alert onClose={handleToastClose} severity={toast.severity} sx={{ width: '100%', borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
