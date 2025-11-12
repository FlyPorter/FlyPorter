import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/button';
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

interface Notification {
  id: number;
  message: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read?: boolean;
  createdAt?: string;
}

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Mock data for development
  const getMockNotifications = (): Notification[] => [
    {
      id: 1,
      message: "Your flight to Toronto has been cancelled",
      time: "2 hours ago",
      type: "error",
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 2,
      message: "Seat change request processed",
      time: "1 day ago",
      type: "info",
      read: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 3,
      message: "Payment received for booking #12345",
      time: "2 days ago",
      type: "success",
      read: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 4,
      message: "Flight delay notification for tomorrow's departure",
      time: "3 days ago",
      type: "warning",
      read: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Load notifications on component mount
  useEffect(() => {
    const loadNotifications = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // For now, use mock data. In production, replace with actual API call
        const mockNotifications = getMockNotifications();
        setNotifications(mockNotifications);
      } catch (err) {
        setError('Failed to load notifications');
        console.error('Error loading notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
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
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const handleDeleteNotification = (notificationId: number) => {
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
