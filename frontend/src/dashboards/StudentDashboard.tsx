import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import {
    BookOpen, CheckCircle2, Clock, PlayCircle, Lock, AlertCircle,
    LayoutDashboard, FileText, MessageSquare, Bell, User, HelpCircle,
    ChevronRight, Plus, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Unit {
    id: number;
    name: string;
    code: string;
    course_group_name: string;
    total_lessons: number;
    lessons_taught: number;
    notes_count: number;
    cats_count: number;
}

interface Announcement {
    id: number;
    title: string;
    content: string;
    created_at: string;
    author_name: string;
}

interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

const StudentDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [units, setUnits] = useState<Unit[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'assessments' | 'forum' | 'notifications' | 'profile' | 'support'>('overview');
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        if (!user || !user.is_activated) return;
        setLoading(true);
        try {
            const [unitsRes, annRes, notifRes] = await Promise.all([
                api.get('units/'),
                api.get('announcements/'),
                api.get('notifications/')
            ]);
            setUnits(unitsRes.data);
            setAnnouncements(annRes.data);
            setNotifications(notifRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user?.is_activated]);

    if (user && !user.is_activated) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
                    <div style={{ background: '#fef3c7', color: '#92400e', padding: '2rem', borderRadius: '24px', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '500px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <Lock size={48} style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Account Dormant</h2>
                        <p style={{ lineHeight: 1.6, opacity: 0.9 }}>
                            Welcome to the portal! Your registration is complete, but your account is currently
                            <strong> pending activation</strong> by the administration.
                        </p>
                        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', background: 'white', padding: '1rem', borderRadius: '12px', width: '100%' }}>
                            <AlertCircle size={20} className="text-primary" />
                            <span>Contact your HOD or Admin for activation.</span>
                        </div>
                    </div>
                    <button onClick={logout} className="btn glass">Logout</button>
                </div>
            </DashboardLayout>
        );
    }

    const renderOverview = () => (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Welcome back, {user?.first_name || user?.username}!</h1>
                <p style={{ color: 'var(--text-muted)' }}>Here's what's happening in your learning journey.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: '16px' }}>
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{units.length}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Units</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '16px' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }}>85%</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Attendance</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '1rem', borderRadius: '16px' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '1.5rem', fontWeight: 800 }}>12</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upcoming Tests</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Learning Progress</h3>
                        <BarChart3 size={20} className="text-muted" />
                    </div>
                    {units.map(unit => (
                        <div key={unit.id} style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                <span style={{ fontWeight: 600 }}>{unit.name}</span>
                                <span className="text-muted">{Math.round((unit.lessons_taught / unit.total_lessons) * 100)}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${(unit.lessons_taught / unit.total_lessons) * 100}%`,
                                    background: 'var(--primary)',
                                    borderRadius: '4px'
                                }} />
                            </div>
                        </div>
                    ))}
                    {units.length === 0 && <p className="text-muted">No progress data available.</p>}
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>Announcements</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {announcements.slice(0, 3).map(ann => (
                            <div key={ann.id}>
                                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem' }}>{ann.title}</h4>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {ann.content}
                                </p>
                                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem', display: 'block' }}>
                                    {new Date(ann.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                        {announcements.length === 0 && <p className="text-muted" style={{ fontSize: '0.875rem' }}>No new announcements.</p>}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCourses = () => (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>My Courses</h1>
                <p style={{ color: 'var(--text-muted)' }}>Access your units and study materials.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {units.map(u => (
                    <div key={u.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', background: '#eef2ff', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                                    {u.code}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.lessons_taught}/{u.total_lessons} Lessons</span>
                            </div>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>{u.name}</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{u.course_group_name}</p>
                        </div>
                        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <FileText size={14} /> {u.notes_count} Notes
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <CheckCircle2 size={14} /> {u.cats_count} CATs
                                </div>
                            </div>
                            <button onClick={() => navigate(`/student/unit/${u.id}/lesson/1`)} className="btn btn-primary btn-sm">
                                <PlayCircle size={14} /> Continue
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderForum = () => (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Communication Forum</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Discuss units with your trainers and peers.</p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={18} /> New Discussion
                </button>
            </div>
            <div className="card" style={{ padding: '0' }}>
                {units.map((u, idx) => (
                    <div
                        key={u.id}
                        style={{
                            padding: '1.5rem 2rem',
                            borderBottom: idx === units.length - 1 ? 'none' : '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary)' }}>
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontWeight: 700 }}>{u.name} Channel</h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Join 24 others discussing this unit</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-muted" />
                    </div>
                ))}
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Notifications</h1>
            <div className="card" style={{ padding: '0' }}>
                {notifications.map((n, idx) => (
                    <div key={n.id} style={{ padding: '1.5rem 2rem', borderBottom: idx === notifications.length - 1 ? 'none' : '1px solid var(--border)', background: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h4 style={{ fontWeight: 700 }}>{n.title}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</p>
                    </div>
                ))}
                {notifications.length === 0 && (
                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                        <Bell size={48} className="text-muted" style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                        <p className="text-muted">You're all caught up!</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Account & Portfolio</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, margin: '0 auto 1.5rem' }}>
                        {user?.username?.[0].toUpperCase()}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.first_name} {user?.last_name}</h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>{user?.role} - ID: STU{user?.id}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.8125rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', textAlign: 'left' }}>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 700 }}>Email Address</span>
                            {user?.email}
                        </div>
                        <div style={{ fontSize: '0.8125rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', textAlign: 'left' }}>
                            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 700 }}>Phone Number</span>
                            {user?.phone_number || 'Not provided'}
                        </div>
                    </div>
                </div>
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Change Password</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Current Password</label>
                            <input type="password" placeholder="••••••••" style={{ width: '100%' }} />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input type="password" placeholder="••••••••" style={{ width: '100%' }} />
                        </div>
                        <button className="btn btn-primary" style={{ width: 'fit-content' }}>Update Password</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSupport = () => (
        <div className="animate-fade-in">
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Support & Help Desk</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="card" style={{ padding: '2rem' }}>
                    <HelpCircle size={32} className="text-primary" style={{ marginBottom: '1.5rem' }} />
                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Trainer Advice</h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Need academic help? Reach out to your unit trainers directly through their office hours or email.</p>
                    <button className="btn glass btn-sm">Find Trainer Info</button>
                </div>
                <div className="card" style={{ padding: '2rem' }}>
                    <AlertCircle size={32} className="text-primary" style={{ marginBottom: '1.5rem' }} />
                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Technical Support</h3>
                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>Encountering issues with the portal? Our tech team is here to help you resolve login or content issues.</p>
                    <button className="btn btn-primary btn-sm">Open Support Ticket</button>
                </div>
            </div>
            <div className="card" style={{ marginTop: '2rem', padding: '2rem', background: 'var(--bg-main)', border: 'none' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>General Inquiries</h4>
                <p style={{ fontSize: '0.875rem' }}>For administrative questions, please visit the Academic Registrar's office during working hours (8:00 AM - 5:00 PM).</p>
            </div>
        </div>
    );

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'courses', label: 'My Courses', icon: BookOpen },
        { id: 'assessments', label: 'Assessments', icon: FileText },
        { id: 'forum', label: 'Communication', icon: MessageSquare },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'support', label: 'Support', icon: HelpCircle },
    ];

    return (
        <DashboardLayout>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '2.5rem', minHeight: 'calc(100vh - 120px)' }}>
                    {/* Sidebar */}
                    <div style={{ width: '240px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'sticky', top: '2rem' }}>
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id as any)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.875rem 1.25rem',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: activeTab === item.id ? 'var(--primary)' : 'transparent',
                                        color: activeTab === item.id ? 'white' : 'var(--text-muted)',
                                        fontWeight: 600,
                                        fontSize: '0.9375rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'left'
                                    }}
                                >
                                    <item.icon size={20} />
                                    {item.label}
                                    {item.id === 'notifications' && notifications.filter(n => !n.is_read).length > 0 && (
                                        <span style={{ marginLeft: 'auto', background: activeTab === item.id ? 'white' : 'var(--primary)', color: activeTab === item.id ? 'var(--primary)' : 'white', fontSize: '0.625rem', padding: '0.125rem 0.375rem', borderRadius: '10px' }}>
                                            {notifications.filter(n => !n.is_read).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div style={{ flex: 1, maxWidth: 'calc(100% - 280px)' }}>
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'courses' && renderCourses()}
                        {activeTab === 'forum' && renderForum()}
                        {activeTab === 'notifications' && renderNotifications()}
                        {activeTab === 'profile' && renderProfile()}
                        {activeTab === 'support' && renderSupport()}
                        {activeTab === 'assessments' && (
                            <div className="animate-fade-in">
                                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Assessments & Grading</h1>
                                <p className="text-muted">Assessment functionality coming in the next update.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default StudentDashboard;
