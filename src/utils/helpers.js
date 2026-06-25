/**
 * Formats a Firestore Timestamp or Date object into a readable date/time string.
 * Output examples: "Today at 5:30 PM", "Yesterday at 9:15 AM", "June 25, 2026"
 */
export const formatChatTimestamp = (timestamp) => {
  if (!timestamp) return '';

  // Handle Firestore Timestamp
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (messageDate.getTime() === today.getTime()) {
    return `Today at ${timeString}`;
  } else if (messageDate.getTime() === yesterday.getTime()) {
    return `Yesterday at ${timeString}`;
  } else {
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeString}`;
  }
};

/**
 * Returns user initials from a full name.
 * e.g., "John Doe" -> "JD", "Single" -> "S"
 */
export const getUserInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Limit characters and add ellipsis if needed.
 */
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
