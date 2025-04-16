import React from 'react';
import { useNotification } from '../context/NotificationContext';
import Notification from './Notification';

const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          type={notification.type}
          message={notification.message}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
