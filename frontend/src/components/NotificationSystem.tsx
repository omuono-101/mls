import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bell, AlertTriangle, CheckCircle, X,
  MessageSquare, BookOpen, FileText, Users,
  Eye, EyeOff, Check
} from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_critical: boolean;
  is_read: boolean;
  created_at: string;
  link?: string;
  sender_role?: string;
}

interface NotificationSystemProps {
  showInDashboard?: boolean;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ showInDashboard = false }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [criticalNotifications, setCriticalNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState({ total: 0, critical: 0 });

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('notifications/');
      setNotifications(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('notifications/unread_count/');
      setUnreadCount(response.data);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchCriticalNotifications = async () => {
    try {
      const response = await api.get('notifications/critical_notifications/');
      setCriticalNotifications(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching critical notifications:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`notifications/${notificationId}/mark_as_read/`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setCriticalNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      for (const notification of unreadNotifications) {
        await api.post(`notifications/${notification.id}/mark_as_read/`);
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setCriticalNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string, isCritical: boolean) => {
    if (isCritical) return <AlertTriangle size={18} className="text-red-500" />;

    switch (type) {
      case 'lesson': return <BookOpen size={18} className="text-blue-500" />;
      case 'assessment': return <FileText size={18} className="text-green-500" />;
      case 'enrollment': return <Users size={18} className="text-purple-500" />;
      case 'approval': return <CheckCircle size={18} className="text-green-500" />;
      default: return <MessageSquare size={18} className="text-gray-500" />;
    }
  };

  const getReadStatusIcon = (isRead: boolean) => {
    return isRead ? <EyeOff size={14} className="text-gray-400" /> : <Eye size={14} className="text-blue-500" />;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Dashboard view - show critical notifications prominently
  if (showInDashboard) {
    useEffect(() => {
      fetchCriticalNotifications();
    }, []);

    if (criticalNotifications.length === 0) return null;

    return (
      <div className="card-premium animate-fade-in" style={{ padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', borderLeft: '4px solid #f43f5e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertTriangle size={20} className="text-red-500" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Critical Notifications</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {criticalNotifications.slice(0, 3).map(notification => (
            <div
              key={notification.id}
              className="glass"
              style={{
                padding: '1rem',
                borderRadius: '12px',
                background: notification.is_read ? 'var(--bg-muted)' : 'rgba(244, 63, 94, 0.05)',
                border: notification.is_read ? 'none' : '1px solid rgba(244, 63, 94, 0.2)',
                cursor: 'pointer'
              }}
              onClick={() => markAsRead(notification.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{notification.title}</h4>
                {getReadStatusIcon(notification.is_read)}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                {notification.message}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formatTimeAgo(notification.created_at)}
              </div>
            </div>
          ))}
        </div>

        {criticalNotifications.length > 3 && (
          <button
            onClick={() => setShowDropdown(true)}
            className="btn btn-outline"
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
          >
            View All Critical Notifications ({criticalNotifications.length})
          </button>
        )}
      </div>
    );
  }

  // Standard notification bell component
  return (
    <div style={{ position: 'relative' }}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
          borderRadius: '8px',
          color: 'var(--text-main)'
        }}
        className="hover-bg"
      >
        <Bell size={20} />
        {unreadCount.total > 0 && (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: unreadCount.critical > 0 ? '#f43f5e' : '#3b82f6',
            color: 'white',
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '0.7rem',
            fontWeight: 700,
            minWidth: '18px',
            textAlign: 'center'
          }}>
            {unreadCount.total > 99 ? '99+' : unreadCount.total}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '400px',
          maxHeight: '500px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Notifications</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {unreadCount.total > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--primary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  className="hover-bg"
                >
                  <Check size={14} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px'
                }}
                className="hover-bg"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                    background: notification.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                    cursor: 'pointer'
                  }}
                  className="hover-bg"
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    {getNotificationIcon(notification.notification_type, notification.is_critical)}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <h4 style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          margin: 0
                        }}>
                          {notification.title}
                        </h4>
                        {getReadStatusIcon(notification.is_read)}
                      </div>
                      <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.4,
                        margin: '0.25rem 0'
                      }}>
                        {notification.message}
                      </p>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span>{formatTimeAgo(notification.created_at)}</span>
                        {notification.sender_role && (
                          <span style={{
                            background: 'var(--bg-muted)',
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '0.65rem'
                          }}>
                            from {notification.sender_role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationSystem;
