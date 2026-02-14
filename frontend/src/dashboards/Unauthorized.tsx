import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'var(--bg-main)',
            padding: '2rem'
        }}>
            <div className="card glass animate-fade-in" style={{
                maxWidth: '500px',
                textAlign: 'center',
                padding: '3rem'
            }}>
                <div style={{ color: 'var(--accent)', marginBottom: '1.5rem' }}>
                    <ShieldAlert size={64} style={{ margin: '0 auto' }} />
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Unauthorized Access</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                    You don't have permission to access this area. If you believe this is an error, please contact your department administrator.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                >
                    <ArrowLeft size={18} />
                    Go to My Dashboard
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;
