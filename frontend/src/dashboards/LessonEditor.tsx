import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { Save, Upload, Trash2, FileText, ChevronLeft, X, Link as LinkIcon, FilePlus } from 'lucide-react';

interface Lesson {
    id: number;
    title: string;
    content: string;
    unit: number;
    module: number | null;
    is_lab: boolean;
    order: number;
    resources: Resource[];
}

interface Resource {
    id: number;
    title: string;
    resource_type: string;
    file: string | null;
    url: string | null;
}

const LessonEditor: React.FC = () => {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Resource State
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [resourceForm, setResourceForm] = useState({
        title: '',
        resource_type: 'PDF',
        file: null as File | null,
        url: '',
        description: ''
    });

    useEffect(() => {
        if (lessonId) {
            fetchLesson(lessonId);
        }
    }, [lessonId]);

    const fetchLesson = async (id: string) => {
        setLoading(true);
        try {
            const res = await api.get(`lessons/${id}/`);
            setLesson(res.data);
            setContent(res.data.content || '');
            setTitle(res.data.title);
        } catch (error) {
            console.error('Failed to fetch lesson', error);
            alert('Failed to load lesson data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!lesson) return;
        setSaving(true);
        try {
            await api.patch(`lessons/${lesson.id}/`, {
                title,
                content
            });
            alert('Lesson saved successfully!');
            // Update local state to reflect saved data if needed
            setLesson(prev => prev ? { ...prev, title, content } : null);
        } catch (error) {
            console.error('Failed to save lesson', error);
            alert('Failed to save lesson.');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!lesson) return;
        setLoading(true);

        const uploadData = new FormData();
        uploadData.append('lesson', lesson.id.toString());
        uploadData.append('title', resourceForm.title);
        uploadData.append('resource_type', resourceForm.resource_type);
        if (resourceForm.file) uploadData.append('file', resourceForm.file);
        if (resourceForm.url) uploadData.append('url', resourceForm.url);
        uploadData.append('description', resourceForm.description);

        try {
            await api.post('resources/', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setShowResourceModal(false);
            setResourceForm({ title: '', resource_type: 'PDF', file: null, url: '', description: '' });
            alert('Resource uploaded successfully!');
            fetchLesson(lesson.id.toString()); // Refresh to show new resource
        } catch (error) {
            console.error('Failed to upload resource', error);
            alert('Failed to upload resource.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteResource = async (resourceId: number) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            await api.delete(`resources/${resourceId}/`);
            if (lesson) fetchLesson(lesson.id.toString());
        } catch (error) {
            console.error('Failed to delete resource', error);
            alert('Failed to delete resource.');
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            ['link', 'image', 'video'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image', 'video'
    ];

    if (loading && !lesson) {
        return (
            <DashboardLayout>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <p>Loading editor...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/trainer/authoring')} className="btn" style={{ padding: '0.5rem' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Lesson Editor</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Editing: {lesson?.title}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={() => navigate('/trainer/authoring')}>
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Main Editor Area */}
                <div className="card">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Lesson Title</label>
                        <input
                            type="text"
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{ fontSize: '1.1rem', fontWeight: 600 }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Lecture Notes / Content</label>
                        <div style={{ height: '400px', marginBottom: '3rem' }}>
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                                modules={modules}
                                formats={formats}
                                style={{ height: '350px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar: Resources & Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Resources Card */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Resources</h3>
                            <button className="btn btn-sm" onClick={() => setShowResourceModal(true)}>
                                <Upload size={14} /> Add
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {lesson?.resources && lesson.resources.length > 0 ? (
                                lesson.resources.map(res => (
                                    <div key={res.id} className="glass" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                                            <FileText size={16} color="var(--primary)" />
                                            <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.title}</span>
                                        </div>
                                        <button
                                            className="btn btn-sm"
                                            style={{ padding: '0.25rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}
                                            onClick={() => handleDeleteResource(res.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No resources attached.</p>
                            )}
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Settings</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.875rem' }}>Lab Session</span>
                            <input
                                type="checkbox"
                                checked={lesson?.is_lab || false}
                                readOnly
                            // In a real app, update this via API too
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem' }}>Order Sequence</span>
                            <span style={{ fontWeight: 600 }}>{lesson?.order}</span>
                        </div>
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Assigned to Module: {lesson?.module}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

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
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: 'white',
                                borderRadius: '12px',
                                marginBottom: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)'
                            }}>
                                <FilePlus size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Add Resource</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Attach supporting materials to this lesson.</p>
                        </div>

                        <form onSubmit={handleUploadResource}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Resource Title</label>
                                    <input
                                        className="input"
                                        required
                                        value={resourceForm.title}
                                        onChange={e => setResourceForm({ ...resourceForm, title: e.target.value })}
                                        placeholder="e.g. Course Handout"
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Type</label>
                                    <select
                                        className="input"
                                        value={resourceForm.resource_type}
                                        onChange={e => setResourceForm({ ...resourceForm, resource_type: e.target.value })}
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
                                    value={resourceForm.description}
                                    onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })}
                                    placeholder="Provide context for this resource..."
                                    style={{ minHeight: '80px', resize: 'vertical', width: '100%' }}
                                />
                            </div>

                            {resourceForm.resource_type === 'Link' || resourceForm.resource_type === 'Video' ? (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <LinkIcon size={14} /> URL Address
                                        </div>
                                    </label>
                                    <input
                                        type="url"
                                        className="input"
                                        value={resourceForm.url}
                                        onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })}
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
                                    background: 'rgba(99, 102, 241, 0.05)',
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
                                    <Upload size={24} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                                        {resourceForm.file ? (resourceForm.file as File).name : 'Click or drag to upload file'}
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
                                    style={{ flex: 1, justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Uploading...' : 'Upload Resource'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default LessonEditor;
