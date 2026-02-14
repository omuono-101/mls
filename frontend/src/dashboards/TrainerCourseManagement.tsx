import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen, Plus, Edit2,
    ChevronRight, ChevronDown, FileText, Layers, X
} from 'lucide-react';

interface Unit {
    id: number;
    name: string;
    code: string;
}

interface Module {
    id: number;
    title: string;
    description: string;
    order: number;
    unit: number;
    lessons?: Lesson[];
}

interface Lesson {
    id: number;
    title: string;
    order: number;
    module: number;
    is_taught: boolean;
    is_approved: boolean;
}

const TrainerCourseManagement: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal & Form States
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [moduleForm, setModuleForm] = useState({ title: '', description: '', order: 1 });

    // Lesson State
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [lessonForm, setLessonForm] = useState({
        title: '',
        is_lab: false,
        order: 1
    });

    const [expandedModules, setExpandedModules] = useState<number[]>([]);

    useEffect(() => {
        fetchUnits();
    }, []);

    useEffect(() => {
        if (selectedUnit) {
            fetchModules(selectedUnit.id);
        }
    }, [selectedUnit]);

    const fetchUnits = async () => {
        try {
            const res = await api.get('units/');
            // Filter for units assigned to this trainer
            // In a real app, the API should probably do this filtering or return only assigned units
            const myUnits = res.data.filter((u: any) => u.trainer === user?.id);
            setUnits(myUnits);
        } catch (error) {
            console.error('Failed to fetch units', error);
        }
    };

    const fetchModules = async (unitId: number) => {
        setLoading(true);
        try {
            const res = await api.get(`modules/?unit=${unitId}`);
            setModules(res.data.sort((a: Module, b: Module) => a.order - b.order));

            // Fetch lessons for each module (or fetch all and map)
            // For now, let's assume we can fetch lessons separately or modules include them
            // If modules don't include lessons, we'd need another call.
            // Let's make a call to lessons?unit={unitId} to get all lessons for the unit
            const lessonsRes = await api.get(`lessons/?unit=${unitId}`);
            const allLessons = lessonsRes.data;

            setModules(prev => prev.map(m => ({
                ...m,
                lessons: allLessons.filter((l: Lesson) => l.module === m.id).sort((a: Lesson, b: Lesson) => a.order - b.order)
            })));

        } catch (error) {
            console.error('Failed to fetch modules', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUnit) return;

        try {
            await api.post('modules/', { ...moduleForm, unit: selectedUnit.id });
            setShowModuleModal(false);
            setModuleForm({ title: '', description: '', order: modules.length + 1 });
            fetchModules(selectedUnit.id);
        } catch (error) {
            console.error(error);
            alert('Failed to create module');
        }
    };

    const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModuleId || !selectedUnit) return;

        // Find module to get current lesson count for ordering if needed, 
        // but we supposedly set order in the form state already.

        setLoading(true);
        try {
            await api.post('lessons/', {
                ...lessonForm,
                module: selectedModuleId,
                unit: selectedUnit.id,
                trainer: user?.id
            });
            setShowLessonModal(false);
            setLessonForm({ title: '', is_lab: false, order: 1 });
            fetchModules(selectedUnit.id); // Refresh modules
            alert('Lesson created successfully!');
        } catch (error: any) {
            console.error('Failed to create lesson', error);
            const errorMessage = error?.response?.data?.detail || 'Failed to create lesson.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const toggleModule = (id: number) => {
        setExpandedModules(prev =>
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Course Authoring</h1>
                <p style={{ color: 'var(--text-muted)' }}>Create and organize content for your assigned units.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', height: 'calc(100vh - 200px)' }}>
                {/* Unit Selection Sidebar */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BookOpen size={18} /> My Units
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto' }}>
                        {units.map(unit => (
                            <button
                                key={unit.id}
                                onClick={() => setSelectedUnit(unit)}
                                className="btn"
                                style={{
                                    justifyContent: 'flex-start',
                                    textAlign: 'left',
                                    background: selectedUnit?.id === unit.id ? 'var(--primary)' : 'transparent',
                                    color: selectedUnit?.id === unit.id ? 'white' : 'var(--text-main)',
                                    border: selectedUnit?.id === unit.id ? 'none' : '1px solid var(--border)'
                                }}
                            >
                                <span style={{ fontWeight: 600, marginRight: '0.5rem' }}>{unit.code}</span>
                                <span style={{ opacity: 0.9, fontSize: '0.9rem' }}>{unit.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <p>Loading...</p>
                        </div>
                    ) : selectedUnit ? (
                        <>
                            <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedUnit.name}</h2>
                                    <p style={{ color: 'var(--text-muted)' }}>{selectedUnit.code} • {modules.length} Modules</p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        className="btn"
                                        onClick={() => setShowModuleModal(true)}
                                        style={{
                                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                            color: 'white',
                                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1)',
                                            padding: '0.6rem 1.25rem'
                                        }}
                                    >
                                        <Plus size={18} /> New Module
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {modules.length === 0 ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius: '12px' }}>
                                        <Layers size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                        <p>No modules found for this unit.</p>
                                        <p style={{ fontSize: '0.9rem' }}>Create a module to start adding lessons.</p>
                                    </div>
                                ) : (
                                    modules.map(module => (
                                        <div key={module.id} className="card" style={{ padding: '0' }}>
                                            <div
                                                style={{
                                                    padding: '1rem 1.5rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    borderBottom: expandedModules.includes(module.id) ? '1px solid var(--border)' : 'none'
                                                }}
                                                onClick={() => toggleModule(module.id)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px',
                                                        background: 'var(--bg-main)',
                                                        borderRadius: '8px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, color: 'var(--primary)'
                                                    }}>
                                                        {module.order}
                                                    </div>
                                                    <div>
                                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{module.title}</h3>
                                                        {module.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{module.description}</p>}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '1rem' }}>
                                                        {module.lessons?.length || 0} Lessons
                                                    </span>
                                                    {expandedModules.includes(module.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </div>
                                            </div>

                                            {expandedModules.includes(module.id) && (
                                                <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-subtle)' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {module.lessons && module.lessons.length > 0 ? (
                                                            module.lessons.map(lesson => (
                                                                <div key={lesson.id} className="glass" style={{
                                                                    padding: '0.75rem 1rem',
                                                                    borderRadius: '8px',
                                                                    display: 'flex',
                                                                    justifyContent: 'space-between',
                                                                    alignItems: 'center',
                                                                    background: 'white'
                                                                }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                        <FileText size={16} color="var(--text-muted)" />
                                                                        <span style={{ fontWeight: 500 }}>{lesson.title}</span>
                                                                        {!lesson.is_taught && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#f3f4f6', borderRadius: '4px' }}>Draft</span>}
                                                                    </div>
                                                                    <button
                                                                        className="btn btn-sm"
                                                                        style={{ padding: '0.25rem' }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            navigate(`/trainer/authoring/lesson/${lesson.id}`);
                                                                        }}
                                                                    >
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.9rem' }}>No lessons in this module.</p>
                                                        )}
                                                        <button
                                                            className="btn btn-sm"
                                                            style={{
                                                                alignSelf: 'flex-start',
                                                                marginTop: '0.5rem',
                                                                color: 'var(--primary)',
                                                                background: 'rgba(99, 102, 241, 0.1)'
                                                            }}
                                                            // Logic to add lesson to this specific module would go here
                                                            // We might need another modal or navigate to a lesson creator
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedModuleId(module.id);
                                                                setLessonForm({ ...lessonForm, order: (module.lessons?.length || 0) + 1 });
                                                                setShowLessonModal(true);
                                                            }}
                                                        >
                                                            <Plus size={14} /> Add Lesson
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                            <BookOpen size={64} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                            <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>No Unit Selected</p>
                            <p>Select a unit from the sidebar to manage its content.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Module Modal */}
            {showModuleModal && (
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
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="card animate-fade-in" style={{
                        width: '100%',
                        maxWidth: '450px',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <button
                            onClick={() => setShowModuleModal(false)}
                            style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                padding: '0.75rem',
                                background: 'var(--primary)',
                                color: 'white',
                                borderRadius: '12px',
                                marginBottom: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                            }}>
                                <Layers size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>New Module</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Organize your content into a new logical module.</p>
                        </div>

                        <form onSubmit={handleCreateModule}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Module Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Introduction to Networking"
                                    required
                                    value={moduleForm.title}
                                    onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Description</label>
                                <textarea
                                    className="input"
                                    placeholder="Brief description of what this module covers..."
                                    value={moduleForm.description}
                                    onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
                                    style={{ minHeight: '100px', resize: 'vertical', width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Order Sequence</label>
                                <input
                                    type="number"
                                    className="input"
                                    required
                                    min="1"
                                    value={moduleForm.order}
                                    onChange={e => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowModuleModal(false)}
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
                                    {loading ? 'Creating...' : 'Create Module'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Lesson Modal */}
            {showLessonModal && (
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
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="card animate-fade-in" style={{
                        width: '100%',
                        maxWidth: '450px',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <button
                            onClick={() => setShowLessonModal(false)}
                            style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                padding: '0.75rem',
                                background: 'var(--primary)',
                                color: 'white',
                                borderRadius: '12px',
                                marginBottom: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                            }}>
                                <FileText size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>New Lesson</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Add a new learning session to your module.</p>
                        </div>

                        <form onSubmit={handleCreateLesson}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Lesson Title</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Understanding TCP/IP"
                                    required
                                    value={lessonForm.title}
                                    onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Order</label>
                                <input
                                    type="number"
                                    className="input"
                                    required
                                    min="1"
                                    value={lessonForm.order}
                                    onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    id="is_lab"
                                    checked={lessonForm.is_lab}
                                    onChange={e => setLessonForm({ ...lessonForm, is_lab: e.target.checked })}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <label htmlFor="is_lab" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}>Is this a Lab Session?</label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowLessonModal(false)}
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
                                    {loading ? 'Creating...' : 'Create Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default TrainerCourseManagement;
