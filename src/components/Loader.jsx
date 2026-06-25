import React from 'react';
import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';

const Loader = ({ fullPage, skeleton, rows = 3, typing }) => {
  if (fullPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <CircularProgress size={50} thickness={4} color="primary" />
        <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
          Loading Chat Application...
        </Typography>
      </Box>
    );
  }

  if (skeleton) {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        {[...Array(rows)].map((_, i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Skeleton variant="text" width="30%" height={24} />
            </Box>
            <Skeleton variant="rectangular" width="80%" height={60} sx={{ borderRadius: 2, ml: 7 }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (typing) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          py: 1,
          px: 2,
          borderRadius: 2,
          backgroundColor: 'background.paper',
          width: 'fit-content',
          boxShadow: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            backgroundColor: 'text.secondary',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '-0.32s',
            '@keyframes bounce': {
              '0%, 80%, 100%': { transform: 'scale(0)' },
              '40%': { transform: 'scale(1)' },
            },
          }}
        />
        <Box
          sx={{
            width: 6,
            height: 6,
            backgroundColor: 'text.secondary',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '-0.16s',
          }}
        />
        <Box
          sx={{
            width: 6,
            height: 6,
            backgroundColor: 'text.secondary',
            borderRadius: '50%',
            animation: 'bounce 1.4s infinite ease-in-out both',
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <CircularProgress size={30} />
    </Box>
  );
};

export default Loader;
