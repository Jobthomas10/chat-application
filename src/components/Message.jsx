import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Paper,
  Tooltip,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  PushPin as PinIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import { formatChatTimestamp, getUserInitials } from '../utils/helpers';
import {
  editMessage,
  deleteMessage,
  toggleMessageReaction,
  togglePinMessage,
} from '../services/firestore';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

const Message = ({ message, roomId, onReplyClick }) => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const isOwnMessage = message.senderId === currentUser?.uid;

  const handleEdit = async () => {
    if (!editText.trim() || editText === message.text) {
      setIsEditing(false);
      return;
    }
    try {
      await editMessage(roomId, message.messageId, editText.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(roomId, message.messageId);
      } catch (err) {
        console.error('Failed to delete message:', err);
      }
    }
  };

  const handlePin = async () => {
    try {
      await togglePinMessage(roomId, message.messageId, message.pinned);
    } catch (err) {
      console.error('Failed to pin/unpin message:', err);
    }
  };

  const handleReaction = async (emoji) => {
    if (!currentUser) return;
    try {
      await toggleMessageReaction(roomId, message.messageId, emoji, currentUser.uid);
      setEmojiAnchorEl(null);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const formatReactions = () => {
    if (!message.reactions) return [];
    return Object.entries(message.reactions).map(([emoji, uids]) => ({
      emoji,
      count: uids.length,
      hasReacted: currentUser ? uids.includes(currentUser.uid) : false,
    }));
  };

  const reactions = formatReactions();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mb: 2,
        px: 2,
        py: 0.5,
        position: 'relative',
        '&:hover': {
          bgcolor: 'action.hover',
          '& .message-actions': { opacity: 1 },
        },
      }}
    >
      {/* Reply Reference Header */}
      {message.replyTo && (
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 6, mb: 0.5, gap: 1 }}>
          <Box sx={{ borderLeft: '2px solid', borderColor: 'divider', height: 10, width: 10, borderTop: '2px solid' }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {message.replyTo.senderName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }} noWrap>
            {`"${message.replyTo.text}"`}
          </Typography>
        </Box>
      )}

      {/* Main Message Block */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* User Avatar */}
        <Avatar
          src={message.senderPhoto}
          alt={message.senderName}
          sx={{ width: 40, height: 40, mr: 2, mt: 0.5 }}
        >
          {getUserInitials(message.senderName)}
        </Avatar>

        {/* Content Column */}
        <Box sx={{ flexGrow: 1 }}>
          {/* Sender Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isOwnMessage ? 'primary.main' : 'text.primary' }}>
              {message.senderName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatChatTimestamp(message.createdAt)}
            </Typography>
            {message.edited && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                (edited)
              </Typography>
            )}
            {message.pinned && (
              <Tooltip title="Pinned Message">
                <PinIcon sx={{ fontSize: 14, color: 'primary.main', transform: 'rotate(45deg)' }} />
              </Tooltip>
            )}
          </Box>

          {/* Message Text/Image */}
          {isEditing ? (
            <Box sx={{ mt: 1, width: '100%' }}>
              <TextField
                fullWidth
                multiline
                size="small"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" variant="contained" onClick={handleEdit}>
                  Save
                </Button>
                <Button size="small" variant="outlined" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              {message.text && (
                <Typography variant="body1" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </Typography>
              )}
              
              {message.imageUrl && (
                <Box sx={{ mt: 1, maxWidth: 'min(100%, 400px)', borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  <img
                    src={message.imageUrl}
                    alt="shared"
                    style={{ width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in' }}
                    onClick={() => window.open(message.imageUrl, '_blank')}
                  />
                </Box>
              )}
            </Box>
          )}

          {/* Reactions Row */}
          {reactions.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {reactions.map((r, i) => (
                <Chip
                  key={i}
                  label={`${r.emoji} ${r.count}`}
                  size="small"
                  onClick={() => handleReaction(r.emoji)}
                  color={r.hasReacted ? 'primary' : 'default'}
                  variant={r.hasReacted ? 'filled' : 'outlined'}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: r.hasReacted ? 'primary.dark' : 'action.hover',
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Hover Actions Menu (Desktop Floating Panel) */}
      <Paper
        className="message-actions"
        elevation={2}
        sx={{
          position: 'absolute',
          top: -12,
          right: 20,
          display: 'flex',
          gap: 0.5,
          p: 0.5,
          opacity: 0,
          transition: 'opacity 0.2s',
          zIndex: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
        }}
      >
        {/* Emoji Selector */}
        <IconButton size="small" onClick={(e) => setEmojiAnchorEl(e.currentTarget)} title="Add Reaction">
          <EmojiIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={emojiAnchorEl}
          open={Boolean(emojiAnchorEl)}
          onClose={() => setEmojiAnchorEl(null)}
          PaperProps={{ sx: { display: 'flex', flexDirection: 'row', p: 0.5 } }}
        >
          {EMOJI_LIST.map((emoji) => (
            <IconButton key={emoji} size="small" onClick={() => handleReaction(emoji)}>
              {emoji}
            </IconButton>
          ))}
        </Menu>

        {/* Reply */}
        <IconButton
          size="small"
          onClick={() => onReplyClick({ messageId: message.messageId, text: message.text, senderName: message.senderName })}
          title="Reply"
        >
          <ReplyIcon fontSize="small" />
        </IconButton>

        {/* Pin */}
        <IconButton size="small" onClick={handlePin} title={message.pinned ? 'Unpin Message' : 'Pin Message'}>
          <PinIcon fontSize="small" sx={{ transform: message.pinned ? 'none' : 'rotate(45deg)', color: message.pinned ? 'primary.main' : 'inherit' }} />
        </IconButton>

        {/* Edit / Delete / More menu */}
        {isOwnMessage && (
          <>
            <IconButton size="small" onClick={() => setIsEditing(true)} title="Edit Message">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleDelete} color="error" title="Delete Message">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Message;
