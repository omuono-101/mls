import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import {
    FileText, Clock, CheckCircle, AlertCircle, 
    ChevronRight, Download, Eye, Star, Calendar,
    Send, XCircle, BookOpen
} from 'lucide-react';

interface Submission {
    id: number;
    assessment: number;
    assessment_title: string;
    assessment_type: string;
    student_name: string;
    student_email: string;
    file?: string;
    content?: string;
    grade?: number | null;
    auto_graded_score?: number | null;
    feedback?: string;
    submitted_at: string;
    is_graded: boolean;
    is_late: boolean;
    total_points?: number;
}

interface Assessment {
    id: number;
    title: string;
    assessment_type: string;
    unit_name: string;
    unit: number;
    points: number;
    due_date: string;
}

const MySubmissions: React.FC = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'graded' | 'pending'>('all');
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await api.get('submissions/');
            setSubmissions(response.data.results || response.data);
            
            // Also fetch available assessments to show which ones haven't been submitted
            const assessmentsRes = await api.get('assessments/');
            const allAssessments = assessmentsRes.data.results || assessmentsRes.data;
            
            // Get submitted assessment IDs
            const submittedIds = new Set((response.data.results || response.data).map((s: Submission) => s.assessment));
            
            // Filter out already submitted assessments
            const availableAssessments = allAssessments.filter((a: Assessment) => !submittedIds.has(a.id));
            setAssessments(availableAssessments);
        } catch (error) {
            console.error('Failed to fetch submissions', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (submission: Submission) => {
        if (submission.is_graded) {
            return <CheckCircle size={18} style={{ color: '#10b981' }} />;
        }
        if (submission.is_late) {
            return <Clock size={18} style={{ color: '#f59e0b' }} />;
        }
        return <AlertCircle size={18} style={{ color: 'var(--primary)' }} />;
    };

    const getStatusText = (submission: Submission) => {
        if (submission.is_graded) return 'Graded';
        if (submission.is_late) return 'Late Submission';
        return 'Pending Review';
    };

    const getStatusColor = (submission: Submission) => {
        if (submission.is_graded) return '#10b981';
        if (submission.is_late) return '#f59e0b';
        return 'var(--primary)';
    };

    const getGradeColor = (submission: Submission) => {
        if (!submission.grade && submission.grade !== 0) return 'var(--text-muted)';
        const percentage = (submission.grade / (submission.total_points || 1)) * 100;
        if (percentage >= 70) return '#10b981';
        if (percentage >= 50) return '#f59e0b';
        return '#f43f5e';
    };

    const filteredSubmissions = submissions.filter(sub => {
        if (filter === 'graded') return sub.is_graded;
        if (filter === 'pending') return !sub.is_graded;
        return true;
    });

    const totalPending = submissions.filter(s => !s.is_graded).length;
    const totalGraded = submissions.filter(s => s.is_graded).length;
    const averageGrade = submissions.filter(s => s.is_graded && s.grade !== null).reduce((acc, s) => acc + (s.grade || 0), 0) / (totalGraded || 1);

    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                        My Submissions
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Track your assessment submissions and grades from trainers.
                    </p>
                </div>

                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="card-premium" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '12px', color: 'var(--primary)' }}>
                                <FileText size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{submissions.length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #f59e0b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '12px', color: '#f59e0b' }}>
                                <Clock size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{totalPending}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Pending</div>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #10b981' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px', color: '#10b981' }}>
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{totalGraded}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Graded</div>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium" style={{ padding: '1.5rem', borderRadius: '20px', borderLeft: '4px solid #8b5cf6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.75rem', borderRadius: '12px', color: '#8b5cf6' }}>
                                <Star size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{averageGrade.toFixed(1)}%</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Average</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Available Assessments to Submit */}
                {assessments.length > 0 && (
                    <div className="card-premium" style={{ padding: '2rem', borderRadius: '24px', marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={22} className="text-primary" /> Available for Submission
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {assessments.map(assessment => (
                                <div 
                                    key={assessment.id}
                                    className="glass hover-scale"
                                    style={{
                                        padding: '1.25rem',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        cursor: 'pointer',
                                        background: 'white'
                                    }}
                                    onClick={() => navigate(`/student/assessment/${assessment.id}`)}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{assessment.title}</div>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <span className="badge badge-primary">{assessment.assessment_type}</span>
                                            <span>{assessment.unit_name}</span>
                                            <span>{assessment.points} pts</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Due: {new Date(assessment.due_date).toLocaleDateString()}
                                        </span>
                                        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}>
                                            Start
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    {(['all', 'graded', 'pending'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`btn ${filter === f ? 'btn-primary' : ''}`}
                            style={{
                                padding: '0.5rem 1.25rem',
                                borderRadius: '12px',
                                background: filter === f ? 'var(--primary)' : 'var(--bg-main)',
                                color: filter === f ? 'white' : 'var(--text-muted)',
                                border: filter === f ? 'none' : '1px solid var(--border)'
                            }}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? submissions.length : f === 'graded' ? totalGraded : totalPending})
                        </button>
                    ))}
                </div>

                {/* Submissions List */}
                <div className="card-premium" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
                        </div>
                    ) : filteredSubmissions.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center' }}>
                            <FileText size={48} style={{ color: 'var(--text-muted)', opacity: 0.2, margin: '0 auto 1rem' }} />
                            <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>No Submissions Yet</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Your submitted assessments will appear here.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {filteredSubmissions.map((submission, idx) => (
                                <div
                                    key={submission.id}
                                    className="animate-fade-in"
                                    style={{
                                        padding: '1.5rem 2rem',
                                        borderBottom: idx === filteredSubmissions.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.03)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        background: selectedSubmission?.id === submission.id ? 'var(--bg-main)' : 'white',
                                        transition: 'all 0.2s ease',
                                        animationDelay: `${idx * 0.05}s`
                                    }}
                                    onClick={() => setSelectedSubmission(selectedSubmission?.id === submission.id ? null : submission)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                                        <div style={{ 
                                            background: 'var(--primary-light)', 
                                            padding: '0.75rem', 
                                            borderRadius: '12px', 
                                            color: 'var(--primary)',
                                            display: 'flex'
                                        }}>
                                            {getStatusIcon(submission)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{submission.assessment_title}</span>
                                                <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                                    {submission.assessment_type}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Calendar size={14} /> {new Date(submission.submitted_at).toLocaleDateString()}
                                                </span>
                                                {submission.is_late && (
                                                    <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <AlertCircle size={14} /> Late
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ 
                                                fontWeight: 800, 
                                                fontSize: '1.25rem',
                                                color: getGradeColor(submission)
                                            }}>
                                                {submission.grade !== null && submission.grade !== undefined 
                                                    ? `${submission.grade}/${submission.total_points || submission.grade}`
                                                    : '--'
                                                }
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                                                {getStatusText(submission)}
                                            </div>
                                        </div>
                                        <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submission Details Modal */}
                {selectedSubmission && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setSelectedSubmission(null)}
                    >
                        <div 
                            className="card animate-fade-in"
                            style={{
                                width: '100%',
                                maxWidth: '600px',
                                maxHeight: '80vh',
                                overflow: 'auto',
                                position: 'relative',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedSubmission(null)}
                                style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <XCircle size={24} style={{ color: 'var(--text-muted)' }} />
                            </button>

                            <div style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                    {getStatusIcon(selectedSubmission)}
                                    <div>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedSubmission.assessment_title}</h2>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedSubmission.assessment_type}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="glass" style={{ padding: '1rem', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                                            Submitted
                                        </div>
                                        <div style={{ fontWeight: 700 }}>{new Date(selectedSubmission.submitted_at).toLocaleString()}</div>
                                    </div>
                                    <div className="glass" style={{ padding: '1rem', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                                            Status
                                        </div>
                                        <div style={{ fontWeight: 700, color: getStatusColor(selectedSubmission) }}>{getStatusText(selectedSubmission)}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="glass" style={{ padding: '1rem', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                                            Points Earned
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: getGradeColor(selectedSubmission) }}>
                                            {selectedSubmission.grade !== null && selectedSubmission.grade !== undefined 
                                                ? `${selectedSubmission.grade}/${selectedSubmission.total_points || 100}`
                                                : 'Pending'}
                                        </div>
                                    </div>
                                    <div className="glass" style={{ padding: '1rem', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                                            Auto Score
                                        </div>
                                        <div style={{ fontWeight: 700 }}>
                                            {selectedSubmission.auto_graded_score !== null 
                                                ? `${selectedSubmission.auto_graded_score}` 
                                                : '--'}
                                        </div>
                                    </div>
                                </div>

                                {selectedSubmission.feedback && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                                            Trainer Feedback
                                        </div>
                                        <div className="glass" style={{ padding: '1rem', borderRadius: '12px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                                            {selectedSubmission.feedback}
                                        </div>
                                    </div>
                                )}

                                {selectedSubmission.file && (
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <a
                                            href={selectedSubmission.file}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn"
                                            style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <Eye size={18} /> View Submission
                                        </a>
                                        <a
                                            href={selectedSubmission.file}
                                            download
                                            className="btn btn-primary"
                                            style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <Download size={18} /> Download
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MySubmissions;
