import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import {
    FileText, PlayCircle, Link as LinkIcon,
    ArrowLeft, ArrowRight, ChevronLeft, X, ExternalLink
} from 'lucide-react';

interface Resource {
    id: number;
    title: string;
    resource_type: 'PDF' | 'Video' | 'PPT' | 'Link';
    file: string;
    url: string;
}

interface Lesson {
    id: number;
    title: string;
    order: number;
    resources: Resource[];
}

const LessonViewer: React.FC = () => {
    const { unitId, lessonOrder } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [showViewer, setShowViewer] = useState(false);

    useEffect(() => {
        const fetchLesson = async () => {
            setLoading(true);
            try {
                const response = await api.get(`lessons/?unit=${unitId}&order=${lessonOrder}`);
                // Assuming the backend returns a list or we filter it.
                // For now, let's assume we get the lesson directly or find it.
                const found = response.data.find((l: any) => l.order === parseInt(lessonOrder || '1'));
                setLesson(found);

                // Auto-mark attendance
                if (found) {
                    api.post('attendance/mark_auto/', { lesson_id: found.id }).catch(err => {
                        console.error('Failed to auto-mark attendance:', err);
                    });
                }
            } catch (error) {
                console.error('Failed to fetch lesson', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [unitId, lessonOrder]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showViewer && (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
                e.preventDefault();
                alert('Downloading and printing are disabled for this resource.');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showViewer]);

    if (loading) return <DashboardLayout><div>Loading lesson...</div></DashboardLayout>;
    if (!lesson) return <DashboardLayout><div>Lesson not found.</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(`/student`)}
                    className="btn"
                    style={{ marginBottom: '1.5rem', padding: 0, color: 'var(--text-muted)' }}
                >
                    <ChevronLeft size={20} />
                    Back to Units
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>Lesson {lesson.order}</span>
                        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>{lesson.title}</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn glass" disabled={lesson.order === 1}>
                            <ArrowLeft size={18} />
                            Previous
                        </button>
                        <button className="btn btn-primary">
                            Next Lesson
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="card" style={{ minHeight: '500px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} className="text-primary" />
                        Lesson Content
                    </h2>
                    <div style={{ lineHeight: 1.8, color: 'var(--text-main)' }}>
                        <p>Welcome to this lesson on {lesson.title}.</p>
                        <p style={{ marginTop: '1rem' }}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                        </p>
                        {/* Real content would be rendered here, possibly as HTML/Markdown */}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card glass">
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem' }}>Resources</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {lesson.resources.map(res => (
                                <button
                                    key={res.id}
                                    onClick={() => {
                                        if (res.resource_type === 'Link') {
                                            window.open(res.url, '_blank');
                                        } else {
                                            setSelectedResource(res);
                                            setShowViewer(true);
                                        }
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '1rem',
                                        background: 'white',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        transition: 'all 0.2s ease',
                                        width: '100%',
                                        textAlign: 'left',
                                        cursor: 'pointer'
                                    }}
                                    className="resource-item"
                                >
                                    <div style={{
                                        color: res.resource_type === 'Video' ? '#ef4444' : 'var(--primary)',
                                        background: 'var(--bg-main)',
                                        padding: '0.5rem',
                                        borderRadius: '8px'
                                    }}>
                                        {res.resource_type === 'PDF' && <FileText size={20} />}
                                        {res.resource_type === 'Video' && <PlayCircle size={20} />}
                                        {res.resource_type === 'Link' && <LinkIcon size={20} />}
                                        {res.resource_type === 'PPT' && <FileText size={20} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{res.title}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.resource_type === 'Link' ? 'External Reference' : `View ${res.resource_type}`}</p>
                                    </div>
                                    {res.resource_type === 'Link' ? <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} /> : <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />}
                                </button>
                            ))}
                            {lesson.resources.length === 0 && (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textAlign: 'center' }}>No additional resources for this lesson.</p>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ background: 'var(--bg-sidebar)', color: 'white' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Upcoming Assessment</h3>
                        <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '1.5rem' }}>
                            CAT 1 is due in 3 days. Make sure to complete all previous lessons.
                        </p>
                        <button className="btn btn-primary" style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }}>
                            View Assessment
                        </button>
                    </div>
                </div>
            </div>

            {/* Resource Viewer Modal */}
            {showViewer && selectedResource && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 2000,
                    backdropFilter: 'blur(10px)'
                }} onContextMenu={e => e.preventDefault()}>
                    {/* Viewer Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem 2rem',
                        background: 'rgba(0,0,0,0.5)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        color: 'white'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{selectedResource.title}</h2>
                            <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>Secure View - Downloading Disabled</p>
                        </div>
                        <button
                            onClick={() => setShowViewer(false)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                color: 'white',
                                padding: '0.5rem',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Viewer Content */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {selectedResource.resource_type === 'PDF' && (
                            <iframe
                                src={`${selectedResource.file}#toolbar=0&navpanes=0&scrollbar=0`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    borderRadius: '12px',
                                    background: 'white'
                                }}
                                title={selectedResource.title}
                            />
                        )}

                        {selectedResource.resource_type === 'Video' && (
                            <video
                                controls
                                controlsList="nodownload"
                                onContextMenu={e => e.preventDefault()}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    borderRadius: '12px',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                                }}
                            >
                                <source src={selectedResource.file} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        )}

                        {(selectedResource.resource_type === 'PPT' || selectedResource.resource_type === 'PDF') && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                pointerEvents: 'none',
                                zIndex: 10,
                                background: 'transparent'
                            }} />
                        )}
                    </div>

                    {/* Footer Info */}
                    <div style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontSize: '0.75rem',
                        color: 'rgba(255,255,255,0.5)'
                    }}>
                        Prohibited from unauthorized distribution or downloading.
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default LessonViewer;
