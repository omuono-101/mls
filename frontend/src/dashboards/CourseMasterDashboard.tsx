import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { BookOpen, Calendar, Plus, Search, X, GraduationCap } from 'lucide-react';

interface Course {
    id: number;
    name: string;
    duration: string;
    school_name: string;
}

interface School { id: number; name: string; description?: string; }

const CourseMasterOverview: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Modals
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
    const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
    const [isEditSchoolModalOpen, setIsEditSchoolModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'courses' | 'schools'>('courses');

    // Form States
    const [courseForm, setCourseForm] = useState({ name: '', code: '', duration: '', school: '' });
    const [schoolForm, setSchoolForm] = useState({ name: '', description: '' });
    const [editCourseForm, setEditCourseForm] = useState({ id: 0, name: '', code: '', duration: '', school: '' });
    const [editSchoolForm, setEditSchoolForm] = useState({ id: 0, name: '', description: '' });

    const fetchData = async () => {
        try {
            const [cRes, sRes] = await Promise.all([
                api.get('courses/'),
                api.get('schools/')
            ]);
            setCourses(cRes.data);
            setSchools(sRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('courses/', courseForm);
            alert('Course created successfully');
            setIsCourseModalOpen(false);
            setCourseForm({ name: '', code: '', duration: '', school: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to create course', error);
            alert('Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('schools/', schoolForm);
            alert('School created successfully');
            setIsSchoolModalOpen(false);
            setSchoolForm({ name: '', description: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to create school', error);
            alert('Failed to create school');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCourse = (course: any) => {
        setEditCourseForm({
            id: course.id,
            name: course.name,
            code: course.code,
            duration: course.duration,
            school: course.school?.toString() || ''
        });
        setIsEditCourseModalOpen(true);
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch(`courses/${editCourseForm.id}/`, editCourseForm);
            alert('Course updated successfully');
            setIsEditCourseModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to update course', error);
            alert('Failed to update course');
        } finally {
            setLoading(false);
        }
    };

    const handleEditSchool = (school: School) => {
        setEditSchoolForm({
            id: school.id,
            name: school.name,
            description: school.description || ''
        });
        setIsEditSchoolModalOpen(true);
    };

    const handleUpdateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch(`schools/${editSchoolForm.id}/`, editSchoolForm);
            alert('School updated successfully');
            setIsEditSchoolModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to update school', error);
            alert('Failed to update school');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Course Management</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Register new courses and manage academic sessions.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-success" style={{ background: 'var(--bg-main)' }} onClick={() => setIsSchoolModalOpen(true)}>
                        <Plus size={20} />
                        New School
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsCourseModalOpen(true)}>
                        <Plus size={20} />
                        New Course
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
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Active Courses</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{courses.length}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: '12px' }}>
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Departments/Schools</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{schools.length}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#15803d', borderRadius: '12px' }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Intakes</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dynamic</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('courses')}
                        style={{ background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: activeTab === 'courses' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'courses' ? '2px solid var(--primary)' : '2px solid transparent' }}>
                        Course Catalog
                    </button>
                    <button
                        onClick={() => setActiveTab('schools')}
                        style={{ background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: activeTab === 'schools' ? 'var(--primary)' : 'var(--text-muted)', borderBottom: activeTab === 'schools' ? '2px solid var(--primary)' : '2px solid transparent' }}>
                        Schools & Departments
                    </button>
                </div>

                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="input"
                            placeholder={activeTab === 'courses' ? "Search courses using course name...." : "Search schools and departments..."}
                            style={{ paddingLeft: '2.5rem', width: '100%' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {activeTab === 'courses' ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem' }}>Code</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Course Name</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Department</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Duration</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourses.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{(c as any).code}</td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{c.name}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>{c.school_name}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>{c.duration}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <button
                                                className="btn"
                                                style={{ fontSize: '0.75rem', background: 'var(--bg-main)' }}
                                                onClick={() => handleEditCourse(c)}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem' }}>School Name</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Description</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schools.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{s.name}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>{s.description || 'No description'}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <button
                                                className="btn"
                                                style={{ fontSize: '0.75rem', background: 'var(--bg-main)' }}
                                                onClick={() => handleEditSchool(s)}
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* New School Modal */}
            {isSchoolModalOpen && (
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
                            onClick={() => setIsSchoolModalOpen(false)}
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
                                <BookOpen size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>New School</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Add a new department or school.</p>
                        </div>

                        <form onSubmit={handleCreateSchool}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>School Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. School of Computing"
                                    required
                                    value={schoolForm.name}
                                    onChange={e => setSchoolForm({ ...schoolForm, name: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Description</label>
                                <textarea
                                    className="input"
                                    placeholder="Short description about this department or school....."
                                    value={schoolForm.description}
                                    onChange={e => setSchoolForm({ ...schoolForm, description: e.target.value })}
                                    style={{ minHeight: '100px', resize: 'vertical', width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsSchoolModalOpen(false)}
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
                                    Create School
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* New Course Modal */}
            {isCourseModalOpen && (
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
                        maxWidth: '500px',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <button
                            onClick={() => setIsCourseModalOpen(false)}
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
                                <BookOpen size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Register New Course</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Add a new academic program to the system.</p>
                        </div>

                        <form onSubmit={handleCreateCourse}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Course Code</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. ICT"
                                    required
                                    value={courseForm.code}
                                    onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Course Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Bachelor of Science in IT"
                                    required
                                    value={courseForm.name}
                                    onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Department / School</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="input"
                                        required
                                        value={courseForm.school}
                                        onChange={e => setCourseForm({ ...courseForm, school: e.target.value })}
                                        style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="">Select a School</option>
                                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Duration</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. 4Terms or 4years"
                                    required
                                    value={courseForm.duration}
                                    onChange={e => setCourseForm({ ...courseForm, duration: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsCourseModalOpen(false)}
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
                                    {loading ? 'Registering...' : 'Register Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Course Modal */}
            {isEditCourseModalOpen && (
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
                        maxWidth: '500px',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                        <button
                            onClick={() => setIsEditCourseModalOpen(false)}
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
                                <BookOpen size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Edit Course</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Update course information.</p>
                        </div>

                        <form onSubmit={handleUpdateCourse}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Course Code</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. ICT"
                                    required
                                    value={editCourseForm.code}
                                    onChange={e => setEditCourseForm({ ...editCourseForm, code: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Course Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Bachelor of Science in IT"
                                    required
                                    value={editCourseForm.name}
                                    onChange={e => setEditCourseForm({ ...editCourseForm, name: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Department / School</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="input"
                                        required
                                        value={editCourseForm.school}
                                        onChange={e => setEditCourseForm({ ...editCourseForm, school: e.target.value })}
                                        style={{ width: '100%', appearance: 'none', cursor: 'pointer' }}
                                    >
                                        <option value="">Select a School</option>
                                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Duration</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. 4Terms or 4years"
                                    required
                                    value={editCourseForm.duration}
                                    onChange={e => setEditCourseForm({ ...editCourseForm, duration: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsEditCourseModalOpen(false)}
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
                                    {loading ? 'Updating...' : 'Update Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit School Modal */}
            {isEditSchoolModalOpen && (
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
                            onClick={() => setIsEditSchoolModalOpen(false)}
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
                                <GraduationCap size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Edit School</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Update school/department information.</p>
                        </div>

                        <form onSubmit={handleUpdateSchool}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>School Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. School of Computing"
                                    required
                                    value={editSchoolForm.name}
                                    onChange={e => setEditSchoolForm({ ...editSchoolForm, name: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Description</label>
                                <textarea
                                    className="input"
                                    placeholder="Short description about this department or school....."
                                    value={editSchoolForm.description}
                                    onChange={e => setEditSchoolForm({ ...editSchoolForm, description: e.target.value })}
                                    style={{ minHeight: '100px', resize: 'vertical', width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setIsEditSchoolModalOpen(false)}
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
                                    {loading ? 'Updating...' : 'Update School'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default CourseMasterOverview;
