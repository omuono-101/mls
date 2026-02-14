import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import {
    FileUp, Calendar, AlertCircle, CheckCircle,
    ChevronLeft, Send
} from 'lucide-react';

interface Question {
    id: number;
    question_text: string;
    question_type: 'MCQ' | 'TF' | 'SHORT' | 'ESSAY' | 'FILL';
    points: number;
    order: number;
    options?: { id: number; option_text: string }[];
}

interface Assessment extends AssessmentBase {
    questions?: Question[];
    instructions?: string;
}

interface AssessmentBase {
    id: number;
    assessment_type: string;
    points: number;
    due_date: string;
    unit_name: string;
    title?: string;
}

const AssessmentSubmission: React.FC = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [mode, setMode] = useState<'upload' | 'interactive'>('upload');

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const response = await api.get(`assessments/${assessmentId}/`);
                setAssessment(response.data);
                if (response.data.questions && response.data.questions.length > 0) {
                    setMode('interactive');
                }
            } catch (error) {
                console.error('Failed to fetch assessment', error);
            }
        };
        fetchAssessment();
    }, [assessmentId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (mode === 'upload') {
                if (!file) return;
                const formData = new FormData();
                formData.append('assessment', assessmentId || '');
                formData.append('file', file);
                await api.post('submissions/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // Interactive submission
                const submissionRes = await api.post('submissions/', {
                    assessment: assessmentId,
                    content: "Online Submission"
                });

                const submissionId = submissionRes.data.id;
                const formattedAnswers = Object.keys(answers).map(qId => {
                    const question = assessment?.questions?.find(q => q.id === parseInt(qId));
                    return {
                        question_id: parseInt(qId),
                        selected_option_id: question?.question_type === 'MCQ' ? answers[parseInt(qId)] : null,
                        answer_text: question?.question_type !== 'MCQ' ? answers[parseInt(qId)].toString() : ''
                    };
                });

                await api.post('student-answers/submit_answers/', {
                    submission_id: submissionId,
                    answers: formattedAnswers
                });
            }
            setSuccess(true);
        } catch (error) {
            console.error('Submission failed', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!assessment) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate(-1)}
                    className="btn"
                    style={{ marginBottom: '1.5rem', padding: 0, color: 'var(--text-muted)' }}
                >
                    <ChevronLeft size={20} />
                    Back
                </button>

                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {assessment.title || `${assessment.assessment_type} Submission`}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{assessment.unit_name}</p>
                    {assessment.instructions && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-alt)', borderRadius: '12px', fontSize: '0.9rem' }}>
                            <strong>Instructions:</strong> {assessment.instructions}
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Calendar size={24} style={{ color: 'var(--primary)' }} />
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Due Date</p>
                            <p style={{ fontWeight: 700 }}>{new Date(assessment.due_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <AlertCircle size={24} style={{ color: 'var(--primary)' }} />
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Points</p>
                            <p style={{ fontWeight: 700 }}>{assessment.points} Points Weight</p>
                        </div>
                    </div>
                </div>

                {success ? (
                    <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '4rem', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
                        <CheckCircle size={64} style={{ color: '#10b981', margin: '0 auto 1.5rem' }} />
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#064e3b', marginBottom: '1rem' }}>Submission Successful!</h2>
                        <p style={{ color: '#065f46', marginBottom: '2.5rem' }}>Your answers have been submitted successfully. Auto-graded parts are processed immediately.</p>
                        <button onClick={() => navigate('/student')} className="btn btn-primary">
                            Return to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="card">
                        <form onSubmit={handleSubmit}>
                            {mode === 'interactive' && assessment.questions ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    {assessment.questions.map((q, idx) => (
                                        <div key={q.id} className="question-item" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <h4 style={{ fontWeight: 700 }}>Question {idx + 1}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.points} Points</span>
                                            </div>
                                            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{q.question_text}</p>

                                            {q.question_type === 'MCQ' && q.options && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {q.options.map(opt => (
                                                        <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: '8px', cursor: 'pointer' }}>
                                                            <input
                                                                type="radio"
                                                                name={`q-${q.id}`}
                                                                value={opt.id}
                                                                onChange={() => handleAnswerChange(q.id, opt.id)}
                                                                checked={answers[q.id] === opt.id}
                                                                required
                                                            />
                                                            {opt.option_text}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {q.question_type === 'TF' && (
                                                <div style={{ display: 'flex', gap: '1rem' }}>
                                                    {['True', 'False'].map(val => (
                                                        <label key={val} style={{ flex: 1, textAlign: 'center', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: answers[q.id] === val ? 'var(--primary-light)' : 'transparent' }}>
                                                            <input
                                                                type="radio"
                                                                name={`q-${q.id}`}
                                                                value={val}
                                                                onChange={() => handleAnswerChange(q.id, val)}
                                                                checked={answers[q.id] === val}
                                                                style={{ display: 'none' }}
                                                                required
                                                            />
                                                            {val}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {['SHORT', 'ESSAY', 'FILL'].includes(q.question_type) && (
                                                <textarea
                                                    className="input"
                                                    style={{ minHeight: q.question_type === 'ESSAY' ? '150px' : '60px' }}
                                                    placeholder="Type your answer here..."
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    required
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    border: '2px dashed var(--border)',
                                    borderRadius: 'var(--radius)',
                                    padding: '3rem',
                                    textAlign: 'center',
                                    background: 'var(--bg-main)',
                                    marginBottom: '2rem',
                                    position: 'relative',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer'
                                }}
                                    onDragOver={(e) => e.preventDefault()}
                                    className="upload-zone"
                                >
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer'
                                        }}
                                        required={mode === 'upload'}
                                    />
                                    <FileUp size={48} style={{ color: 'var(--primary)', marginBottom: '1rem', opacity: 0.5 }} />
                                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                                        {file ? file.name : 'Click or drag file to upload'}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Accepted format: PDF, DOCX, ZIP (Max 20MB)
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1rem', marginTop: '2rem' }}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : (
                                    <>
                                        <Send size={18} />
                                        Submit Assessment
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AssessmentSubmission;
