import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { BookOpen, Eye, Edit2, Trash2, X, GraduationCap, Clock, Search } from 'lucide-react';

interface Course {
    id: number;
    name: string;
    code: string;
    duration: string;
    school: number;
    school_name: string;
}

interface School {
    id: number;
    name: string;
    description?: string;
}

const CourseManagement: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [schools, setSchools] = useState<School[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal states
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    // Edit form state
    const [editForm, setEditForm] = useState({ name: '', code: '', duration: '', school: '' });

    useEffect(() => {
        fetchData();
    }, []);

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

    const handleView = (course: Course) => {
        setSelectedCourse(course);
        setViewModalOpen(true);
    };

    const handleEdit = (course: Course) => {
        setSelectedCourse(course);
        setEditForm({
            name: course.name,
            code: course.code,
            duration: course.duration,
            school: course.school.toString()
        });
        setEditModalOpen(true);
    };

    const handleDelete = (course: Course) => {
        setSelectedCourse(course);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedCourse) return;
        setLoading(true);
        try {
            await api.delete(`courses/${selectedCourse.id}/`);
            alert('Course deleted successfully');
            setDeleteModalOpen(false);
            setSelectedCourse(null);
            fetchData();
        } catch (error) {
            console.error('Failed to delete course', error);
            alert('Failed to delete course. It may have associated data.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourse) return;
        setLoading(true);
        try {
            await api.patch(`courses/${selectedCourse.id}/`, editForm);
            alert('Course updated successfully');
            setEditModalOpen(false);
            setSelectedCourse(null);
            fetchData();
        } catch (error) {
            console.error('Failed to update course', error);
            alert('Failed to update course');
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Course Management</h1>
                <p style={{ color: 'var(--text-muted)' }}>View, edit, and manage all courses in the system.</p>
            </div>

            {/* Statistics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '12px' }}>
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Courses</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{courses.length}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: '12px' }}>
                        <GraduationCap size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Schools/Departments</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{schools.length}</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="input"
                        placeholder="Search by course name, code, or department..."
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Course Table */}
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                        <tr>
                            <th style={{ padding: '1rem 1.5rem' }}>Code</th>
                            <th style={{ padding: '1rem 1.5rem' }}>Course Name</th>
                            <th style={{ padding: '1rem 1.5rem' }}>Department</th>
                            <th style={{ padding: '1rem 1.5rem' }}>Duration</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No courses found
                                </td>
                            </tr>
                        ) : (
                            filteredCourses.map(course => (
                                <tr key={course.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{course.code}</td>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{course.name}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>{course.school_name}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>{course.duration}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                className="btn"
                                                onClick={() => handleView(course)}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.5rem 0.75rem',
                                                    background: '#dbeafe',
                                                    color: '#1e40af',
                                                    border: 'none'
                                                }}
                                                title="View details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                className="btn"
                                                onClick={() => handleEdit(course)}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.5rem 0.75rem',
                                                    background: '#fef3c7',
                                                    color: '#92400e',
                                                    border: 'none'
                                                }}
                                                title="Edit course"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="btn"
                                                onClick={() => handleDelete(course)}
                                                style={{
                                                    fontSize: '0.75rem',
                                                    padding: '0.5rem 0.75rem',
                                                    background: '#fee2e2',
                                                    color: '#991b1b',
                                                    border: 'none'
                                                }}
                                                title="Delete course"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* View Modal */}
            {viewModalOpen && selectedCourse && (
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
                            onClick={() => setViewModalOpen(false)}
                            style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                padding: '0.75rem',
                                background: '#dbeafe',
                                color: '#1e40af',
                                borderRadius: '12px',
                                marginBottom: '1rem'
                            }}>
                                <Eye size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Course Details</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Code</label>
                                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>{selectedCourse.code}</p>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Name</label>
                                <p style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '0.25rem' }}>{selectedCourse.name}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <GraduationCap size={14} /> Department
                                    </label>
                                    <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>{selectedCourse.school_name}</p>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={14} /> Duration
                                    </label>
                                    <p style={{ fontSize: '1rem', fontWeight: 600, marginTop: '0.25rem' }}>{selectedCourse.duration}</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => setViewModalOpen(false)}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModalOpen && selectedCourse && (
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
                            onClick={() => setEditModalOpen(false)}
                            style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                padding: '0.75rem',
                                background: '#fef3c7',
                                color: '#92400e',
                                borderRadius: '12px',
                                marginBottom: '1rem'
                            }}>
                                <Edit2 size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Edit Course</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Update course information</p>
                        </div>

                        <form onSubmit={handleUpdateCourse}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Course Code</label>
                                <input
                                    type="text"
                                    className="input"
                                    required
                                    value={editForm.code}
                                    onChange={e => setEditForm({ ...editForm, code: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Course Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    required
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Department / School</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="input"
                                        required
                                        value={editForm.school}
                                        onChange={e => setEditForm({ ...editForm, school: e.target.value })}
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
                                    required
                                    value={editForm.duration}
                                    onChange={e => setEditForm({ ...editForm, duration: e.target.value })}
                                    style={{ width: '100%' }}
                                    placeholder="e.g. 4 Terms or 3 Years"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setEditModalOpen(false)}
                                    style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', justifyContent: 'center' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && selectedCourse && (
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
                            onClick={() => setDeleteModalOpen(false)}
                            style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                padding: '0.75rem',
                                background: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '12px',
                                marginBottom: '1rem'
                            }}>
                                <Trash2 size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>Delete Course</h2>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>This action cannot be undone</p>
                        </div>

                        <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.875rem', color: '#92400e' }}>
                                <strong>Warning:</strong> Deleting this course will also remove all associated intakes, semesters, and related data.
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Are you sure you want to delete:</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                                {selectedCourse.code} - {selectedCourse.name}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <button
                                className="btn"
                                onClick={() => setDeleteModalOpen(false)}
                                style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', justifyContent: 'center' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn"
                                onClick={confirmDelete}
                                style={{ flex: 1, justifyContent: 'center', background: '#dc2626', color: 'white' }}
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete Course'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default CourseManagement;
