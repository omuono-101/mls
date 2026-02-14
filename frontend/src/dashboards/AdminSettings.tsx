import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { Save, School as SchoolIcon } from 'lucide-react';

interface SchoolData {
    id: number;
    name: string;
    description: string;
}

const AdminSettings: React.FC = () => {
    const [school, setSchool] = useState<SchoolData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSchoolData();
    }, []);

    const fetchSchoolData = async () => {
        try {
            const response = await api.get('schools/');
            if (response.data.length > 0) {
                setSchool(response.data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch school settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!school) return;

        setSaving(true);
        setMessage('');

        try {
            await api.patch(`schools/${school.id}/`, {
                name: school.name,
                description: school.description
            });
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error('Failed to save settings', error);
            setMessage('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <DashboardLayout><div>Loading settings...</div></DashboardLayout>;

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>System Settings</h1>
                <p style={{ color: 'var(--text-muted)' }}>Configure general system parameters.</p>
            </div>

            <div className="card" style={{ maxWidth: '800px' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.5rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '8px' }}>
                        <SchoolIcon size={20} />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>School Information</h2>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {message && (
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius)',
                            marginBottom: '1.5rem',
                            background: message.includes('success') ? '#dcfce7' : '#fee2e2',
                            color: message.includes('success') ? '#15803d' : '#b91c1c'
                        }}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSave}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>School Name</label>
                            <input
                                type="text"
                                className="input"
                                value={school?.name || ''}
                                onChange={(e) => setSchool(prev => prev ? { ...prev, name: e.target.value } : null)}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Description</label>
                            <textarea
                                className="input"
                                style={{ minHeight: '100px', resize: 'vertical' }}
                                value={school?.description || ''}
                                onChange={(e) => setSchool(prev => prev ? { ...prev, description: e.target.value } : null)}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminSettings;
