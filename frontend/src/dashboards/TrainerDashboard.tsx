import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookOpen, FileText, Upload, Plus, CheckCircle, Check, Database, FilePlus } from 'lucide-react';

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
    assessment_name: string;
    file: string;
    grade: number | null;
    feedback: string;
    submitted_at: string;
}

const TrainerDashboard: React.FC = () => {
    const { user } = useAuth();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
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

    const [gradeData, setGradeData] = useState({
        grade: '',
        feedback: ''
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

    const handleGradeSubmission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubmission) return;
        setLoading(true);
        try {
            await api.patch(`submissions/${selectedSubmission.id}/`, {
                grade: parseInt(gradeData.grade),
                feedback: gradeData.feedback
            });
            setShowGradeModal(false);
            setGradeData({ grade: '', feedback: '' });
            fetchData();
            alert('Grade submitted successfully!');
        } catch (error) {
            console.error('Failed to submit grade', error);
            alert('Failed to submit grade.');
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
                    <button className="btn" onClick={() => window.location.href = '/trainer/authoring'}>
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
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '0.35rem', background: 'transparent' }}
                                                        onClick={() => { setSelectedLesson(l); setShowResourceModal(true); }}
                                                    >
                                                        <Upload size={16} />
                                                    </button>
                                                    {!l.is_taught && (
                                                        <button
                                                            className="btn"
                                                            style={{ padding: '0.35rem', background: '#10b981', color: 'white', borderRadius: '6px' }}
                                                            onClick={() => handleMarkAsTaught(l.id)}
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                    )}
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
                                                <button className="btn btn-sm" style={{ background: 'var(--primary)', color: 'white' }} onClick={() => { setSelectedSubmission(s); setShowGradeModal(true); }}>Grade</button>
                                            </div>
                                        ))}
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
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                            Upload Resource to "{selectedLesson?.title}"
                        </h2>
                        <form onSubmit={handleUploadResource}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Resource Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    required
                                    placeholder="Enter resource title (e.g., Week 1 Slides)"
                                    value={resourceData.title}
                                    onChange={(e) => setResourceData({ ...resourceData, title: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Type</label>
                                <select
                                    className="input"
                                    required
                                    value={resourceData.resource_type}
                                    onChange={(e) => setResourceData({ ...resourceData, resource_type: e.target.value })}
                                >
                                    <option value="PDF">PDF Document</option>
                                    <option value="PPT">PowerPoint Presentation</option>
                                    <option value="Video">Video Link/File</option>
                                    <option value="Link">External Reference Link</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Description / References</label>
                                <textarea
                                    className="input"
                                    placeholder="Read more, video timestamps, or external references..."
                                    value={resourceData.description}
                                    onChange={(e) => setResourceData({ ...resourceData, description: e.target.value })}
                                    style={{ minHeight: '80px' }}
                                />
                            </div>

                            {resourceData.resource_type === 'Link' || resourceData.resource_type === 'Video' ? (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>URL</label>
                                    <input
                                        type="url"
                                        className="input"
                                        placeholder="https://example.com/video"
                                        value={resourceData.url}
                                        onChange={(e) => setResourceData({ ...resourceData, url: e.target.value })}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Or upload a file below</p>
                                </div>
                            ) : null}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>File</label>
                                <input
                                    type="file"
                                    className="input"
                                    onChange={(e) => setResourceData({ ...resourceData, file: e.target.files?.[0] || null })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" onClick={() => setShowResourceModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Uploading...' : 'Upload Resource'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Grade Modal */}
            {
                showGradeModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '450px' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Grade Submission</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                Student: {selectedSubmission?.student_name}
                            </p>
                            <form onSubmit={handleGradeSubmission}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Score (out of 100)</label>
                                    <input
                                        type="number"
                                        className="input"
                                        required
                                        min="0"
                                        max="100"
                                        value={gradeData.grade}
                                        onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Feedback</label>
                                    <textarea
                                        className="input"
                                        placeholder="Enter feedback for student..."
                                        value={gradeData.feedback}
                                        onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                                        style={{ minHeight: '120px', resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn" onClick={() => setShowGradeModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? 'Submitting...' : 'Submit Grade'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </DashboardLayout >
    );
};

export default TrainerDashboard;
