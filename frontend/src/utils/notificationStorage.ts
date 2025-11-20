export interface Notification {
  id: number;
  message: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read?: boolean;
  createdAt?: string;
}

const NOTIFICATION_STORAGE_KEY = 'flyporter_notifications';
const MAX_NOTIFICATIONS = 50; // Keep only the latest 50 notifications

/**
 * Get all notifications from localStorage
 */
export const getStoredNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (!stored) return [];
    
    const notifications: Notification[] = JSON.parse(stored);
    // Sort by createdAt (newest first)
    return notifications.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error reading notifications from storage:', error);
    return [];
  }
};

/**
 * Save notifications to localStorage
 */
export const saveNotifications = (notifications: Notification[]): void => {
  try {
    // Keep only the latest MAX_NOTIFICATIONS
    const limitedNotifications = notifications.slice(0, MAX_NOTIFICATIONS);
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(limitedNotifications));
  } catch (error) {
    console.error('Error saving notifications to storage:', error);
  }
};

/**
 * Add a new notification
 */
export const addNotification = (notification: Omit<Notification, 'id' | 'time' | 'createdAt'>): Notification => {
  const notifications = getStoredNotifications();
  
  // Generate a unique ID
  const maxId = notifications.length > 0 
    ? Math.max(...notifications.map(n => n.id))
    : 0;
  const newId = maxId + 1;
  
  const now = new Date();
  const timeAgo = formatTimeAgo(now);
  
  const newNotification: Notification = {
    id: newId,
    ...notification,
    time: timeAgo,
    createdAt: now.toISOString(),
    read: false
  };
  
  // Add to the beginning of the array (newest first)
  const updatedNotifications = [newNotification, ...notifications];
  saveNotifications(updatedNotifications);
  
  return newNotification;
};

/**
 * Mark a notification as read
 */
export const markNotificationAsRead = (notificationId: number): void => {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  saveNotifications(updated);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = (): void => {
  const notifications = getStoredNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
};

/**
 * Delete a notification
 */
export const deleteNotification = (notificationId: number): void => {
  const notifications = getStoredNotifications();
  const updated = notifications.filter(n => n.id !== notificationId);
  saveNotifications(updated);
};

/**
 * Format time ago string
 */
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  
  // For older notifications, show the date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

