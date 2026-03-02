import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bell, Send, Users, UserCheck, UserPlus, BookOpen, FileText,
  AlertTriangle, Check, X, Clock
} from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_activated: boolean;
}

interface SendNotificationProps {
  onClose?: () => void;
}

const SendNotification: React.FC<SendNotificationProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    sendType: 'role', // 'role' or 'specific'
    targetRole: '',
    selectedUsers: [] as number[],
    title: '',
    message: '',
    notificationType: 'general',
    isCritical: false,
    link: '',
    // Deadline fields
    activeFrom: '',
    activeUntil: '',
    isActive: true
  });

  // Define who can send to whom based on role
  const rolePermissions: Record<string, string[]> = {
    Admin: ['Admin', 'CourseMaster', 'HOD', 'Trainer', 'Student'],
    CourseMaster: ['HOD', 'Trainer', 'Student'],
    HOD: ['Trainer', 'Student'],
    Trainer: ['Student']
  };

  const notificationTypes = [
    { value: 'general', label: 'General', icon: Bell },
    { value: 'critical', label: 'Critical', icon: AlertTriangle },
    { value: 'lesson', label: 'Lesson Update', icon: BookOpen },
    { value: 'assessment', label: 'Assessment', icon: FileText },
    { value: 'enrollment', label: 'Enrollment', icon: UserPlus },
    { value: 'approval', label: 'Approval', icon: UserCheck }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('users/');
      // Filter only activated users
      const activatedUsers = (response.data.results || response.data).filter(
        (u: User) => u.is_activated
      );
      setUsers(activatedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title || !formData.message) {
      setError('Title and message are required');
      return;
    }

    if (formData.sendType === 'specific' && formData.selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    if (formData.sendType === 'role' && !formData.targetRole) {
      setError('Please select a target role');
      return;
    }

    try {
      setSending(true);
      setError('');

      // Parse dates to ISO format for backend
      const payload: any = {
        title: formData.title,
        message: formData.message,
        notification_type: formData.isCritical ? 'critical' : formData.notificationType,
        is_critical: formData.isCritical,
        is_active: formData.isActive,
        link: formData.link || undefined,
      };

      // Add active_from if provided
      if (formData.activeFrom) {
        payload.active_from = new Date(formData.activeFrom).toISOString();
      }

      // Add active_until if provided
      if (formData.activeUntil) {
        payload.active_until = new Date(formData.activeUntil).toISOString();
      }

      // Add user targeting
      if (formData.sendType === 'specific') {
        payload.user_ids = formData.selectedUsers;
      } else {
        payload.role = formData.targetRole;
      }

      await api.post('notifications/send_notification/', payload);
      setSuccess('Notification sent successfully!');
      
      // Reset form
      setFormData({
        sendType: 'role',
        targetRole: '',
        selectedUsers: [],
        title: '',
        message: '',
        notificationType: 'general',
        isCritical: false,
        link: '',
        activeFrom: '',
        activeUntil: '',
        isActive: true
      });

      setTimeout(() => {
        setSuccess('');
        if (onClose) onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const toggleUser = (userId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }));
  };

  const getAvailableRoles = () => {
    if (!user) return [];
    return rolePermissions[user.role] || [];
  };

  const availableRoles = getAvailableRoles();

  const getUsersByRole = (role: string) => {
    return users.filter(u => u.role === role);
  };

  return (
    <div className="card-premium" style={{ padding: '2rem', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Send size={20} className="text-primary" />
          Send Notification
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {success && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.1)',
          color: '#10b981',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Check size={18} />
          {success}
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          background: 'rgba(244, 63, 94, 0.1)',
          color: '#f43f5e',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {/* Send Type Selection */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
          Send To
        </label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="sendType"
              checked={formData.sendType === 'role'}
              onChange={() => setFormData(prev => ({ ...prev, sendType: 'role', selectedUsers: [] }))}
            />
            <Users size={16} />
            Role Group
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="sendType"
              checked={formData.sendType === 'specific'}
              onChange={() => setFormData(prev => ({ ...prev, sendType: 'specific', targetRole: '' }))}
            />
            <UserCheck size={16} />
            Specific Users
          </label>
        </div>
      </div>

      {/* Role Selection */}
      {formData.sendType === 'role' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
            Select Role
          </label>
          <select
            value={formData.targetRole}
            onChange={(e) => setFormData(prev => ({ ...prev, targetRole: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-main)',
              fontSize: '0.9rem'
            }}
          >
            <option value="">-- Select Role --</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      )}

      {/* Specific User Selection */}
      {formData.sendType === 'specific' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
            Select Users ({formData.selectedUsers.length} selected)
          </label>
          
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
              {availableRoles.map(role => {
                const roleUsers = getUsersByRole(role);
                if (roleUsers.length === 0) return null;
                
                return (
                  <div key={role} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {role}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {roleUsers.map(u => (
                        <label
                          key={u.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            background: formData.selectedUsers.includes(u.id) ? 'var(--primary)' : 'var(--bg-muted)',
                            color: formData.selectedUsers.includes(u.id) ? 'white' : 'var(--text-main)',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedUsers.includes(u.id)}
                            onChange={() => toggleUser(u.id)}
                            style={{ display: 'none' }}
                          />
                          {u.first_name || u.username}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notification Type */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
          Notification Type
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {notificationTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  notificationType: type.value,
                  isCritical: type.value === 'critical'
                }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: formData.notificationType === type.value ? 'var(--primary)' : 'transparent',
                  color: formData.notificationType === type.value ? 'white' : 'var(--text-main)',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                <Icon size={14} />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Critical Toggle */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.isCritical}
            onChange={(e) => setFormData(prev => ({ ...prev, isCritical: e.target.checked }))}
          />
          <AlertTriangle size={16} style={{ color: formData.isCritical ? '#f43f5e' : 'inherit' }} />
          Mark as Critical (will appear on dashboard)
        </label>
      </div>

      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter notification title"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-main)',
            fontSize: '0.9rem'
          }}
        />
      </div>

      {/* Message */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
          Message *
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
          placeholder="Enter notification message"
          rows={4}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-main)',
            fontSize: '0.9rem',
            resize: 'vertical'
          }}
        />
      </div>

      {/* Link (optional) */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
          Link (optional)
        </label>
        <input
          type="text"
          value={formData.link}
          onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
          placeholder="e.g., /courses or /assessments/1"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg-main)',
            fontSize: '0.9rem'
          }}
        />
      </div>

      {/* Deadline Section */}
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1rem', 
        borderRadius: '12px', 
        background: 'var(--bg-alt)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Clock size={18} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Notification Schedule</h3>
        </div>
        
        {/* Active Toggle */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            Notification is Active
          </label>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
            Uncheck to manually hide this notification from all viewers
          </p>
        </div>

        {/* Active From */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
            Active From (optional)
          </label>
          <input
            type="datetime-local"
            value={formData.activeFrom}
            onChange={(e) => setFormData(prev => ({ ...prev, activeFrom: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-main)',
              fontSize: '0.85rem'
            }}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Leave empty to make notification visible immediately
          </p>
        </div>

        {/* Active Until */}
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
            Active Until (optional)
          </label>
          <input
            type="datetime-local"
            value={formData.activeUntil}
            onChange={(e) => setFormData(prev => ({ ...prev, activeUntil: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.6rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-main)',
              fontSize: '0.85rem'
            }}
          />
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Leave empty for notification to remain active indefinitely. After this time, notification will automatically disappear.
          </p>
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={sending}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}
      >
        {sending ? (
          <>Sending...</>
        ) : (
          <>
            <Send size={18} />
            Send Notification
          </>
        )}
      </button>
    </div>
  );
};

export default SendNotification;
