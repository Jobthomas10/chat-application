import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import {
  Send as SendIcon,
  Image as ImageIcon,
  EmojiEmotions as EmojiIcon,
  Close as CloseIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import { updateTypingStatus } from '../services/firestore';

const POPULAR_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '🖐️', '✋',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💖',
  '🔥', '✨', '🎉', '🌟', '💥', '🚀', '💯', '👏', '🙌', '🙏'
];

const MessageInput = ({ roomId, onSendMessage, replyTo, onCancelReply }) => {
  const { currentUser, profileData } = useAuth();
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef(null);
  const textFieldRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const displayName = profileData?.name || currentUser?.displayName || 'User';

  // Handle typing indicator trigger
  const handleTextChange = (e) => {
    setText(e.target.value);

    if (!currentUser || !roomId) return;

    // Send typing = true immediately
    updateTypingStatus(roomId, currentUser.uid, displayName, true);

    // Reset timeout to send typing = false
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      updateTypingStatus(roomId, currentUser.uid, displayName, false);
    }, 3000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      setSelectedImage(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !selectedImage) return;

    // Turn off typing indicator immediately
    if (currentUser && roomId) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      updateTypingStatus(roomId, currentUser.uid, displayName, false);
    }

    const messagePayload = {
      text: text.trim(),
      imageFile: selectedImage,
    };

    setText('');
    handleClearImage();
    
    if (onSendMessage) {
      await onSendMessage(messagePayload);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji) => {
    const input = textFieldRef.current.querySelector('textarea');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentText = text;
    
    const newText = currentText.substring(0, start) + emoji + currentText.substring(end);
    setText(newText);
    setShowEmojiPicker(false);
    
    // Focus back on text area and set selection caret
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  // Clean up references on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  return (
    <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      
      {/* Reply Reference Preview Bar */}
      {replyTo && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover', p: 1, mb: 1, borderRadius: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReplyIcon fontSize="small" color="primary" />
            <Typography variant="body2" color="text.secondary">
              Replying to <strong>{replyTo.senderName}</strong>: <span style={{ fontStyle: 'italic' }}>{`"${replyTo.text}"`}</span>
            </Typography>
          </Box>
          <IconButton size="small" onClick={onCancelReply}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Selected Image Preview Thumbnail */}
      {imagePreviewUrl && (
        <Box sx={{ display: 'flex', position: 'relative', width: 'fit-content', mb: 1.5 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <img src={imagePreviewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
          <IconButton
            size="small"
            onClick={handleClearImage}
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 1,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Main input control form */}
      <Box component="form" onSubmit={handleSend} sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, position: 'relative' }}>
        
        {/* Attachment Actions */}
        <Box sx={{ display: 'flex' }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
          <Tooltip title="Upload Image">
            <IconButton onClick={() => fileInputRef.current.click()} color="primary">
              <ImageIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Emojis">
            <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} color="primary">
              <EmojiIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Text Area */}
        <TextField
          ref={textFieldRef}
          fullWidth
          multiline
          maxRows={4}
          value={text}
          onChange={handleTextChange}
          onKeyPress={handleKeyPress}
          placeholder={selectedImage ? "Add a message (optional)..." : "Write something... (Shift+Enter for new line)"}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
            },
          }}
        />

        {/* Send Button */}
        <IconButton
          type="submit"
          color="primary"
          disabled={!text.trim() && !selectedImage}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 3,
            p: 1,
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled',
            },
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>

        {/* Custom Emojis Drawer Overlay */}
        {showEmojiPicker && (
          <Paper
            elevation={3}
            sx={{
              position: 'absolute',
              bottom: 50,
              left: 40,
              width: 280,
              maxHeight: 200,
              overflowY: 'auto',
              p: 1,
              zIndex: 10,
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: 0.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {POPULAR_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                size="small"
                onClick={() => handleEmojiClick(emoji)}
                sx={{
                  minWidth: 0,
                  p: 0.5,
                  fontSize: '1.2rem',
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {emoji}
              </Button>
            ))}
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default MessageInput;
