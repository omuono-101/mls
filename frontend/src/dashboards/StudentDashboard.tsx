import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import {
    BookOpen, CheckCircle2, Clock, Lock, AlertCircle,
    FileText, MessageSquare, Bell, HelpCircle,
    ChevronRight, Plus, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Resource {
    id: number;
    title: string;
    resource_type: string;
    lesson: number;
}

interface Lesson {
    id: number;
    title: string;
    order: number;
    is_taught: boolean;
    module?: number;
    resources?: Resource[];
    content?: string;
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
}

interface Unit {
    id: number;
    name: string;
    code: string;
    course_group_name: string;
    total_lessons: number;
    lessons_taught: number;
    notes_count: number;
    cats_count: number;
    modules: Module[];
    lessons: Lesson[];
    assessments: Assessment[];
    is_enrolled: boolean;
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
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [units, setUnits] = useState<Unit[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [enrolling, setEnrolling] = useState<number | null>(null);

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
        // Clear selected unit when tab changes
        setSelectedUnit(null);
    }, [activeTab]);

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

    const renderUnitContent = (unit: Unit) => {
        // Get all lessons sorted by order
        const allLessons = [...unit.lessons].sort((a, b) => a.order - b.order);

        // Group assessments by lesson
        const assessmentsByLesson = unit.assessments?.reduce((acc, assessment) => {
            const lessonId = assessment.lesson || 'unit';
            if (!acc[lessonId]) acc[lessonId] = [];
            acc[lessonId].push(assessment);
            return acc;
        }, {} as Record<string | number, Assessment[]>) || {};

        return (
            <div className="animate-fade-in">
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => setSelectedUnit(null)} className="btn glass btn-sm" style={{ padding: '0.5rem' }}>
                        <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>{unit.code} Learning Path</span>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{unit.name}</h1>
                    </div>
                </div>

                {/* Sequential Lesson Display */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    {allLessons.map((lesson) => {
                        const lessonAssessments = assessmentsByLesson[lesson.id] || [];

                        return (
                            <div key={lesson.id} className="card" style={{
                                padding: '2rem',
                                border: '2px solid var(--border)',
                                position: 'relative'
                            }}>
                                {/* Lesson Header */}
                                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                background: 'var(--primary-light)',
                                                color: 'var(--primary)'
                                            }}>
                                                LESSON {lesson.order}
                                            </span>
                                            {!lesson.is_taught && (
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '20px',
                                                    background: '#fef3c7',
                                                    color: '#92400e',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}>
                                                    <Lock size={12} /> Not Yet Taught
                                                </span>
                                            )}
                                        </div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{lesson.title}</h2>
                                    </div>
                                </div>

                                {/* Lesson Content */}
                                {lesson.content && (
                                    <div style={{
                                        marginBottom: '2rem',
                                        padding: '1.5rem',
                                        background: 'var(--bg-alt)',
                                        borderRadius: '12px',
                                        borderLeft: '4px solid var(--primary)'
                                    }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <BookOpen size={18} className="text-primary" />
                                            Lecture Notes
                                        </h3>
                                        <div style={{
                                            fontSize: '0.9375rem',
                                            lineHeight: 1.7,
                                            color: 'var(--text-main)',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {lesson.content}
                                        </div>
                                    </div>
                                )}

                                {/* Lesson Resources */}
                                {lesson.resources && lesson.resources.length > 0 && (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={18} className="text-primary" />
                                            Study Materials ({lesson.resources.length})
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                            {lesson.resources.map(resource => (
                                                <div
                                                    key={resource.id}
                                                    className="card glass"
                                                    style={{
                                                        padding: '1rem',
                                                        border: '1px solid var(--border)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onClick={() => {
                                                        // TODO: Open resource viewer modal
                                                        console.log('View resource:', resource);
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{
                                                            padding: '0.75rem',
                                                            background: 'white',
                                                            borderRadius: '8px',
                                                            color: 'var(--primary)'
                                                        }}>
                                                            <FileText size={20} />
                                                        </div>
                                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                                            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {resource.title}
                                                            </h4>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                {resource.resource_type}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Lesson-specific Assessments */}
                                {lessonAssessments.length > 0 && (
                                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <BarChart3 size={18} className="text-primary" />
                                            Assessments for this Lesson ({lessonAssessments.length})
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                            {lessonAssessments.map(assessment => (
                                                <div
                                                    key={assessment.id}
                                                    className="card glass"
                                                    style={{
                                                        padding: '1.25rem',
                                                        border: '1px solid var(--border)',
                                                        background: 'var(--bg-main)'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '20px',
                                                            background: assessment.assessment_type === 'CAT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                            color: assessment.assessment_type === 'CAT' ? '#ef4444' : 'var(--primary)',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {assessment.assessment_type}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                            <Clock size={12} />
                                                            {assessment.duration_minutes ? `${assessment.duration_minutes}m` : 'No limit'}
                                                        </div>
                                                    </div>
                                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{assessment.title}</h4>
                                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                                        <div>
                                                            <span style={{ color: 'var(--text-muted)' }}>Points: </span>
                                                            <span style={{ fontWeight: 600 }}>{assessment.points}</span>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: 'var(--text-muted)' }}>Due: </span>
                                                            <span style={{ fontWeight: 600 }}>{new Date(assessment.due_date).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        style={{ width: '100%' }}
                                                        onClick={() => navigate(`/student/assessment/${assessment.id}`)}
                                                    >
                                                        {assessment.assessment_type === 'Assignment' ? 'Submit Work' : 'Start Assessment'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Unit-level Assessments (not tied to specific lessons) */}
                    {assessmentsByLesson['unit'] && assessmentsByLesson['unit'].length > 0 && (
                        <div className="card" style={{ padding: '2rem', border: '2px solid var(--border)' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <BarChart3 size={24} className="text-primary" />
                                Unit-wide Assessments
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                                {assessmentsByLesson['unit'].map(assessment => (
                                    <div
                                        key={assessment.id}
                                        className="card glass"
                                        style={{
                                            padding: '1.25rem',
                                            border: '1px solid var(--border)',
                                            background: 'var(--bg-main)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '20px',
                                                background: assessment.assessment_type === 'CAT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                color: assessment.assessment_type === 'CAT' ? '#ef4444' : 'var(--primary)',
                                                textTransform: 'uppercase'
                                            }}>
                                                {assessment.assessment_type}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                <Clock size={12} />
                                                {assessment.duration_minutes ? `${assessment.duration_minutes}m` : 'No limit'}
                                            </div>
                                        </div>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>{assessment.title}</h4>
                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Points: </span>
                                                <span style={{ fontWeight: 600 }}>{assessment.points}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--text-muted)' }}>Due: </span>
                                                <span style={{ fontWeight: 600 }}>{new Date(assessment.due_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            style={{ width: '100%' }}
                                            onClick={() => navigate(`/student/assessment/${assessment.id}`)}
                                        >
                                            {assessment.assessment_type === 'Assignment' ? 'Submit Work' : 'Start Assessment'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {allLessons.length === 0 && (
                        <div className="card" style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-main)', border: '2px dashed var(--border)' }}>
                            <BookOpen size={48} className="text-muted" style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Lessons Yet</h3>
                            <p className="text-muted">Your trainer hasn't added any lessons to this unit yet.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderCourses = () => {
        if (selectedUnit) return renderUnitContent(selectedUnit);

        return (
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
                                {u.is_enrolled ? (
                                    <button onClick={() => setSelectedUnit(u)} className="btn btn-primary btn-sm">
                                        <BookOpen size={14} /> Explore Content
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEnroll(u.id);
                                        }}
                                        className="btn btn-primary btn-sm"
                                        disabled={enrolling === u.id}
                                    >
                                        {enrolling === u.id ? (
                                            <div className="animate-spin" style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                        ) : (
                                            <Plus size={14} />
                                        )}
                                        {enrolling === u.id ? 'Enrolling...' : 'Enroll Now'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {units.length === 0 && (
                        <div className="card" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', background: 'var(--bg-main)', border: '2px dashed var(--border)' }}>
                            <BookOpen size={48} className="text-muted" style={{ margin: '0 auto 1.5rem', opacity: 0.2 }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Units Found</h3>
                            <p className="text-muted">You are not currently enrolled in any units. Please contact the administration if you believe this is an error.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

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

    const renderAssessments = () => {
        const allAssessments = units
            .filter(u => u.is_enrolled)
            .flatMap(u => (u.assessments || []).map(a => ({ ...a, unitName: u.name, unitCode: u.code })))
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        return (
            <div className="animate-fade-in">
                <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                    <div>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Assessments & Grading</h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Track your academic progress and upcoming evaluative tasks.</p>
                    </div>
                    <div className="card glass" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Points Earned</p>
                            <p style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--primary)' }}>0 / 0</p>
                        </div>
                        <BarChart3 size={24} className="text-primary" />
                    </div>
                </div>

                <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', background: 'white' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Assessment / Unit</th>
                                    <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Type</th>
                                    <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Deadline</th>
                                    <th style={{ textAlign: 'left', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Weight</th>
                                    <th style={{ textAlign: 'right', padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allAssessments.map((a, idx) => {
                                    const isPastSelection = new Date(a.due_date) < new Date();
                                    return (
                                        <tr key={`${a.id}-${idx}`} style={{ transition: 'background 0.2s', background: idx % 2 === 0 ? 'white' : '#fafafa' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafafa'}>
                                            <td style={{ padding: '1.25rem 2rem', borderBottom: idx === allAssessments.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '10px', color: 'var(--primary)' }}>
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{a.title}</div>
                                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{a.unitCode}: {a.unitName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem', borderBottom: idx === allAssessments.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    padding: '0.375rem 0.875rem',
                                                    borderRadius: '20px',
                                                    background: a.assessment_type === 'CAT' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                                    color: a.assessment_type === 'CAT' ? '#ef4444' : 'var(--primary)',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {a.assessment_type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem', borderBottom: idx === allAssessments.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isPastSelection ? '#ef4444' : 'var(--text-main)', fontWeight: isPastSelection ? 600 : 400 }}>
                                                    <Clock size={16} />
                                                    {new Date(a.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem', borderBottom: idx === allAssessments.length - 1 ? 'none' : '1px solid var(--border)', fontWeight: 600 }}>
                                                {a.points} Pts
                                            </td>
                                            <td style={{ padding: '1.25rem 2rem', textAlign: 'right', borderBottom: idx === allAssessments.length - 1 ? 'none' : '1px solid var(--border)' }}>
                                                <button
                                                    onClick={() => navigate(`/student/assessment/${a.id}`)}
                                                    className={`btn btn-sm ${isPastSelection ? 'glass' : 'btn-primary'}`}
                                                    style={{ borderRadius: '8px', padding: '0.5rem 1.25rem' }}
                                                >
                                                    {a.assessment_type === 'Assignment' ? 'Submit' : 'Take Test'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {allAssessments.length === 0 && (
                        <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
                            <div style={{ width: '80px', height: '80px', background: 'var(--bg-main)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid var(--border)' }}>
                                <BarChart3 size={40} className="text-muted" style={{ opacity: 0.3 }} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>No Assessments Yet</h3>
                            <p className="text-muted" style={{ maxWidth: '400px', margin: '0.5rem auto 0' }}>Enrolled units will appear here once they have active CATs or assignments assigned to you.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

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
