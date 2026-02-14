import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogIn, Lock, User as UserIcon } from 'lucide-react';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            switch (user.role) {
                case 'Admin': navigate('/admin'); break;
                case 'CourseMaster': navigate('/course-master'); break;
                case 'HOD': navigate('/hod'); break;
                case 'Trainer': navigate('/trainer'); break;
                case 'Student': navigate('/student'); break;
                default: navigate('/');
            }
        }
    }, [user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('token/', { username, password });
            login(response.data.access, response.data.refresh);

            // AuthContext will fetch user and trigger the useEffect above

        } catch (err: any) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            padding: '1rem'
        }}>
            <div className="card glass animate-fade-in" style={{
                width: '100%',
                maxWidth: '400px',
                padding: '2.5rem',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '1rem',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        color: 'white',
                        marginBottom: '1rem'
                    }}>
                        <LogIn size={32} />
                    </div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>MLS Login</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Welcome back to the portal</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.875rem',
                        marginBottom: '1.5rem',
                        border: '1px solid #fecaca'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Username</label>
                        <div style={{ position: 'relative' }}>
                            <UserIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="input"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="input"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }} disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <span style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Contact Admin</span>
                </p>
            </div>
        </div>
    );
};

export default Login;
