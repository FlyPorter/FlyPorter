import React from 'react';
import { Button } from '../../../components/ui/button';

interface Notification {
  id: number;
  message: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read?: boolean;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading?: boolean;
  error?: string | null;
  onMarkAsRead?: (notificationId: number) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (notificationId: number) => void;
  onClose?: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isLoading = false,
  error = null,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (notificationId: number) => {
    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    }
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };


  if (isLoading) {
    return (
      <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 h-[28rem]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
        </div>
        <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 h-[28rem]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
        </div>
        <div className="p-4 text-center text-red-500 h-full flex items-center justify-center">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 h-[28rem] flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-blue-600 hover:text-blue-700"
          >
            Mark all as read
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
            <p>No notifications</p>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default NotificationDropdown;
