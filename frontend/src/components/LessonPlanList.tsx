import React from 'react';
import {
    FileText, Clock, CheckCircle, XCircle, Edit, Eye, Plus, Calendar
} from 'lucide-react';
import { useLessons } from '../hooks/useDataHooks';
import { useAuth } from '../context/AuthContext';

interface Lesson {
    id: number;
    unit: number;
    unit_name?: string;
    unit_code?: string;
    title: string;
    order: number;
    topic?: string;
    subtopic?: string;
    week?: number;
    session_date?: string;
    session_start?: string;
    session_end?: string;
    session?: string;
    is_taught: boolean;
    is_approved: boolean;
    is_active: boolean;
    audit_feedback?: string;
    trainer_name?: string;
    trainer?: number;
}

interface LessonPlanListProps {
    onCreateNew: () => void;
    onEdit: (lesson: Lesson) => void;
    onView: (lesson: Lesson) => void;
}

const LessonPlanList: React.FC<LessonPlanListProps> = ({ onCreateNew, onEdit, onView }) => {
    const { user } = useAuth();
    const { data: lessons = [], isLoading } = useLessons();

    // Filter lessons to show only those belonging to the current trainer
    const trainerLessons = lessons.filter((l: Lesson) => l.trainer === user?.id);

    const getStatusBadge = (lesson: Lesson) => {
        if (lesson.is_approved && lesson.is_active) {
            return <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> Approved</span>;
        }
        if (lesson.is_taught && !lesson.is_approved && !lesson.audit_feedback) {
            return <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> Pending</span>;
        }
        if (lesson.is_taught && !lesson.is_approved && lesson.audit_feedback) {
            return <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><XCircle size={14} /> Rejected</span>;
        }
        return <span style={{ background: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><FileText size={14} /> Draft</span>;
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Lesson Management</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Create and track your lesson plans for approval</p>
                </div>
                <button
                    onClick={onCreateNew}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} /> New Lesson Plan
                </button>
            </div>

            <div className="card-premium" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
                {trainerLessons.length === 0 ? (
                    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <FileText size={48} style={{ color: 'var(--text-muted)', opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p style={{ color: 'var(--text-muted)' }}>No lesson plans found. Start by creating your first plan.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lesson Details</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unit</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Schedule</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trainerLessons.sort((a: Lesson, b: Lesson) => b.id - a.id).map((lesson: Lesson) => (
                                    <tr key={lesson.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-bg">
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{lesson.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Topic: {lesson.topic || 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{lesson.unit_code}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lesson.unit_name}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                                                <Calendar size={14} style={{ color: 'var(--primary)' }} />
                                                {lesson.session_date || 'Date not set'}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Clock size={14} />
                                                {lesson.session_start || 'N/A'} - {lesson.session_end || 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-flex' }}>
                                                {getStatusBadge(lesson)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => onView(lesson)}
                                                    className="btn btn-sm"
                                                    style={{ background: 'var(--bg-muted)', color: 'var(--text-main)', padding: '0.4rem' }}
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {(!lesson.is_approved || lesson.audit_feedback) && (
                                                    <button
                                                        onClick={() => onEdit(lesson)}
                                                        className="btn btn-sm"
                                                        style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '0.4rem' }}
                                                        title="Edit Plan"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {trainerLessons.some((l: Lesson) => l.audit_feedback && !l.is_approved) && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(244, 63, 94, 0.05)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#f43f5e', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <XCircle size={18} /> Rejection Feedback Noted
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Some of your lesson plans have been returned for revision. Please check the feedback and update them for re-submission.
                    </p>
                </div>
            )}
        </div>
    );
};

export default LessonPlanList;
