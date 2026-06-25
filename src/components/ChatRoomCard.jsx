import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Button,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Tag as TagIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import { deleteChatRoom } from '../services/firestore';

const ChatRoomCard = ({ room, onDeleteSuccess }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isCreator = room.createdBy === currentUser?.uid;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the room "${room.roomName}"?`)) {
      try {
        await deleteChatRoom(room.id);
        if (onDeleteSuccess) onDeleteSuccess();
      } catch (err) {
        console.error('Failed to delete room:', err);
        alert('Failed to delete room: ' + err.message);
      }
    }
  };

  const handleCardClick = () => {
    navigate(`/room/${room.id}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.shadows[3],
          '& .go-btn': {
            transform: 'translateX(4px)',
          },
        },
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}>
              <TagIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {room.roomName}
            </Typography>
          </Box>
          {isCreator && (
            <Tooltip title="Delete Room">
              <IconButton
                size="small"
                color="error"
                onClick={handleDelete}
                sx={{
                  '&:hover': { bgcolor: 'error.lighter' },
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, mt: 1 }}>
          {room.description || 'No description provided.'}
        </Typography>
      </CardContent>
      <Box
        sx={{
          px: 2,
          pb: 2,
          pt: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {room.createdAt ? `Created ${new Date(room.createdAt.seconds * 1000).toLocaleDateString()}` : ''}
        </Typography>
        <Button
          size="small"
          endIcon={
            <ArrowForwardIcon
              className="go-btn"
              sx={{ transition: 'transform 0.2s', fontSize: 16 }}
            />
          }
          sx={{ fontWeight: 600 }}
        >
          Join Room
        </Button>
      </Box>
    </Card>
  );
};

export default ChatRoomCard;
