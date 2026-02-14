import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Users, BookOpen, Calendar, GraduationCap,
    Settings, LogOut, LayoutDashboard, Database, CheckSquare, UserCheck
} from 'lucide-react';

const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

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
                    { icon: <LayoutDashboard size={20} />, label: 'My Courses', path: '/student' },
                    { icon: <GraduationCap size={20} />, label: 'Progress', path: '/student/progress' },
                ];
            default:
                return [];
        }
    };

    return (
        <aside style={{
            width: 'var(--sidebar-width)',
            height: '100vh',
            background: 'var(--bg-sidebar)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            position: 'fixed',
            left: 0,
            top: 0,
            zIndex: 100
        }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
                    <GraduationCap size={24} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MLS Portal</h2>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {getNavItems().map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path.split('/').length <= 2}
                        className="btn animate-fade-in"
                        style={({ isActive }) => ({
                            justifyContent: 'flex-start',
                            background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                            color: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.7)',
                            transition: 'all 0.3s ease',
                            width: '100%',
                            padding: '0.75rem 1rem'
                        })}
                    >
                        {item.icon}
                        <span style={{ fontWeight: 500 }}>{item.label}</span>
                    </NavLink>
                ))}
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
                        fontWeight: 700
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
                        color: '#fb7185'
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
