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
      <div className="absolute right-0 mt-2 w-96 bg-white/90 backdrop-blur-sm border border-teal-200/50 rounded-lg shadow-2xl z-50 h-[28rem]">
        <div className="p-4 border-b border-teal-200/50 bg-gradient-to-r from-teal-50 to-cyan-50">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Notifications</h3>
        </div>
        <div className="p-4 text-center text-teal-700 h-full flex items-center justify-center">
          <p className="font-medium">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute right-0 mt-2 w-96 bg-white/90 backdrop-blur-sm border border-teal-200/50 rounded-lg shadow-2xl z-50 h-[28rem]">
        <div className="p-4 border-b border-teal-200/50 bg-gradient-to-r from-teal-50 to-cyan-50">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Notifications</h3>
        </div>
        <div className="p-4 text-center text-red-500 h-full flex items-center justify-center">
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white/90 backdrop-blur-sm border border-teal-200/50 rounded-lg shadow-2xl z-50 h-[28rem] flex flex-col">
      <div className="p-4 border-b border-teal-200/50 bg-gradient-to-r from-teal-50 to-cyan-50 flex justify-between items-center flex-shrink-0">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-teal-700 to-cyan-700 bg-clip-text text-transparent">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="text-teal-600 hover:text-teal-800 hover:bg-teal-100 font-medium"
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
              className={`p-4 border-b border-teal-100/50 hover:bg-teal-50/50 cursor-pointer transition-colors ${
                !notification.read ? 'bg-gradient-to-r from-teal-50/50 to-cyan-50/50' : ''
              }`}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`text-sm ${!notification.read ? 'text-teal-900 font-medium' : 'text-teal-700'}`}>{notification.message}</p>
                  <p className="text-xs text-teal-600 mt-1">{notification.time}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {!notification.read && (
                    <div className="w-2 h-2 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full shadow-sm"></div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-teal-600 h-full flex items-center justify-center">
            <p className="font-medium">No notifications</p>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default NotificationDropdown;
