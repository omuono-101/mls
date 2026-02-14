import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { Plus, Save, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';

interface Question {
    id?: number;
    question_text: string;
    question_type: 'MCQ' | 'TF' | 'SHORT' | 'ESSAY' | 'FILL';
    points: number;
    order: number;
    options?: QuestionOption[];
    correct_answers?: Answer[];
}

interface QuestionOption {
    id?: number;
    option_text: string;
    is_correct: boolean;
    order: number;
}

interface Answer {
    id?: number;
    answer_text?: string;
    is_correct_for_tf?: boolean;
}

interface Assessment {
    id?: number;
    title: string;
    instructions: string;
    assessment_type: string;
    unit: number;
    points: number;
    due_date: string;
    duration_minutes?: number;
}

const AssessmentAuthoring: React.FC = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeQuestion, setActiveQuestion] = useState<number | null>(null);

    useEffect(() => {
        if (assessmentId) {
            fetchAssessment();
        }
    }, [assessmentId]);

    const fetchAssessment = async () => {
        try {
            const res = await api.get(`assessments/${assessmentId}/`);
            setAssessment(res.data);
            if (res.data.questions) {
                setQuestions(res.data.questions);
            }
        } catch (error) {
            console.error('Failed to fetch assessment', error);
        }
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            question_text: '',
            question_type: 'MCQ',
            points: 1,
            order: questions.length + 1,
            options: [
                { option_text: '', is_correct: false, order: 1 },
                { option_text: '', is_correct: false, order: 2 },
                { option_text: '', is_correct: false, order: 3 },
                { option_text: '', is_correct: false, order: 4 }
            ]
        };
        setQuestions([...questions, newQuestion]);
        setActiveQuestion(questions.length);
    };

    const updateQuestion = (index: number, field: keyof Question, value: any) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };

        // Reset options when changing question type
        if (field === 'question_type') {
            if (value === 'MCQ') {
                updated[index].options = [
                    { option_text: '', is_correct: false, order: 1 },
                    { option_text: '', is_correct: false, order: 2 },
                    { option_text: '', is_correct: false, order: 3 },
                    { option_text: '', is_correct: false, order: 4 }
                ];
            } else if (value === 'TF') {
                updated[index].correct_answers = [{ is_correct_for_tf: true }];
            } else {
                updated[index].options = undefined;
                updated[index].correct_answers = [{ answer_text: '' }];
            }
        }

        setQuestions(updated);
    };

    const updateOption = (qIndex: number, optIndex: number, field: keyof QuestionOption, value: any) => {
        const updated = [...questions];
        if (updated[qIndex].options) {
            updated[qIndex].options![optIndex] = { ...updated[qIndex].options![optIndex], [field]: value };

            // If marking as correct, unmark others
            if (field === 'is_correct' && value === true) {
                updated[qIndex].options!.forEach((opt, i) => {
                    if (i !== optIndex) opt.is_correct = false;
                });
            }
        }
        setQuestions(updated);
    };

    const addOption = (qIndex: number) => {
        const updated = [...questions];
        if (updated[qIndex].options) {
            updated[qIndex].options!.push({
                option_text: '',
                is_correct: false,
                order: updated[qIndex].options!.length + 1
            });
            setQuestions(updated);
        }
    };

    const removeOption = (qIndex: number, optIndex: number) => {
        const updated = [...questions];
        if (updated[qIndex].options && updated[qIndex].options!.length > 2) {
            updated[qIndex].options = updated[qIndex].options!.filter((_, i) => i !== optIndex);
            setQuestions(updated);
        } else {
            alert('An MCQ must have at least 2 options.');
        }
    };

    const saveAssessment = async () => {
        if (!assessment) return;

        // Basic validation
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question_text.trim()) {
                alert(`Question ${i + 1} text is required.`);
                setActiveQuestion(i);
                return;
            }
            if (q.question_type === 'MCQ') {
                const validOptions = q.options?.filter(opt => opt.option_text.trim() !== '') || [];
                if (validOptions.length < 2) {
                    alert(`Question ${i + 1} (MCQ) must have at least 2 non-empty options.`);
                    setActiveQuestion(i);
                    return;
                }
                if (!validOptions.some(opt => opt.is_correct)) {
                    alert(`Question ${i + 1} (MCQ) must have one correct option selected.`);
                    setActiveQuestion(i);
                    return;
                }
            }
        }

        setLoading(true);
        try {
            // Delete existing questions for this assessment to avoid duplicates if re-saving
            // (Alternative: handle updates by question ID)
            const existingQuestionsRes = await api.get(`questions/?assessment=${assessmentId}`);
            for (const q of existingQuestionsRes.data) {
                await api.delete(`questions/${q.id}/`);
            }

            // Save each question with its options/answers nested
            for (const question of questions) {
                const questionData: any = {
                    assessment: parseInt(assessmentId as string),
                    question_text: question.question_text,
                    question_type: question.question_type,
                    points: question.points,
                    order: question.order,
                    options: [],
                    correct_answers: []
                };

                // Add filtered options
                if (question.question_type === 'MCQ' && question.options) {
                    questionData.options = question.options
                        .filter(opt => opt.option_text.trim() !== '')
                        .map(opt => ({
                            option_text: opt.option_text,
                            is_correct: opt.is_correct,
                            order: opt.order
                        }));
                }

                // Add answers
                if (question.question_type === 'TF' && question.correct_answers) {
                    questionData.correct_answers = [{
                        is_correct_for_tf: question.correct_answers[0].is_correct_for_tf
                    }];
                } else if (['SHORT', 'ESSAY', 'FILL'].includes(question.question_type) && question.correct_answers) {
                    questionData.correct_answers = [{
                        answer_text: question.correct_answers[0].answer_text
                    }];
                }

                await api.post('questions/', questionData);
            }

            alert('Assessment saved successfully!');
            navigate('/trainer/enhanced');
        } catch (error: any) {
            console.error('Failed to save assessment', error);
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            alert(`Failed to save assessment: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const deleteQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
        setActiveQuestion(null);
    };

    if (!assessment && assessmentId) {
        return <DashboardLayout><div>Loading...</div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/trainer/enhanced')} className="btn" style={{ padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Assessment Authoring</h1>
                        <p style={{ color: 'var(--text-muted)' }}>{assessment?.title}</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={saveAssessment} disabled={loading}>
                    <Save size={20} />
                    {loading ? 'Saving...' : 'Save Assessment'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
                {/* Question List */}
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Questions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                        {questions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveQuestion(i)}
                                className="btn"
                                style={{
                                    justifyContent: 'flex-start',
                                    background: activeQuestion === i ? 'var(--primary)' : 'transparent',
                                    color: activeQuestion === i ? 'white' : 'var(--text-main)'
                                }}
                            >
                                Q{i + 1}: {q.question_type} ({q.points}pts)
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-primary" onClick={addQuestion} style={{ width: '100%' }}>
                        <Plus size={18} />
                        Add Question
                    </button>
                </div>

                {/* Question Editor */}
                <div className="card">
                    {activeQuestion !== null && questions[activeQuestion] ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Question {activeQuestion + 1}</h3>
                                <button className="btn" onClick={() => deleteQuestion(activeQuestion)} style={{ color: '#ef4444' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Question Type</label>
                                <select
                                    className="input"
                                    value={questions[activeQuestion].question_type}
                                    onChange={e => updateQuestion(activeQuestion, 'question_type', e.target.value)}
                                >
                                    <option value="MCQ">Multiple Choice</option>
                                    <option value="TF">True/False</option>
                                    <option value="SHORT">Short Answer</option>
                                    <option value="ESSAY">Essay</option>
                                    <option value="FILL">Fill in the Blank</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Question Text</label>
                                <textarea
                                    className="input"
                                    value={questions[activeQuestion].question_text}
                                    onChange={e => updateQuestion(activeQuestion, 'question_text', e.target.value)}
                                    style={{ minHeight: '100px' }}
                                    placeholder="Enter your question here..."
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Points</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={questions[activeQuestion].points}
                                    onChange={e => updateQuestion(activeQuestion, 'points', parseInt(e.target.value))}
                                    min="1"
                                />
                            </div>

                            {/* MCQ Options */}
                            {questions[activeQuestion].question_type === 'MCQ' && questions[activeQuestion].options && (
                                <div style={{ transition: 'all 0.3s ease' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Answer Options</h4>
                                        <button
                                            className="btn"
                                            onClick={() => addOption(activeQuestion)}
                                            style={{ color: 'var(--primary)', fontSize: '0.875rem' }}
                                        >
                                            <Plus size={16} /> Add Option
                                        </button>
                                    </div>
                                    {questions[activeQuestion].options!.map((opt, optIndex) => (
                                        <div key={optIndex} style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <input
                                                type="radio"
                                                checked={opt.is_correct}
                                                onChange={() => updateOption(activeQuestion, optIndex, 'is_correct', true)}
                                            />
                                            <input
                                                type="text"
                                                className="input"
                                                value={opt.option_text}
                                                onChange={e => updateOption(activeQuestion, optIndex, 'option_text', e.target.value)}
                                                placeholder={`Option ${optIndex + 1}`}
                                                style={{ flex: 1 }}
                                            />
                                            {opt.is_correct && <CheckCircle size={18} color="#10b981" />}
                                            <button
                                                className="btn"
                                                onClick={() => removeOption(activeQuestion, optIndex)}
                                                style={{ color: '#ef4444', padding: '0.25rem' }}
                                                disabled={questions[activeQuestion].options!.length <= 2}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* True/False */}
                            {questions[activeQuestion].question_type === 'TF' && (
                                <div>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Correct Answer</h4>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            className="btn"
                                            onClick={() => {
                                                const updated = [...questions];
                                                updated[activeQuestion].correct_answers = [{ is_correct_for_tf: true }];
                                                setQuestions(updated);
                                            }}
                                            style={{
                                                background: questions[activeQuestion].correct_answers?.[0]?.is_correct_for_tf === true ? '#10b981' : 'transparent',
                                                color: questions[activeQuestion].correct_answers?.[0]?.is_correct_for_tf === true ? 'white' : 'var(--text-main)'
                                            }}
                                        >
                                            True
                                        </button>
                                        <button
                                            className="btn"
                                            onClick={() => {
                                                const updated = [...questions];
                                                updated[activeQuestion].correct_answers = [{ is_correct_for_tf: false }];
                                                setQuestions(updated);
                                            }}
                                            style={{
                                                background: questions[activeQuestion].correct_answers?.[0]?.is_correct_for_tf === false ? '#10b981' : 'transparent',
                                                color: questions[activeQuestion].correct_answers?.[0]?.is_correct_for_tf === false ? 'white' : 'var(--text-main)'
                                            }}
                                        >
                                            False
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Short Answer/Essay/Fill */}
                            {['SHORT', 'ESSAY', 'FILL'].includes(questions[activeQuestion].question_type) && (
                                <div>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Model Answer (for reference)</h4>
                                    <textarea
                                        className="input"
                                        value={questions[activeQuestion].correct_answers?.[0]?.answer_text || ''}
                                        onChange={e => {
                                            const updated = [...questions];
                                            updated[activeQuestion].correct_answers = [{ answer_text: e.target.value }];
                                            setQuestions(updated);
                                        }}
                                        style={{ minHeight: '100px' }}
                                        placeholder="Enter model answer for grading reference..."
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                        This will require manual grading by the trainer.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <p>Select a question or add a new one to start editing</p>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AssessmentAuthoring;
