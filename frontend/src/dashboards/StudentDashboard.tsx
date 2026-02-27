import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import {
    BookOpen, CheckCircle2, Clock, Lock, AlertCircle,
    FileText, MessageSquare, Bell, HelpCircle,
    ChevronRight, Plus, BarChart3, Star, Layers, ScrollText,
    Calendar, Target, Info, Send, User, Mail, X, Check, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Resource {
    id: number;
    title: string;
    resource_type: string;
    lesson: number;
    file?: string;
    url?: string;
    is_approved?: boolean;
}

interface Lesson {
    id: number;
    title: string;
    order: number;
    is_taught: boolean;
    is_approved: boolean;
    is_active: boolean;
    week?: number | null;
    session_date?: string | null;
    session_start?: string | null;
    session_end?: string | null;
    session?: string;
    topic?: string;
    subtopic?: string;
    learning_outcomes?: string;
    plan_activities?: LessonPlanActivity[];
    module?: number;
    resources?: Resource[];
    content?: string;
    is_completed?: boolean;
}

interface LessonPlanActivity {
    id: number;
    time: string;
    activity: string;
    content: string;
    resources: string;
    references: string;
}

interface Module {
    id: number;
    title: string;
    description: string;
    order: number;
}

interface Assessment {
    id: number;
    title: string;
    assessment_type: string;
    instructions: string;
    points: number;
    due_date: string;
    duration_minutes: number;
    lesson?: number;
    scheduled_at?: string;
}

interface Unit {
    id: number;
    name: string;
    code: string;
    course_group_name: string;
    course_group_code?: string;
    total_lessons: number;
    lessons_taught: number;
    notes_count: number;
    cats_count: number;
    modules: Module[];
    lessons: Lesson[];
    assessments: Assessment[];
    is_enrolled: boolean;
    is_current_semester?: boolean;
    semester_number: number;
    student_progress?: number;
    trainer?: number;
    trainer_name?: string;
}

interface Trainer {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    units?: number[];
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
    notification_type?: string;
    is_critical?: boolean;
    sender_role?: string;
}

const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();
            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);
                return `${days}d ${hours}h ${minutes}m ${seconds}s`;
            }
            return 'Starting...';
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    return <span>{timeLeft}</span>;
};

const StudentDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [units, setUnits] = useState<Unit[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [enrolling, setEnrolling] = useState<number | null>(null);

    // Contact Trainer state
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [messageForm, setMessageForm] = useState({
        title: '',
        message: '',
        isCritical: false,
    });
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageSuccess, setMessageSuccess] = useState('');
    const [messageError, setMessageError] = useState('');

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

            // Fetch trainers for enrolled units
            const trainerIds = new Set<number>();
            unitsRes.data.forEach((u: Unit) => {
                if (u.trainer) trainerIds.add(u.trainer);
            });
            if (trainerIds.size > 0) {
                fetchTrainers([...trainerIds]);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrainers = async (trainerIds: number[]) => {
        try {
            const response = await api.get('users/');
            const allUsers = response.data.results || response.data;
            const filteredTrainers = allUsers.filter(
                (u: any) => u.role === 'Trainer' && trainerIds.includes(u.id)
            );
            setTrainers(filteredTrainers);
        } catch (error) {
            console.error('Failed to fetch trainers', error);
        }
    };

    const sendMessageToTrainer = async () => {
        if (!selectedTrainer || !messageForm.title || !messageForm.message) {
            setMessageError('Please fill in all required fields');
            return;
        }

        setSendingMessage(true);
        setMessageError('');

        try {
            await api.post('notifications/send_notification/', {
                user_ids: [selectedTrainer.id],
                title: messageForm.title,
                message: messageForm.message,
                notification_type: messageForm.isCritical ? 'critical' : 'general',
                is_critical: messageForm.isCritical,
                is_active: true
            });

            setMessageSuccess('Message sent successfully!');
            setMessageForm({ title: '', message: '', isCritical: false });
            setTimeout(() => {
                setShowContactModal(false);
                setSelectedTrainer(null);
                setMessageSuccess('');
            }, 2000);
        } catch (error: any) {
            setMessageError(error.response?.data?.error || 'Failed to send message');
        } finally {
            setSendingMessage(false);
        }
    };

    const toggleLessonCompletion = async (lessonId: number, currentStatus: boolean, unitId: number) => {
        try {
            const updatedUnits = units.map(u => {
                if (u.id === unitId && u.lessons) {
                    const updatedLessons = u.lessons.map(l => {
                        if (l.id === lessonId) {
                            return { ...l, is_completed: !currentStatus };
                        }
                        return l;
                    });
                    const completedCount = updatedLessons.filter(l => l.is_completed).length;
                    const total = Number(u.total_lessons) || 0;
                    const count = Number(completedCount) || 0;
                    const newProgress = total > 0 ? Math.round((count / total) * 100) : 0;
                    return { ...u, lessons: updatedLessons, student_progress: newProgress };
                }
                return u;
            });

            setUnits(updatedUnits);
            if (selectedUnit && selectedUnit.id === unitId) {
                setSelectedUnit(updatedUnits.find(u => u.id === unitId) || null);
            }

            await api.post(`lessons/${lessonId}/${!currentStatus ? 'complete' : 'incomplete'}/`);
            fetchDashboardData();
        } catch (error) {
            console.error('Failed to toggle lesson completion', error);
            fetchDashboardData();
        }
    };

    const handleEnroll = async (unitId: number) => {
        setEnrolling(unitId);
        try {
            await api.post(`units/${unitId}/enroll/`);
            await fetchDashboardData();
        } catch (error) {
            console.error('Failed to enroll in unit', error);
        } finally {
            setEnrolling(null);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user?.is_activated]);

    useEffect(() => {
        setSelectedUnit(null);
    }, [activeTab]);

    const getEnrolledTrainers = () => {
        const trainerMap = new Map<number, Trainer>();
        units.filter(u => u.is_enrolled && u.trainer).forEach(unit => {
            if (unit.trainer && !trainerMap.has(unit.trainer)) {
                const trainer = trainers.find(t => t.id === unit.trainer);
                if (trainer) {
                    trainerMap.set(unit.trainer, { ...trainer, units: [unit.id] });
                }
            }
        });
        return Array.from(trainerMap.values());
    };

    const getUnifiedFeed = () => {
        const feedItems = [
            ...announcements.map(a => ({
                ...a,
                type: 'announcement',
                icon: <MessageSquare size={16} />,
                color: 'var(--primary)',
                bg: 'rgba(99, 102, 241, 0.1)'
            })),
            ...notifications.map(n => ({
                ...n,
                type: 'notification',
                icon: <Bell size={16} />,
                color: (n as any).is_critical ? '#f43f5e' : '#f59e0b',
                bg: (n as any).is_critical ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)'
            }))
        ];
        return feedItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
    };

    const getUpcomingEvents = () => {
        const events: any[] = [];
        const now = new Date();

        units.forEach((unit) => {
            unit.lessons?.filter((l) => l.is_approved).forEach((lesson) => {
                if (lesson.session_date) {
                    const sessionDate = new Date(lesson.session_date);
                    if (sessionDate >= now) {
                        events.push({
                            id: `lesson-${lesson.id}`,
                            title: lesson.title,
                            type: 'Lesson',
                            date: lesson.session_date,
                            unitCode: unit.code,
                            icon: <BookOpen size={16} />,
                            color: '#10b981',
                        });
                    }
                }
            });

            unit.assessments?.forEach((assessment) => {
                const dateStr = assessment.scheduled_at || assessment.due_date;
                if (dateStr) {
                    const date = new Date(dateStr);
                    if (date >= now) {
                        events.push({
                            id: `assessment-${assessment.id}`,
                            title: assessment.title,
                            type: assessment.assessment_type,
                            date: dateStr,
                            unitCode: unit.code,
                            icon:
                                assessment.assessment_type === 'CAT' ? (
                                    <Target size={16} />
                                ) : (
                                    <FileText size={16} />
                                ),
                            color:
                                assessment.assessment_type === 'CAT'
                                    ? '#f43f5e'
                                    : 'var(--primary)',
                        });
                    }
                }
            });
        });

        return events
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);
    };

    if (user && !user.is_activated) {
        return (
            <DashboardLayout>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '70vh',
                        textAlign: 'center',
                        padding: '2rem',
                    }}
                >
                    <div
                        className="card-premium animate-fade-in"
                        style={{
                            padding: '3rem',
                            borderRadius: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            maxWidth: '550px',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: '-20px',
                                right: '-20px',
                                width: '150px',
                                height: '150px',
                                background: 'var(--primary)',
                                opacity: '0.05',
                                borderRadius: '50%',
                            }}
                        />
                        <div
                            style={{
                                background: 'rgba(245, 158, 11, 0.1)',
                                color: '#f59e0b',
                                padding: '1.5rem',
                                borderRadius: '24px',
                                marginBottom: '1.5rem',
                            }}
                        >
                            <Lock size={48} className="animate-pulse" />
                        </div>
                        <h2
                            style={{
                                fontSize: '2rem',
                                fontWeight: 800,
                                marginBottom: '1rem',
                                color: 'var(--text-main)',
                            }}
                        >
                            Account Dormant
                        </h2>
                        <p
                            style={{
                                fontSize: '1.1rem',
                                lineHeight: 1.6,
                                color: 'var(--text-muted)',
                                marginBottom: '2rem',
                            }}
                        >
                            Welcome to the portal! Your registration is complete, but your
                            account is currently
                            <span
                                style={{
                                    color: 'var(--primary)',
                                    fontWeight: 700,
                                }}
                            >
                                pending activation
                            </span>{' '}
                            by the administration.
                        </p>
                        <div
                            className="glass"
                            style={{
                                padding: '1.25rem',
                                borderRadius: '16px',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                border: '1px solid rgba(0,0,0,0.05)',
                            }}
                        >
                            <AlertCircle
                                size={24}
                                style={{
                                    color: 'var(--primary)',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '0.9375rem',
                                    fontWeight: 600,
                                    color: 'var(--text-main)',
                                }}
                            >
                                Please contact your HOD or Admin for activation.
                            </span>
                        </div>
                        <button
                            onClick={logout}
                            className="btn"
                            style={{
                                marginTop: '2.5rem',
                                background: '#f1f5f9',
                                color: '#475569',
                                width: '100%',
                            }}
                        >
                            Secure Logout
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const renderOverview = () => (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '3rem', position: 'relative' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                    Welcome back, <span className="text-gradient">{user?.first_name || user?.username}!</span> 👋
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Here is what is happening in your learning journey.</p>
                <div style={{ position: 'absolute', bottom: '-15px', left: 0, width: '60px', height: '4px', background: 'var(--primary)', borderRadius: '2px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem', marginBottom: '3.5rem' }}>
                <div className="card-premium animate-fade-in" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '4px solid var(--primary)' }}>
                    <div style={{ background: 'hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.1)', color: 'var(--primary)', padding: '1.25rem', borderRadius: '20px' }}>
                        <BookOpen size={32} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>{units.length}</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Units</p>
                    </div>
                </div>

                <div className="card-premium animate-fade-in" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '4px solid #10b981', animationDelay: '0.1s' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1.25rem', borderRadius: '20px' }}>
                        <Star size={32} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>A+</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Average</p>
                    </div>
                </div>

                <div className="card-premium animate-fade-in" style={{ padding: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '4px solid #f59e0b', animationDelay: '0.2s' }}>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '1.25rem', borderRadius: '20px' }}>
                        <Clock size={32} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>12</h4>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Pending</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card-premium" style={{ padding: '2rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>Learning Progress</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completion status for your enrolled units</p>
                            </div>
                            <div style={{ background: 'var(--bg-main)', padding: '0.6rem', borderRadius: '10px' }}>
                                <BarChart3 size={20} className="text-primary" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {units.map((unit, idx) => {
                                const progress = unit.student_progress || 0;
                                return (
                                    <div key={unit.id} className="animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 700 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: idx % 2 === 0 ? 'var(--primary)' : '#10b981' }} />
                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{unit.name}</span>
                                            </div>
                                            <span style={{ color: idx % 2 === 0 ? 'var(--primary)' : '#10b981' }}>{progress}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${progress}%`,
                                                background: idx % 2 === 0 ? 'linear-gradient(90deg, var(--primary) 0%, #4f46e5 100%)' : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                                borderRadius: '8px',
                                                transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {units.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '2rem' }}>
                                    <Layers size={40} style={{ color: 'var(--text-muted)', opacity: 0.2, margin: '0 auto 1rem' }} />
                                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>No unit progress tracked yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card-premium" style={{ padding: '2rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>Upcoming Schedule</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your academic agenda for the next few days</p>
                            </div>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.6rem', borderRadius: '10px', color: '#f59e0b' }}>
                                <Calendar size={20} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {getUpcomingEvents().map((event, idx) => (
                                <div key={event.id} className="glass animate-fade-in" style={{ padding: '1rem', borderRadius: '16px', display: 'flex', gap: '1rem', alignItems: 'center', border: '1px solid rgba(0,0,0,0.03)', animationDelay: `${idx * 0.1}s` }}>
                                    <div style={{ background: 'white', color: event.color, padding: '0.75rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex' }}>
                                        {event.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: event.color, textTransform: 'uppercase' }}>{event.type} • {event.unitCode}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</h4>
                                    </div>
                                    <ChevronRight size={16} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                </div>
                            ))}
                            {getUpcomingEvents().length === 0 && (
                                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-main)', borderRadius: '16px' }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No upcoming events scheduled.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card-premium" style={{ padding: '2.5rem 2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>Activity Feed</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Announcements and Notifications</p>
                        </div>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.6rem', borderRadius: '10px', color: 'var(--primary)' }}>
                            <Bell size={20} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                        {getUnifiedFeed().map((item, idx) => (
                            <div key={`${item.type}-${item.id}`} className="animate-fade-in" style={{ display: 'flex', gap: '1rem', animationDelay: `${idx * 0.1}s` }}>
                                <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                                    <div style={{ background: (item as any).bg, color: (item as any).color, padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                        {(item as any).icon}
                                    </div>
                                    {idx !== getUnifiedFeed().length - 1 && (
                                        <div style={{ width: '2px', height: '100%', background: '#f1f5f9', margin: '0.5rem auto 0', opacity: 0.5 }} />
                                    )}
                                </div>
                                <div style={{ flex: 1, paddingBottom: idx !== getUnifiedFeed().length - 1 ? '1.25rem' : '0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: (item as any).color, textTransform: 'uppercase' }}>{item.type}</span>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{item.title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {(item as any).content || (item as any).message}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {getUnifiedFeed().length === 0 && (
                            <div style={{ textAlign: 'center', padding: '3rem' }}>
                                <Info size={40} style={{ color: 'var(--text-muted)', opacity: 0.1, margin: '0 auto 1rem' }} />
                                <p className="text-muted" style={{ fontSize: '0.85rem' }}>No recent activity to show.</p>
                            </div>
                        )}
                    </div>

                    <button
                        className="btn glass"
                        style={{ marginTop: '2rem', width: '100%', justifyContent: 'center', padding: '0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
                        onClick={() => navigate('/student?tab=notifications')}
                    >
                        View All Activity
                    </button>
                </div>
            </div>
        </div>
    );

    const renderUnitContent = (unit: Unit) => {
        const allLessons = (unit.lessons || []).filter(l => l.is_approved).sort((a, b) => a.order - b.order);
        const assessmentsByLesson = unit.assessments?.reduce((acc, assessment) => {
            const lessonId = assessment.lesson || 'unit';
            if (!acc[lessonId]) acc[lessonId] = [];
            acc[lessonId].push(assessment);
            return acc;
        }, {} as Record<string | number, Assessment[]>) || {};

        return (
            <div className="animate-fade-in">
                <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        onClick={() => setSelectedUnit(null)}
                        className="btn glass"
                        style={{ padding: '0.75rem', borderRadius: '50%', width: '45px', height: '45px', color: 'var(--text-main)' }}
                    >
                        <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <span className="badge badge-primary">{unit.code}</span>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Learning Adventure</span>
                        </div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{unit.name}</h1>
                    </div>
                </div>

                <div style={{ position: 'relative', paddingLeft: '2.5rem' }}>
                    <div style={{
                        position: 'absolute',
                        left: '7px',
                        top: '20px',
                        bottom: '20px',
                        width: '2px',
                        background: 'linear-gradient(to bottom, var(--primary) 0%, #e2e8f0 100%)',
                        opacity: 0.3
                    }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        {allLessons.map((lesson, idx) => {
                            const lessonAssessments = assessmentsByLesson[lesson.id] || [];
                            const isLocked = !lesson.is_taught;

                            return (
                                <div key={lesson.id} className="animate-fade-in" style={{ position: 'relative', animationDelay: `${idx * 0.1}s` }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: '-32px',
                                        top: '0',
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        background: lesson.is_taught ? 'var(--primary)' : '#e2e8f0',
                                        border: '4px solid white',
                                        boxShadow: lesson.is_taught ? '0 0 10px rgba(99, 102, 241, 0.4)' : 'none',
                                        zIndex: 2
                                    }} />

                                    <div className="card-premium" style={{
                                        padding: '2.5rem',
                                        opacity: isLocked ? 0.7 : 1,
                                        filter: isLocked ? 'grayscale(0.5)' : 'none',
                                        background: isLocked ? '#f8fafc' : 'white',
                                        borderRadius: '24px'
                                    }}>
                                        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                                    <span className="badge badge-primary">Module {lesson.order}</span>
                                                    {isLocked && (
                                                        <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                            <Lock size={12} /> Locked
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{lesson.title}</h2>
                                            </div>
                                            {lesson.is_taught && (
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <button
                                                        onClick={() => navigate(`/student/unit/${unit.id}/lesson/${lesson.order}`)}
                                                        className="btn btn-primary"
                                                        style={{
                                                            padding: '0.5rem 1.25rem',
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                        }}
                                                    >
                                                        <BookOpen size={18} />
                                                        Enter Lesson
                                                    </button>
                                                    <button
                                                        onClick={() => toggleLessonCompletion(lesson.id, !!lesson.is_completed, unit.id)}
                                                        className={`btn ${lesson.is_completed ? 'btn-success' : 'btn-outline'}`}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            border: lesson.is_completed ? 'none' : '1px solid var(--border)',
                                                            background: lesson.is_completed ? '#10b981' : 'transparent',
                                                            color: lesson.is_completed ? 'white' : 'var(--text-muted)'
                                                        }}
                                                    >
                                                        {lesson.is_completed ? <CheckCircle2 size={18} /> : <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid currentColor' }} />}
                                                        {lesson.is_completed ? 'Completed' : 'Mark Complete'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {lesson.content && (
                                            <div style={{
                                                marginBottom: '2.5rem',
                                                padding: '2rem',
                                                background: 'var(--bg-main)',
                                                borderRadius: '20px',
                                                border: '1px solid rgba(0,0,0,0.02)'
                                            }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
                                                    <ScrollText size={20} /> Lecture Material
                                                </h3>
                                                <div
                                                    style={{
                                                        fontSize: '1.05rem',
                                                        lineHeight: 1.8,
                                                        color: '#334155'
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: lesson.content }}
                                                />
                                            </div>
                                        )}

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                            gap: '2rem'
                                        }}>
                                            {lesson.resources && lesson.resources.filter(r => r.is_approved).length > 0 && (
                                                <div style={{
                                                    padding: '1.5rem',
                                                    background: 'var(--bg-alt)',
                                                    borderRadius: '16px',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                        <FileText size={18} className="text-primary" /> Learning Assets
                                                    </h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        {lesson.resources.filter(r => r.is_approved).map(resource => (
                                                            <div
                                                                key={resource.id}
                                                                className="glass hover-scale"
                                                                style={{
                                                                    padding: '1rem',
                                                                    borderRadius: '12px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '1rem',
                                                                    border: '1px solid rgba(0,0,0,0.05)',
                                                                    background: 'white'
                                                                }}
                                                                onClick={() => {
                                                                    if (resource.file) window.open(resource.file, '_blank');
                                                                    else if (resource.url) window.open(resource.url, '_blank');
                                                                }}
                                                            >
                                                                <div style={{ background: 'var(--primary-light)', padding: '0.6rem', borderRadius: '10px', color: 'var(--primary)' }}>
                                                                    <FileText size={18} />
                                                                </div>
                                                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resource.title}</div>
                                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{resource.resource_type}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {lessonAssessments.length > 0 && (
                                                <div style={{
                                                    padding: '1.5rem',
                                                    background: 'var(--bg-alt)',
                                                    borderRadius: '16px',
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                        <BarChart3 size={18} className="text-primary" /> Evaluation Tasks
                                                    </h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        {lessonAssessments.map(assessment => (
                                                            <div
                                                                key={assessment.id}
                                                                className="card hover-scale"
                                                                style={{
                                                                    padding: '1.25rem',
                                                                    borderRadius: '16px',
                                                                    background: 'white',
                                                                    border: '1px solid rgba(99, 102, 241, 0.1)',
                                                                    opacity: (assessment.scheduled_at && new Date(assessment.scheduled_at) > new Date()) ? 0.7 : 1
                                                                }}
                                                            >
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{assessment.assessment_type}</span>
                                                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>{assessment.points} Pts</span>
                                                                </div>
                                                                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '1rem' }}>{assessment.title}</h4>

                                                                {assessment.scheduled_at && new Date(assessment.scheduled_at) > new Date() ? (
                                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                                                                        <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Opens In:</div>
                                                                        <CountdownTimer targetDate={assessment.scheduled_at} />
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        className="btn btn-primary btn-sm"
                                                                        style={{ width: '100%', padding: '0.6rem' }}
                                                                        onClick={() => navigate(`/student/assessment/${assessment.id}`)}
                                                                    >
                                                                        Dive In
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {assessmentsByLesson['unit'] && assessmentsByLesson['unit'].length > 0 && (
                    <div className="card-premium animate-fade-in" style={{ padding: '3rem', borderRadius: '32px', marginTop: '4rem', background: 'linear-gradient(135deg, white 0%, #fefeff 100%)' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Layers size={28} className="text-primary" /> Unit-level Evaluations
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                            {assessmentsByLesson['unit'].map(assessment => (
                                <div key={assessment.id} className="card-premium glass hover-scale" style={{ padding: '2rem', borderRadius: '24px', opacity: (assessment.scheduled_at && new Date(assessment.scheduled_at) > new Date()) ? 0.7 : 1 }}>
                                    <span className="badge badge-primary" style={{ marginBottom: '1rem', display: 'inline-block' }}>{assessment.assessment_type}</span>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>{assessment.title}</h4>
                                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} /> {assessment.duration_minutes || 'Flexible'}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Star size={16} /> {assessment.points} Pts</div>
                                    </div>

                                    {assessment.scheduled_at && new Date(assessment.scheduled_at) > new Date() ? (
                                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Available In</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}><CountdownTimer targetDate={assessment.scheduled_at} /></div>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%' }}
                                            onClick={() => navigate(`/student/assessment/${assessment.id}`)}
                                        >
                                            Begin Assessment
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCourses = () => {
        if (selectedUnit) return renderUnitContent(selectedUnit);

        return (
            <div className="animate-fade-in">
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Academic Portfolio</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Explore your registered units and master new skills.</p>
                        </div>
                        {units.length > 0 && units[0].course_group_code && (
                            <div className="glass" style={{ padding: '0.75rem 1.5rem', borderRadius: '16px', border: '1px solid var(--primary-light)' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Primary Group</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>{units[0].course_group_code}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem' }}>
                    {units.map((u, idx) => (
                        <div
                            key={u.id}
                            className="card-premium animate-fade-in"
                            style={{ padding: '0', overflow: 'hidden', borderRadius: '28px', animationDelay: `${idx * 0.1}s` }}
                        >
                            <div style={{ padding: '2rem', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: 'var(--primary)', opacity: 0.05, borderRadius: '0 0 0 100px' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span className="badge badge-primary">{u.code}</span>
                                        {u.is_enrolled && u.is_current_semester ? (
                                            <span className="badge badge-success">Enrolled</span>
                                        ) : u.is_enrolled ? (
                                            <span className="badge badge-warning" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>Considered</span>
                                        ) : (
                                            <span className="badge">Available</span>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>{u.student_progress || 0}%</div>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completion</div>
                                    </div>
                                </div>
                                <h4 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.75rem', lineHeight: 1.2 }}>{u.name}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', fontWeight: 500 }}>{u.course_group_name}</p>
                                    <span style={{ color: 'var(--border)' }}>•</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>{u.course_group_code}</span>
                                </div>
                            </div>

                            <div className="glass" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.02)' }}>
                                <div style={{ display: 'flex', gap: '1.25rem' }}>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }} title="Lessons Covered">
                                        <Layers size={16} className="text-primary" /> {u.lessons_taught || 0}/{u.total_lessons || 0}
                                    </div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }} title="CATS Available">
                                        <BarChart3 size={16} className="text-primary" /> {u.cats_count || 0}
                                    </div>
                                </div>

                                {u.is_enrolled ? (
                                    <button onClick={() => setSelectedUnit(u)} className="btn btn-primary" style={{ borderRadius: '14px', padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {u.is_current_semester ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                        {u.is_current_semester ? 'Launch Unit' : 'Preview Unit'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleEnroll(u.id); }}
                                        className="btn btn-primary"
                                        disabled={enrolling === u.id}
                                        style={{ borderRadius: '14px', padding: '0.6rem 1.25rem' }}
                                    >
                                        {enrolling === u.id ? (
                                            <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                        ) : (
                                            <Plus size={18} />
                                        )}
                                        Enroll
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {units.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '6rem 2rem', textAlign: 'center' }}>
                            <BookOpen size={64} style={{ color: 'var(--text-muted)', opacity: 0.1, margin: '0 auto 2rem' }} />
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>No Units Enrolled</h3>
                            <p className="text-muted" style={{ maxWidth: '450px', margin: '1rem auto' }}>Your academic journey is just beginning. Enrolled course units will appear here as soon as they are assigned by the administration.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderForum = () => (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Discussion Forums</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Connect with peers and trainers in your unit channels.</p>
                </div>
                <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/student/forum')}>
                    <Plus size={20} /> View Forums
                </button>
            </div>

            <div className="card-premium" style={{ padding: '0', overflow: 'hidden', borderRadius: '28px' }}>
                {units.map((u, idx) => (
                    <div
                        key={u.id}
                        className="animate-fade-in"
                        style={{
                            padding: '2rem',
                            borderBottom: idx === units.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.03)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            background: 'white',
                            transition: 'all 0.2s ease',
                            animationDelay: `${idx * 0.05}s`
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.paddingLeft = '2.5rem'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.paddingLeft = '2rem'; }}
                    >
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '16px', color: 'var(--primary)' }}>
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>{u.name}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Join the conversation for {u.code}</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}>24 Active</div>
                            <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                        </div>
                    </div>
                ))}
                {units.length === 0 && (
                    <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                        <MessageSquare size={64} style={{ color: 'var(--text-muted)', opacity: 0.1, margin: '0 auto 2rem' }} />
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>No Forums Available</h4>
                        <p className="text-muted" style={{ maxWidth: '400px', margin: '1rem auto' }}>You need to be enrolled in units to access discussion forums.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderContactTrainer = () => {
        const enrolledTrainers = getEnrolledTrainers();

        return (
            <div className="animate-fade-in">
                <div style={{ marginBottom: '3.5rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Contact Trainer</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Send messages to your unit trainers for academic support.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                    {enrolledTrainers.map((trainer) => (
                        <div key={trainer.id} className="card-premium" style={{ padding: '2rem', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: 900,
                                    color: 'white'
                                }}>
                                    {trainer.first_name?.[0] || trainer.username?.[0]}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{trainer.first_name} {trainer.last_name}</h3>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>{trainer.email}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <span className="badge badge-primary">Trainer</span>
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                onClick={() => {
                                    setSelectedTrainer(trainer);
                                    setShowContactModal(true);
                                }}
                            >
                                <Mail size={18} />
                                Send Message
                            </button>
                        </div>
                    ))}

                    {enrolledTrainers.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '5rem 2rem', textAlign: 'center' }}>
                            <User size={64} style={{ color: 'var(--text-muted)', opacity: 0.1, margin: '0 auto 2rem' }} />
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>No Trainers Assigned</h3>
                            <p className="text-muted" style={{ maxWidth: '400px', margin: '1rem auto' }}>You need to be enrolled in units with assigned trainers to contact them.</p>
                        </div>
                    )}
                </div>

                {showContactModal && selectedTrainer && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}>
                        <div className="card animate-fade-in" style={{
                            width: '100%',
                            maxWidth: '500px',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                            <button
                                onClick={() => {
                                    setShowContactModal(false);
                                    setSelectedTrainer(null);
                                    setMessageForm({ title: '', message: '', isCritical: false });
                                    setMessageError('');
                                }}
                                style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ padding: '2rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Send Message</h2>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    To: {selectedTrainer.first_name} {selectedTrainer.last_name}
                                </p>

                                {messageSuccess && (
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
                                        {messageSuccess}
                                    </div>
                                )}

                                {messageError && (
                                    <div style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        background: 'rgba(244, 63, 94, 0.1)',
                                        color: '#f43f5e',
                                        marginBottom: '1rem'
                                    }}>
                                        {messageError}
                                    </div>
                                )}

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Subject *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={messageForm.title}
                                        onChange={(e) => setMessageForm({ ...messageForm, title: e.target.value })}
                                        placeholder="Enter message subject"
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Message *</label>
                                    <textarea
                                        className="input"
                                        value={messageForm.message}
                                        onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                                        placeholder="Type your message here..."
                                        rows={5}
                                        style={{ width: '100%', resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={messageForm.isCritical}
                                            onChange={(e) => setMessageForm({ ...messageForm, isCritical: e.target.checked })}
                                        />
                                        <AlertTriangle size={16} style={{ color: messageForm.isCritical ? '#f43f5e' : 'inherit' }} />
                                        Mark as urgent/critical
                                    </label>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            setShowContactModal(false);
                                            setSelectedTrainer(null);
                                            setMessageForm({ title: '', message: '', isCritical: false });
                                            setMessageError('');
                                        }}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={sendMessageToTrainer}
                                        disabled={sendingMessage}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        {sendingMessage ? 'Sending...' : (
                                            <>
                                                <Send size={18} />
                                                Send Message
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderNotifications = () => (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '3.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Notifications</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Stay updated with the latest news and alerts.</p>
            </div>

            <div className="card-premium" style={{ padding: '0', overflow: 'hidden', borderRadius: '28px' }}>
                {notifications.map((n, idx) => (
                    <div key={n.id} className="animate-fade-in" style={{
                        padding: '2rem',
                        borderBottom: idx === notifications.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.03)',
                        background: n.is_read ? 'white' : 'rgba(var(--primary-rgb), 0.02)',
                        borderLeft: n.is_read ? '4px solid transparent' : '4px solid var(--primary)',
                        animationDelay: `${idx * 0.05}s`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{n.title}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, background: 'rgba(0,0,0,0.03)', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                                {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{n.message}</p>
                    </div>
                ))}
                {notifications.length === 0 && (
                    <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                        <Bell size={64} style={{ color: 'var(--text-muted)', opacity: 0.1, margin: '0 auto 2rem' }} />
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>All Caught Up</h4>
                        <p className="text-muted" style={{ maxWidth: '400px', margin: '1rem auto' }}>You have no new notifications at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderProfile = () => (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '3.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Student Profile</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Manage your personal academic identity.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '3rem' }}>
                <div className="card-premium" style={{ padding: '3rem', textAlign: 'center', borderRadius: '32px' }}>
                    <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 2rem' }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', padding: '6px' }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                                {user?.first_name?.[0] || user?.username?.[0]}
                            </div>
                        </div>
                        <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#10b981', width: '28px', height: '28px', borderRadius: '50%', border: '4px solid white' }} />
                    </div>

                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>{user?.first_name} {user?.last_name}</h2>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2.5rem' }}>@{user?.username}</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '24px' }}>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>4.8</div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rating</div>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>12</div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Badges</div>
                        </div>
                    </div>
                </div>

                <div className="card-premium" style={{ padding: '3rem', borderRadius: '32px' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={24} className="text-primary" /> Personal Information
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Email Address</label>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Phone Number</label>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user?.phone_number || 'N/A'}</p>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Admission No</label>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user?.admission_no || 'Pending'}</p>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Role</label>
                            <span className="badge badge-primary">Student Ambassador</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '4rem', paddingTop: '2.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <button className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>Edit Account Details</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAssessments = () => {
        const allAssessments = units
            .filter(u => u.is_enrolled)
            .flatMap(u => (u.assessments || []).map(a => ({ ...a, unitName: u.name, unitCode: u.code })))
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        return (
            <div className="animate-fade-in">
                <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Grading History</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Track your academic performance across all units.</p>
                    </div>
                    <div className="card-premium glass" style={{ padding: '0.75rem 1.5rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '0.5rem', borderRadius: '10px' }}><Star size={20} /></div>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.1 }}>82.5%</div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall GPA</div>
                        </div>
                    </div>
                </div>

                <div className="card-premium" style={{ borderRadius: '28px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ padding: '1.5rem 2rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assessment</th>
                                    <th style={{ padding: '1.5rem 2rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit</th>
                                    <th style={{ padding: '1.5rem 2rem', textAlign: 'left', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Values</th>
                                    <th style={{ padding: '1.5rem 2rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allAssessments.map((a, idx) => (
                                    <tr key={`${a.id}-${idx}`} className="animate-fade-in" style={{ animationDelay: `${idx * 0.05}s`, borderBottom: idx === allAssessments.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.03)' }}>
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.6rem', borderRadius: '12px' }}>
                                                    <ScrollText size={18} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{a.title}</div>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{a.assessment_type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{a.unitCode}</span>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem' }}>
                                            <div style={{ fontWeight: 700 }}>{a.points} Pts</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {new Date(a.due_date).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '1.5rem 2rem', textAlign: 'center' }}>
                                            {a.scheduled_at && new Date(a.scheduled_at) > new Date() ? (
                                                <span className="badge badge-warning" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Clock size={12} /> <CountdownTimer targetDate={a.scheduled_at} />
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/student/assessment/${a.id}`)}
                                                    className="btn btn-sm btn-primary"
                                                    style={{ borderRadius: '10px', padding: '0.5rem 1rem' }}
                                                >
                                                    Start
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderSupport = () => (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '3.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Help and Support</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>We are here to help you succeed in your studies.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
                <div className="card-premium" style={{ padding: '2.5rem', borderRadius: '28px' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
                        <HelpCircle size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Knowledge Base</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.95rem' }}>Browse our extensive library of guides, tutorials, and frequently asked questions.</p>
                    <button className="btn btn-primary" style={{ width: '100%' }}>Explore Guides</button>
                </div>

                <div className="card-premium" style={{ padding: '2.5rem', borderRadius: '28px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
                        <MessageSquare size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Direct Chat</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.95rem' }}>Our support team is available Monday to Friday, 8am - 5pm to help with any technical issues.</p>
                    <button className="btn btn-primary" style={{ width: '100%', background: '#10b981' }}>Start Conversing</button>
                </div>

                <div className="card-premium" style={{ padding: '2.5rem', borderRadius: '28px' }}>
                    <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
                        <AlertCircle size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Report Issue</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '0.95rem' }}>Encountered a bug or a problem with unit access? Let us know and we will fix it quickly.</p>
                    <button className="btn btn-primary" style={{ width: '100%', background: '#f43f5e' }}>Submit Report</button>
                </div>
            </div>

            <div className="card-premium glass" style={{ marginTop: '4rem', padding: '2.5rem', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.25rem' }}>Contact Administration</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>For enrollment and academic requests</p>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>admin@kisecollege.ac.ke</div>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                </div>
            ) : (
                <div className="animate-fade-in">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'courses' && renderCourses()}
                    {activeTab === 'forum' && renderForum()}
                    {activeTab === 'contact' && renderContactTrainer()}
                    {activeTab === 'notifications' && renderNotifications()}
                    {activeTab === 'profile' && renderProfile()}
                    {activeTab === 'support' && renderSupport()}
                    {activeTab === 'assessments' && renderAssessments()}
                </div>
            )}
        </DashboardLayout>
    );
};

export default StudentDashboard;
