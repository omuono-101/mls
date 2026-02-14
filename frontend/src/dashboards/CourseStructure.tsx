import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { BookOpen, Calendar, Plus, ChevronRight, Layers, Clock, X } from 'lucide-react';

interface Course { id: number; name: string; }
interface Intake { id: number; name: string; course: number; start_date: string; end_date: string; }
interface Semester { id: number; name: string; intake: number; start_date: string; end_date: string; }

const CourseStructure: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [intakes, setIntakes] = useState<Intake[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);

    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [selectedIntake, setSelectedIntake] = useState<Intake | null>(null);

    const [loading, setLoading] = useState(false);

    // Form States
    const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
    const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
    const [intakeForm, setIntakeForm] = useState({ name: '', group_code: '', admission_numbers: 0, start_date: '', end_date: '', intake_type: 'Full-time' });
    const [semesterForm, setSemesterForm] = useState({ name: '', start_date: '', end_date: '' });

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            fetchIntakes(selectedCourse.id);
            setSelectedIntake(null);
            setSemesters([]);
        }
    }, [selectedCourse]);

    useEffect(() => {
        if (selectedIntake) {
            fetchSemesters(selectedIntake.id);
        }
    }, [selectedIntake]);

    const fetchCourses = async () => {
        try {
            const res = await api.get('courses/');
            setCourses(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchIntakes = async (courseId: number) => {
        try {
            const res = await api.get('intakes/');
            // Filter client-side for now as API might return all
            const courseIntakes = res.data.filter((i: any) => i.course === courseId);
            setIntakes(courseIntakes);
        } catch (error) { console.error(error); }
    };

    const fetchSemesters = async (intakeId: number) => {
        try {
            const res = await api.get('semesters/');
            // Filter client-side
            const intakeSemesters = res.data.filter((s: any) => s.intake === intakeId);
            setSemesters(intakeSemesters);
        } catch (error) { console.error(error); }
    };

    const handleCreateIntake = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;
        setLoading(true);
        try {
            await api.post('intakes/', { ...intakeForm, course: selectedCourse.id });
            setIsIntakeModalOpen(false);
            setIntakeForm({ name: '', group_code: '', admission_numbers: 0, start_date: '', end_date: '', intake_type: 'Full-time' });
            fetchIntakes(selectedCourse.id);
        } catch (error) { console.error(error); alert('Failed to create intake'); }
        finally { setLoading(false); }
    };

    const handleCreateSemester = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedIntake) return;
        setLoading(true);
        try {
            await api.post('semesters/', { ...semesterForm, intake: selectedIntake.id });
            setIsSemesterModalOpen(false);
            setSemesterForm({ name: '', start_date: '', end_date: '' });
            fetchSemesters(selectedIntake.id);
        } catch (error) { console.error(error); alert('Failed to create semester'); }
        finally { setLoading(false); }
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Course Structure</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage Intakes and Semesters for your courses.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '2rem', height: 'calc(100vh - 200px)' }}>
                {/* Course Selection Panel */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={18} /> Select Course
                        </h2>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {courses.map(course => (
                            <button
                                key={course.id}
                                onClick={() => setSelectedCourse(course)}
                                className="btn"
                                style={{
                                    justifyContent: 'space-between',
                                    background: selectedCourse?.id === course.id ? 'var(--primary)' : 'var(--bg-main)',
                                    color: selectedCourse?.id === course.id ? 'white' : 'var(--text-main)',
                                    border: 'none',
                                    textAlign: 'left',
                                    padding: '1rem'
                                }}
                            >
                                <span style={{ fontWeight: 500 }}>{course.name}</span>
                                {selectedCourse?.id === course.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Structure Details Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {selectedCourse ? (
                        <>
                            {/* Intakes Section */}
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={20} /> Intakes
                                        </h2>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Academic sessions for {selectedCourse.name}</p>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setIsIntakeModalOpen(true)}
                                        style={{
                                            padding: '0.625rem 1.25rem',
                                            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)',
                                            borderRadius: '10px'
                                        }}
                                    >
                                        <Plus size={16} /> New Intake
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                    {intakes.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>No intakes found. Create one to get started.</p>
                                    ) : (
                                        intakes.map(intake => (
                                            <div
                                                key={intake.id}
                                                onClick={() => setSelectedIntake(intake)}
                                                style={{
                                                    minWidth: '200px',
                                                    padding: '1rem',
                                                    borderRadius: '12px',
                                                    background: selectedIntake?.id === intake.id ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-main)',
                                                    border: `1px solid ${selectedIntake?.id === intake.id ? 'var(--primary)' : 'var(--border)'}`,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    boxShadow: selectedIntake?.id === intake.id ? '0 10px 15px -3px rgba(99, 102, 241, 0.1)' : 'none'
                                                }}
                                            >
                                                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: selectedIntake?.id === intake.id ? 'var(--primary)' : 'var(--text-main)' }}>{intake.name}</h3>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    {new Date(intake.start_date).toLocaleDateString()} - {new Date(intake.end_date).toLocaleDateString()}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                                    Group Code: <span style={{ fontWeight: 600 }}>{(intake as any).group_code}</span> |
                                                    Limit: <span style={{ fontWeight: 600 }}>{(intake as any).admission_numbers}</span> students
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Semesters Section */}
                            {selectedIntake && (
                                <div className="card animate-fade-in" style={{ border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                                        <div>
                                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Layers size={20} /> Semesters
                                            </h2>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Semesters for {selectedIntake.name}</p>
                                        </div>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => setIsSemesterModalOpen(true)}
                                            style={{
                                                padding: '0.625rem 1.25rem',
                                                boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)',
                                                borderRadius: '10px'
                                            }}
                                        >
                                            <Plus size={16} /> New Semester
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                        {semesters.length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: '1 / -1' }}>No semesters defined yet.</p>
                                        ) : (
                                            semesters.map(semester => (
                                                <div key={semester.id} style={{
                                                    padding: '1.25rem',
                                                    background: 'var(--bg-main)',
                                                    borderRadius: '12px',
                                                    border: '1px solid var(--border)',
                                                    transition: 'transform 0.2s',
                                                    cursor: 'default'
                                                }}>
                                                    <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{semester.name}</h3>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <Clock size={12} />
                                                        {new Date(semester.start_date).toLocaleDateString()} - {new Date(semester.end_date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem' }}>
                            <BookOpen size={48} style={{ opacity: 0.2 }} />
                            <p>Select a course to manage its structure.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {(isIntakeModalOpen || isSemesterModalOpen) && (
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
                            onClick={() => { setIsIntakeModalOpen(false); setIsSemesterModalOpen(false); }}
                            style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                padding: '0.75rem',
                                background: isIntakeModalOpen ? 'var(--primary)' : 'var(--success)',
                                color: 'white',
                                borderRadius: '12px',
                                marginBottom: '1rem',
                                boxShadow: isIntakeModalOpen ? '0 4px 6px -1px rgba(99, 102, 241, 0.4)' : '0 4px 6px -1px rgba(34, 197, 94, 0.4)'
                            }}>
                                {isIntakeModalOpen ? <Calendar size={24} /> : <Layers size={24} />}
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {isIntakeModalOpen ? 'Create New Intake' : 'Add New Semester'}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                {isIntakeModalOpen
                                    ? `Set up a new academic session for ${selectedCourse?.name}`
                                    : `Define a new term for ${selectedIntake?.name}`}
                            </p>
                        </div>

                        <form onSubmit={isIntakeModalOpen ? handleCreateIntake : handleCreateSemester}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Name</label>
                                <input
                                    className="input"
                                    required
                                    placeholder={isIntakeModalOpen ? "e.g. Feb 2026 Group" : "e.g. Year 1 Semester 1"}
                                    value={isIntakeModalOpen ? intakeForm.name : semesterForm.name}
                                    onChange={e => isIntakeModalOpen ? setIntakeForm({ ...intakeForm, name: e.target.value }) : setSemesterForm({ ...semesterForm, name: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            {isIntakeModalOpen && (
                                <>
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Group Code (e.g. 0226)</label>
                                        <input
                                            className="input"
                                            required
                                            placeholder="e.g. 0226"
                                            value={intakeForm.group_code}
                                            onChange={e => setIntakeForm({ ...intakeForm, group_code: e.target.value })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Admission Numbers</label>
                                        <input
                                            type="number"
                                            className="input"
                                            required
                                            value={intakeForm.admission_numbers}
                                            onChange={e => setIntakeForm({ ...intakeForm, admission_numbers: parseInt(e.target.value) })}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </>
                            )}

                            {isIntakeModalOpen && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Intake Type</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            className="input"
                                            required
                                            value={intakeForm.intake_type}
                                            onChange={e => setIntakeForm({ ...intakeForm, intake_type: e.target.value })}
                                            style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="online">Online</option>
                                        </select>
                                        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Start Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        required
                                        value={isIntakeModalOpen ? intakeForm.start_date : semesterForm.start_date}
                                        onChange={e => isIntakeModalOpen ? setIntakeForm({ ...intakeForm, start_date: e.target.value }) : setSemesterForm({ ...semesterForm, start_date: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>End Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        required
                                        value={isIntakeModalOpen ? intakeForm.end_date : semesterForm.end_date}
                                        onChange={e => isIntakeModalOpen ? setIntakeForm({ ...intakeForm, end_date: e.target.value }) : setSemesterForm({ ...semesterForm, end_date: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => { setIsIntakeModalOpen(false); setIsSemesterModalOpen(false); }}
                                    style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', justifyContent: 'center' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        boxShadow: isIntakeModalOpen ? '0 4px 6px -1px rgba(99, 102, 241, 0.4)' : '0 4px 6px -1px rgba(34, 197, 94, 0.4)'
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default CourseStructure;
