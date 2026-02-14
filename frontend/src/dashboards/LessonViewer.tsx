import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import {
    FileText, Download, PlayCircle, Link as LinkIcon,
    ArrowLeft, ArrowRight, ChevronLeft
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

    useEffect(() => {
        const fetchLesson = async () => {
            setLoading(true);
            try {
                const response = await api.get(`lessons/?unit=${unitId}&order=${lessonOrder}`);
                // Assuming the backend returns a list or we filter it.
                // For now, let's assume we get the lesson directly or find it.
                const found = response.data.find((l: any) => l.order === parseInt(lessonOrder || '1'));
                setLesson(found);
            } catch (error) {
                console.error('Failed to fetch lesson', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLesson();
    }, [unitId, lessonOrder]);

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
                                <a
                                    key={res.id}
                                    href={res.file || res.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '1rem',
                                        background: 'white',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        transition: 'all 0.2s ease'
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
                                        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{res.title}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.resource_type}</p>
                                    </div>
                                    <Download size={16} style={{ color: 'var(--text-muted)' }} />
                                </a>
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
        </DashboardLayout>
    );
};

export default LessonViewer;
