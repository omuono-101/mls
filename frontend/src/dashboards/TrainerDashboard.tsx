import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, FileText, Upload, Plus, CheckCircle, Check, Database, FilePlus, X, Link as LinkIcon } from 'lucide-react';

interface Lesson {
    id: number;
    unit: number;
    title: string;
    is_lab: boolean;
    order: number;
    is_approved: boolean;
    is_taught: boolean;
}

interface Unit {
    id: number;
    name: string;
    code: string;
    trainer?: number;
}

interface Assessment {
    id: number;
    unit: number;
    assessment_type: string;
    points: number;
    due_date: string;
}

interface Submission {
    id: number;
    student_name: string;
    assessment: number;
    assessment_name: string;
    file: string;
    grade: number | null;
    feedback: string;
    submitted_at: string;
    total_points: number;
}

const TrainerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        unit: '',
        title: '',
        order: 1,
        is_lab: false,
        has_cat: false,
        has_assessment: true
    });

    const [resourceData, setResourceData] = useState({
        title: '',
        resource_type: 'PDF',
        file: null as File | null,
        url: '',
        description: ''
    });

    const fetchData = async () => {
        try {
            const [lRes, uRes, sRes, aRes] = await Promise.all([
                api.get('lessons/'),
                api.get('units/'),
                api.get('submissions/'),
                api.get('assessments/')
            ]);
            setLessons(lRes.data);
            setUnits(uRes.data);
            setSubmissions(sRes.data);
            setAssessments(aRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('lessons/', formData);
            setShowModal(false);
            setFormData({ unit: '', title: '', order: lessons.length + 1, is_lab: false, has_cat: false, has_assessment: true });
            fetchData();
        } catch (error) {
            console.error('Failed to create lesson', error);
            alert('Failed to create lesson. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLesson) return;
        setLoading(true);

        const uploadData = new FormData();
        uploadData.append('lesson', selectedLesson.id.toString());
        uploadData.append('title', resourceData.title);
        uploadData.append('resource_type', resourceData.resource_type);
        if (resourceData.file) uploadData.append('file', resourceData.file);
        if (resourceData.url) uploadData.append('url', resourceData.url);
        uploadData.append('description', resourceData.description);

        try {
            await api.post('resources/', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowResourceModal(false);
            setResourceData({ title: '', resource_type: 'PDF', file: null, url: '', description: '' });
            alert('Resource uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload resource', error);
            alert('Failed to upload resource.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsTaught = async (lessonId: number) => {
        setLoading(true);
        try {
            await api.patch(`lessons/${lessonId}/`, { is_taught: true });
            alert('Lesson marked as taught. It is now pending HOD approval.');
            fetchData();
        } catch (error) {
            console.error('Failed to mark lesson as taught', error);
            alert('Failed to mark lesson as taught.');
        } finally {
            setLoading(false);
        }
    };

    const trainerUnits = units.filter((u: any) => u.trainer === user?.id);

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Trainer Portal</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your assigned units, lessons, and student assessments.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={() => navigate('/trainer/authoring')}>
                        <FileText size={20} />
                        Course Authoring
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} />
                        Quick Create Lesson
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '12px' }}>
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Assigned Units</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{trainerUnits.length}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: '12px' }}>
                        <Upload size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Lessons Taught</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{lessons.filter(l => l.is_taught).length}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: '12px' }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pending Approval</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{lessons.filter(l => l.is_taught && !l.is_approved).length}</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {trainerUnits.map(u => {
                    const unitLessons = lessons.filter(l => l.unit === u.id).sort((a, b) => a.order - b.order);
                    const unitAssessments = assessments.filter(a => a.unit === u.id);

                    return (
                        <div key={u.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1.5rem', background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{u.code}: {u.name}</h2>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{unitLessons.length} Lessons | {unitAssessments.length} Assessments</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', padding: '1rem' }}>
                                {/* Lessons Column */}
                                <div>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BookOpen size={16} /> Course Outline
                                    </h3>
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {unitLessons.map(l => (
                                            <div key={l.id} className="glass" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: '30px', height: '30px', background: 'var(--bg-main)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                                                        {l.order}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{l.title}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.is_lab ? 'Lab' : 'Theory'}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {!l.is_taught ? (
                                                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: '#f3f4f6', color: '#6b7280', borderRadius: '4px', fontWeight: 600 }}>Draft</span>
                                                    ) : !l.is_approved ? (
                                                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontWeight: 600 }}>Pending</span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', background: '#d1fae5', color: '#065f46', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <CheckCircle size={10} /> Verified
                                                        </span>
                                                    )}
                                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                        <button
                                                            className="btn btn-sm"
                                                            title="Upload Resource"
                                                            style={{ padding: '0.4rem', minWidth: 'auto', background: '#f3f4f6', color: '#374151', borderRadius: '8px' }}
                                                            onClick={() => { setSelectedLesson(l); setShowResourceModal(true); }}
                                                        >
                                                            <Upload size={16} />
                                                        </button>
                                                        {!l.is_taught && (
                                                            <button
                                                                className="btn btn-sm"
                                                                title="Mark as Taught"
                                                                style={{ padding: '0.4rem', minWidth: 'auto', background: '#dcfce7', color: '#15803d', borderRadius: '8px' }}
                                                                onClick={() => handleMarkAsTaught(l.id)}
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Assessments Column */}
                                <div>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Database size={16} /> Required Assessments
                                    </h3>
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {unitAssessments.map(a => (
                                            <div key={a.id} className="glass" style={{ padding: '1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{a.assessment_type}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.points} Pts</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {new Date(a.due_date).toLocaleDateString()}</div>
                                            </div>
                                        ))}
                                        {unitAssessments.length === 0 && (
                                            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-alt)', borderRadius: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                No assessments configured.
                                            </div>
                                        )}
                                    </div>

                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FilePlus size={16} /> Student Submissions
                                    </h3>
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {submissions.filter(s => s.grade === null).map(s => (
                                            <div key={s.id} className="glass" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.student_name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.assessment_name}</div>
                                                </div>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => navigate(`/trainer/grade/${s.assessment}`)}
                                                >
                                                    Grade Submissions
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={16} /> Graded Submissions
                                    </h3>

                                    <div className="glass" style={{ padding: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assessment</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Percentage</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Graded Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {submissions.filter(s => s.grade !== null).map(s => {
                                                    const percentage = s.total_points > 0 ? Math.round((Number(s.grade) / s.total_points) * 100) : 0;
                                                    return (
                                                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600 }}>{s.student_name}</td>
                                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{s.assessment_name}</td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 700 }}>
                                                                {Number(s.grade).toFixed(1)} <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>/ {s.total_points}</span>
                                                            </td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                                                <span style={{
                                                                    display: 'inline-block',
                                                                    padding: '0.2rem 0.5rem',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 700,
                                                                    background: percentage >= 50 ? '#d1fae5' : '#fee2e2',
                                                                    color: percentage >= 50 ? '#065f46' : '#991b1b'
                                                                }}>
                                                                    {percentage}%
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                {new Date(s.submitted_at).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {submissions.filter(s => s.grade !== null).length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                            No graded submissions found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Create Lesson Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create New Lesson</h2>
                        <form onSubmit={handleCreateLesson}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Unit</label>
                                <select
                                    className="input"
                                    required
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                >
                                    <option value="">Select a unit...</option>
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>{u.code}: {u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Lesson Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    required
                                    placeholder="Enter lesson title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="is_lab"
                                        checked={formData.is_lab}
                                        onChange={(e) => setFormData({ ...formData, is_lab: e.target.checked })}
                                    />
                                    <label htmlFor="is_lab" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Lab Session</label>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="has_cat"
                                        checked={formData.has_cat}
                                        onChange={(e) => setFormData({ ...formData, has_cat: e.target.checked })}
                                    />
                                    <label htmlFor="has_cat" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Include CAT</label>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="has_assessment"
                                        checked={formData.has_assessment}
                                        onChange={(e) => setFormData({ ...formData, has_assessment: e.target.checked })}
                                    />
                                    <label htmlFor="has_assessment" style={{ fontSize: '0.875rem', fontWeight: 600 }}>Lesson Assessment (Points apply)</label>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resource Upload Modal */}
            {showResourceModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(8px)'
                }}>
                    <div className="card animate-fade-in" style={{
                        width: '100%',
                        maxWidth: '500px',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        overflow: 'hidden'
                    }}>
                        <button
                            onClick={() => setShowResourceModal(false)}
                            style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', zIndex: 10 }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                padding: '0.75rem',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                borderRadius: '12px',
                                marginBottom: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
                            }}>
                                <FilePlus size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Add Resource</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Upload materials to "{selectedLesson?.title}"</p>
                        </div>

                        <form onSubmit={handleUploadResource}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Resource Title</label>
                                    <input
                                        className="input"
                                        required
                                        value={resourceData.title}
                                        onChange={e => setResourceData({ ...resourceData, title: e.target.value })}
                                        placeholder="e.g. Week 1 Slides"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Type</label>
                                    <select
                                        className="input"
                                        required
                                        value={resourceData.resource_type}
                                        onChange={e => setResourceData({ ...resourceData, resource_type: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="PDF">PDF Document</option>
                                        <option value="PPT">PowerPoint</option>
                                        <option value="Video">Video</option>
                                        <option value="Link">External Link</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Description (Optional)</label>
                                <textarea
                                    className="input"
                                    value={resourceData.description}
                                    onChange={e => setResourceData({ ...resourceData, description: e.target.value })}
                                    placeholder="Read more, video timestamps, or references..."
                                    style={{ minHeight: '80px', resize: 'vertical', width: '100%' }}
                                />
                            </div>

                            {resourceData.resource_type === 'Link' || resourceData.resource_type === 'Video' ? (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <LinkIcon size={14} /> URL Address
                                        </div>
                                    </label>
                                    <input
                                        type="url"
                                        className="input"
                                        value={resourceData.url}
                                        onChange={e => setResourceData({ ...resourceData, url: e.target.value })}
                                        placeholder="https://example.com/..."
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            ) : null}

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Resource File</label>
                                <div style={{
                                    border: '2px dashed var(--border)',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    textAlign: 'center',
                                    background: 'rgba(16, 185, 129, 0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                }}>
                                    <input
                                        type="file"
                                        onChange={e => setResourceData({ ...resourceData, file: e.target.files?.[0] || null })}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0,
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <Upload size={24} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                        {resourceData.file ? (resourceData.file as File).name : 'Click or drag to upload file'}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max size 50MB</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowResourceModal(false)}
                                    style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', justifyContent: 'center' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, background: '#10b981', border: 'none', color: 'white', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Uploading...' : 'Upload Resource'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </DashboardLayout >
    );
};

export default TrainerDashboard;
