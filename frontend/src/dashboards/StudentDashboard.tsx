import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { BookOpen, CheckCircle2, Clock, PlayCircle } from 'lucide-react';

interface Unit {
    id: number;
    name: string;
    code: string;
    course_group_name: string;
}

const StudentDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [units, setUnits] = useState<Unit[]>([]);

    const fetchUnits = async () => {
        try {
            const response = await api.get('units/'); // In real app, filtered by student enrollment
            setUnits(response.data);
        } catch (error) {
            console.error('Failed to fetch units', error);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, []);

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em' }}>My Learning Portal</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Welcome back! Track your progress and access your lessons.</p>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
                borderRadius: 'var(--radius)',
                padding: '2rem',
                color: 'white',
                marginBottom: '2.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.2)'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Overall Progress</h2>
                    <p style={{ opacity: 0.9, fontSize: '0.875rem' }}>You've completed 45% of your current semester tasks.</p>
                    <div style={{
                        marginTop: '1.5rem',
                        width: '300px',
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '4px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: '45%',
                            background: 'white',
                            borderRadius: '4px'
                        }} />
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h3 style={{ fontSize: '2.5rem', fontWeight: 800 }}>45%</h3>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completion</p>
                </div>
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} className="text-primary" />
                Enrolled Units
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem'
            }}>
                {units.map((u: Unit) => (
                    <div key={u.id} className="card animate-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                            <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: 'var(--primary)',
                                background: '#eef2ff',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                marginBottom: '1rem',
                                display: 'inline-block'
                            }}>
                                {u.code}
                            </span>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>{u.name}</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{u.course_group_name}</p>
                        </div>

                        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={14} /> 12 Lessons
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <CheckCircle2 size={14} /> 4 CATs
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(`/student/unit/${u.id}/lesson/1`)}
                                className="btn btn-primary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            >
                                <PlayCircle size={16} />
                                Continue
                            </button>
                        </div>
                    </div>
                ))}
                {units.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                        <p>No units enrolled for this semester.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;
