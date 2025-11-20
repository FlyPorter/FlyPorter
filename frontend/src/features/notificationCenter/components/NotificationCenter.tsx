import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/button';
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { 
  getStoredNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification,
  type Notification 
} from '../../../utils/notificationStorage';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Load notifications from localStorage
  useEffect(() => {
    const loadNotifications = () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const storedNotifications = getStoredNotifications();
        setNotifications(storedNotifications);
      } catch (err) {
        setError('Failed to load notifications');
        console.error('Error loading notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
    
    // Listen for storage changes (when notifications are added from other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'flyporter_notifications') {
        loadNotifications();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (for same-tab updates)
    const handleNotificationUpdate = () => {
      loadNotifications();
    };
    
    window.addEventListener('notificationUpdated', handleNotificationUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notificationUpdated', handleNotificationUpdate);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = (notificationId: number) => {
    markNotificationAsRead(notificationId);
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleDeleteNotification = (notificationId: number) => {
    deleteNotification(notificationId);
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };


  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`relative ${className}`} ref={notificationRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative cursor-pointer hover:bg-teal-50 text-teal-700 hover:text-teal-900"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-md">
            {unreadCount}
          </span>
        )}
      </Button>
      
      {showNotifications && (
        <NotificationDropdown
          notifications={notifications}
          isLoading={isLoading}
          error={error}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDeleteNotification={handleDeleteNotification}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter;
