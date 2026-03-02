import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, School, Book, Users, Mail, Phone, Lock, User as UserIcon, ArrowRight, CheckCircle } from 'lucide-react';

const StudentRegistration: React.FC = () => {
    const navigate = useNavigate();
    const [schools, setSchools] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [courseGroups, setCourseGroups] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        school: '',
        course: '',
        course_group: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const response = await api.get('schools/');
                setSchools(response.data);
            } catch (err) {
                console.error('Failed to fetch schools', err);
            }
        };
        fetchSchools();
    }, []);

    useEffect(() => {
        if (formData.school) {
            const fetchCourses = async () => {
                try {
                    const response = await api.get(`courses/?school=${formData.school}`);
                    setCourses(response.data);
                    setFormData(prev => ({ ...prev, course: '', course_group: '' }));
                } catch (err) {
                    console.error('Failed to fetch courses', err);
                }
            };
            fetchCourses();
        } else {
            setCourses([]);
            setCourseGroups([]);
        }
    }, [formData.school]);

    useEffect(() => {
        if (formData.course) {
            const fetchGroups = async () => {
                try {
                    const response = await api.get(`course-groups/?course=${formData.course}`);
                    setCourseGroups(response.data);
                    setFormData(prev => ({ ...prev, course_group: '' }));
                } catch (err) {
                    console.error('Failed to fetch course groups', err);
                }
            };
            fetchGroups();
        } else {
            setCourseGroups([]);
        }
    }, [formData.course]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await api.post('users/register_student/', {
                username: formData.username,
                password: formData.password,
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone_number: formData.phone_number,
                course_group: formData.course_group
            });
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 5000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please check your details.');
            if (err.response?.data) {
                const errors = Object.values(err.response.data).flat();
                if (errors.length > 0) setError(errors[0] as string);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                padding: '1rem'
            }}>
                <div className="card glass animate-fade-in" style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '3rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '1.5rem',
                        background: '#10b981',
                        borderRadius: '50%',
                        color: 'white',
                        marginBottom: '1.5rem'
                    }}>
                        <CheckCircle size={48} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>Registration Successful!</h1>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1.125rem' }}>
                        Your account has been created. However, it is currently <strong>dormant</strong>.
                        Please contact the administration to activate your portal.
                    </p>
                    <div style={{ marginTop: '2.5rem' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Redirecting to login in 5 seconds...</p>
                        <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex', width: 'auto' }}>
                            Go to Login Now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            padding: '2rem 1rem'
        }}>
            <div className="card glass animate-fade-in" style={{
                width: '100%',
                maxWidth: '800px',
                padding: '3rem',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '1rem',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        color: 'white',
                        marginBottom: '1rem'
                    }}>
                        <UserPlus size={32} />
                    </div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Student Registration</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Create your account to access the modular learning system</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '1rem',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.875rem',
                        marginBottom: '2rem',
                        border: '1px solid #fecaca'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '2px solid var(--primary)', display: 'inline-block' }}>Personal Information</h3>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>First Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. John"
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Last Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. Smith"
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="email"
                                        className="input"
                                        style={{ paddingLeft: '2.5rem' }}
                                        placeholder="john.smith@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Phone Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="tel"
                                        className="input"
                                        style={{ paddingLeft: '2.5rem' }}
                                        placeholder="+254..."
                                        value={formData.phone_number}
                                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '2px solid var(--primary)', display: 'inline-block' }}>Academic Details</h3>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select School</label>
                                <div style={{ position: 'relative' }}>
                                    <School size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <select
                                        className="input"
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={formData.school}
                                        onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a School</option>
                                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', opacity: formData.school ? 1 : 0.5 }}>Select Course</label>
                                <div style={{ position: 'relative' }}>
                                    <Book size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <select
                                        className="input"
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={formData.course}
                                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                        disabled={!formData.school}
                                        required
                                    >
                                        <option value="">Select a Course</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', opacity: formData.course ? 1 : 0.5 }}>Course Group (Intake)</label>
                                <div style={{ position: 'relative' }}>
                                    <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <select
                                        className="input"
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={formData.course_group}
                                        onChange={(e) => setFormData({ ...formData, course_group: e.target.value })}
                                        disabled={!formData.course}
                                        required
                                    >
                                        <option value="">Select a Group</option>
                                        {courseGroups.map(g => <option key={g.id} value={g.id}>{g.group_display_code} - Semester {g.semester_name || '1'}</option>)}
                                    </select>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '2rem 0 1.5rem', borderBottom: '2px solid var(--primary)', display: 'inline-block' }}>Account Credentials</h3>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Username</label>
                                <div style={{ position: 'relative' }}>
                                    <UserIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="text"
                                        className="input"
                                        style={{ paddingLeft: '2.5rem' }}
                                        placeholder="e.g. jsmith2026"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="password"
                                        className="input"
                                        style={{ paddingLeft: '2.5rem' }}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', maxWidth: '400px', padding: '1rem' }} disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Register as Student'}
                            {!isLoading && <ArrowRight size={20} />}
                        </button>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>Sign In</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentRegistration;
