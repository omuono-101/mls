import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import {
    ChevronLeft, CheckCircle, AlertCircle, Clock,
    Save, User, Mail, BarChart3, Edit3
} from 'lucide-react';

interface StudentAnswer {
    id: number;
    question_text: string;
    question_type: string;
    question_points: number;
    answer_text?: string;
    selected_option_text?: string;
    is_correct?: boolean;
    points_earned: number | null;
    feedback: string;
}

interface Submission {
    id: number;
    student_name: string;
    student_email: string;
    assessment_title: string;
    assessment_type: string;
    submitted_at: string;
    grade: number | null;
    auto_graded_score: number | null;
    is_graded: boolean;
    feedback: string;
    student_answers: StudentAnswer[];
    total_points: number;
}

const SubmissionGrading: React.FC = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [manualGrades, setManualGrades] = useState<Record<number, { points: number; feedback: string }>>({});
    const [generalFeedback, setGeneralFeedback] = useState('');

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`submissions/by_assessment/?assessment_id=${assessmentId}`);
            setSubmissions(response.data);
        } catch (error) {
            console.error('Failed to fetch submissions', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (assessmentId) {
            fetchSubmissions();
        }
    }, [assessmentId]);

    const handleSelectSubmission = async (submissionId: number) => {
        try {
            setLoading(true);
            const response = await api.get(`submissions/${submissionId}/`);
            const submission: Submission = response.data;
            setSelectedSubmission(submission);
            setGeneralFeedback(submission.feedback || '');

            // Initialize manual grades state
            const initialGrades: Record<number, { points: number; feedback: string }> = {};
            submission.student_answers.forEach(ans => {
                initialGrades[ans.id] = {
                    points: ans.points_earned || 0,
                    feedback: ans.feedback || ''
                };
            });
            setManualGrades(initialGrades);
        } catch (error) {
            console.error('Failed to fetch submission details', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = (answerId: number, points: number) => {
        setManualGrades(prev => ({
            ...prev,
            [answerId]: { ...prev[answerId], points }
        }));
    };

    const handleAnswerFeedbackChange = (answerId: number, feedback: string) => {
        setManualGrades(prev => ({
            ...prev,
            [answerId]: { ...prev[answerId], feedback }
        }));
    };

    const calculateCurrentTotal = () => {
        if (!selectedSubmission) return 0;
        return Object.values(manualGrades).reduce((sum, g) => sum + (Number(g.points) || 0), 0);
    };

    const handleSubmitGrades = async () => {
        if (!selectedSubmission) return;
        setSaving(true);
        try {
            const payload = {
                feedback: generalFeedback,
                graded_answers: Object.entries(manualGrades).map(([id, data]) => ({
                    answer_id: parseInt(id),
                    points_earned: data.points,
                    feedback: data.feedback
                }))
            };

            await api.post(`submissions/${selectedSubmission.id}/grade_answers/`, payload);
            alert('Grades submitted successfully!');
            setSelectedSubmission(null);
            fetchSubmissions();
        } catch (error) {
            console.error('Failed to submit grades', error);
            alert('Failed to submit grades. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading && !selectedSubmission && submissions.length === 0) {
        return <DashboardLayout><div>Loading submissions...</div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <button
                    onClick={() => selectedSubmission ? setSelectedSubmission(null) : navigate(-1)}
                    className="btn glass btn-sm"
                    style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ChevronLeft size={18} />
                    {selectedSubmission ? 'Back to Submissions' : 'Back to Dashboard'}
                </button>

                {!selectedSubmission ? (
                    <div className="animate-fade-in">
                        <div style={{ marginBottom: '2rem' }}>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Student Submissions</h1>
                            <p style={{ color: 'var(--text-muted)' }}>
                                Review and grade submissions for this assessment.
                            </p>
                        </div>

                        {submissions.length === 0 ? (
                            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
                                <AlertCircle size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
                                <h3>No submissions yet</h3>
                                <p className="text-muted">No students have submitted this assessment yet.</p>
                            </div>
                        ) : (
                            <div className="card glass" style={{ overflow: 'hidden', padding: 0 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
                                        <tr>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Student</th>
                                            <th style={{ padding: '1rem', textAlign: 'left' }}>Date Submitted</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Score</th>
                                            <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map(sub => (
                                            <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '50%', color: 'var(--primary)' }}>
                                                            <User size={18} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>{sub.student_name}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.student_email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                                        <Clock size={14} className="text-muted" />
                                                        {new Date(sub.submitted_at).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ fontWeight: 800 }}>
                                                        {sub.is_graded ? (
                                                            <span style={{ color: 'var(--primary)' }}>{sub.grade} / {sub.total_points}</span>
                                                        ) : (
                                                            <span className="text-muted">-- / {sub.total_points}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        background: sub.is_graded ? '#ecfdf5' : '#fff7ed',
                                                        color: sub.is_graded ? '#059669' : '#ea580c'
                                                    }}>
                                                        {sub.is_graded ? 'Graded' : 'Needs Review'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <button
                                                        className={`btn btn-sm ${sub.is_graded ? 'glass' : 'btn-primary'}`}
                                                        onClick={() => handleSelectSubmission(sub.id)}
                                                    >
                                                        {sub.is_graded ? 'Review' : 'Grade Now'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {/* Grading View */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                            <div>
                                <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>Grading Submission</h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                        <User size={16} />
                                        <span>{selectedSubmission.student_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                        <Mail size={16} />
                                        <span>{selectedSubmission.student_email}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                        <Clock size={16} />
                                        <span>Submitted: {new Date(selectedSubmission.submitted_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="card glass" style={{ textAlign: 'right', padding: '1.5rem 2rem' }}>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Current Total</p>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                                    {calculateCurrentTotal()} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {selectedSubmission.total_points}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {selectedSubmission.student_answers.map((ans, idx) => {
                                    const isAutoGraded = ['MCQ', 'TF'].includes(ans.question_type);

                                    return (
                                        <div key={ans.id} className="card" style={{ padding: '2rem', border: `2px solid ${isAutoGraded ? 'var(--border)' : 'var(--primary-light)'}` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{
                                                        background: 'var(--bg-alt)',
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '8px',
                                                        fontWeight: 700,
                                                        fontSize: '0.875rem'
                                                    }}>
                                                        Q{idx + 1}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                                        {ans.question_type}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <input
                                                            type="number"
                                                            value={manualGrades[ans.id]?.points || 0}
                                                            onChange={(e) => handleGradeChange(ans.id, parseFloat(e.target.value))}
                                                            style={{
                                                                width: '60px',
                                                                textAlign: 'center',
                                                                padding: '0.4rem',
                                                                borderRadius: '8px',
                                                                border: '1px solid var(--border)',
                                                                fontWeight: 700
                                                            }}
                                                            max={ans.question_points}
                                                            min={0}
                                                            step={0.5}
                                                        />
                                                        <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>/ {ans.question_points} pts</span>
                                                    </div>
                                                    {isAutoGraded && (
                                                        <span style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            color: ans.is_correct ? '#059669' : '#dc2626'
                                                        }}>
                                                            {ans.is_correct ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                                            {ans.is_correct ? 'Auto-Correct' : 'Auto-Incorrect'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>{ans.question_text}</p>

                                            <div style={{
                                                padding: '1.25rem',
                                                background: 'var(--bg-alt)',
                                                borderRadius: '12px',
                                                marginBottom: '1.5rem'
                                            }}>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Student's Answer:</p>
                                                <p style={{ fontSize: '1rem', fontWeight: 500 }}>
                                                    {ans.question_type === 'MCQ' ? ans.selected_option_text : ans.answer_text || '(No answer provided)'}
                                                </p>
                                            </div>

                                            <div>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Question Feedback:</p>
                                                <textarea
                                                    value={manualGrades[ans.id]?.feedback || ''}
                                                    onChange={(e) => handleAnswerFeedbackChange(ans.id, e.target.value)}
                                                    placeholder="Add feedback for this specific question..."
                                                    className="input"
                                                    style={{ width: '100%', height: '80px', paddingTop: '0.75rem' }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="card" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <Edit3 size={20} className="text-primary" />
                                        Final Summary
                                    </h3>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Overall Feedback</label>
                                        <textarea
                                            value={generalFeedback}
                                            onChange={(e) => setGeneralFeedback(e.target.value)}
                                            placeholder="Great work! You've shown a good understanding of..."
                                            className="input"
                                            style={{ width: '100%', height: '150px', paddingTop: '0.75rem' }}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%' }}
                                        onClick={handleSubmitGrades}
                                        disabled={saving}
                                    >
                                        <Save size={20} />
                                        {saving ? 'Saving...' : 'Submit All Grades'}
                                    </button>
                                </div>

                                <div className="card glass" style={{ padding: '1.5rem' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem' }}>
                                        <BarChart3 size={18} />
                                        Assessment Info
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="text-muted">Type:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedSubmission.assessment_type}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="text-muted">Questions:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedSubmission.student_answers.length}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span className="text-muted">Max Points:</span>
                                            <span style={{ fontWeight: 600 }}>{selectedSubmission.total_points}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default SubmissionGrading;
