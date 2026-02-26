import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Users, BookOpen, Calendar,
    Settings, LogOut, LayoutDashboard, Database, CheckSquare, UserCheck,
    MessageSquare, Bell, User as UserIcon, HelpCircle, FileText, Mail,
    Download, FolderOpen
} from 'lucide-react';

interface SidebarProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getNavItems = () => {
        switch (user?.role) {
            case 'Admin':
                return [
                    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/admin' },
                    { icon: <Users size={20} />, label: 'User Management', path: '/admin/users' },
                    { icon: <Settings size={20} />, label: 'System Settings', path: '/admin/settings' },
                ];
            case 'CourseMaster':
                return [
                    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/course-master' },
                    { icon: <BookOpen size={20} />, label: 'Courses', path: '/course-master/courses' },
                    { icon: <Settings size={20} />, label: 'Course Management', path: '/course-master/course-management' },
                    { icon: <Calendar size={20} />, label: 'Intakes', path: '/course-master/intakes' },
                ];
            case 'HOD':
                return [
                    { icon: <LayoutDashboard size={20} />, label: 'Department', path: '/hod' },
                    { icon: <Database size={20} />, label: 'Units', path: '/hod/units' },
                    { icon: <Users size={20} />, label: 'Trainers', path: '/hod/trainers' },
                    { icon: <CheckSquare size={20} />, label: 'Verifications', path: '/hod/verifications' },
                    { icon: <FileText size={20} />, label: 'Lesson Plans', path: '/hod/lesson-plans' },
                ];
            case 'Trainer':
                return [
                    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/trainer' },
                    { icon: <Users size={20} />, label: 'Students', path: '/trainer/students' },
                    { icon: <Calendar size={20} />, label: 'Assessments', path: '/trainer/assessments' },
                    { icon: <CheckSquare size={20} />, label: 'Submissions', path: '/trainer/submissions' },
                    { icon: <UserCheck size={20} />, label: 'Attendance', path: '/trainer/attendance' },
                    { icon: <BookOpen size={20} />, label: 'Course Authoring', path: '/trainer/authoring' },
                ];
            case 'Student':
                return [
                    { icon: <LayoutDashboard size={20} />, label: 'Overview', path: '/student?tab=overview' },
                    { icon: <BookOpen size={20} />, label: 'My Courses', path: '/student?tab=courses' },
                    { icon: <FileText size={20} />, label: 'Assessments', path: '/student?tab=assessments' },
                    { icon: <Download size={20} />, label: 'My Submissions', path: '/student/submissions' },
                    { icon: <FolderOpen size={20} />, label: 'My Resources', path: '/student/resources' },
                    { icon: <Mail size={20} />, label: 'Contact Trainer', path: '/student?tab=contact' },
                    { icon: <MessageSquare size={20} />, label: 'Communication', path: '/student/forum' },
                    { icon: <Bell size={20} />, label: 'Notifications', path: '/student?tab=notifications' },
                    { icon: <UserIcon size={20} />, label: 'Profile', path: '/student?tab=profile' },
                    { icon: <HelpCircle size={20} />, label: 'Support', path: '/student?tab=support' },
                ];
            default:
                return [];
        }
    };

    const isItemActive = (path: string) => {
        if (path.includes('?')) {
            return location.pathname + location.search === path;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <aside className={`sidebar-container ${isMobileOpen ? 'mobile-open' : ''}`}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'white', padding: '0.25rem', borderRadius: '8px', display: 'flex', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <img src="/imageicon.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MLS Portal</h2>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }} className="scroll-hide">
                {getNavItems().map((item) => {
                    const active = isItemActive(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => onMobileClose?.()}
                            className="btn"
                            style={{
                                justifyContent: 'flex-start',
                                background: active ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                color: active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.7)',
                                transition: 'all 0.3s ease',
                                width: '100%',
                                padding: '0.75rem 1rem'
                            }}
                        >
                            {item.icon}
                            <span style={{ fontWeight: 500 }}>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        flexShrink: 0
                    }}>
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.username}</p>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="btn"
                    style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        background: 'rgba(244, 63, 94, 0.1)',
                        color: '#fb7185',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={20} />
                    <span style={{ fontWeight: 600 }}>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
