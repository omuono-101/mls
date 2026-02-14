import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width)',
                padding: '2rem',
                background: 'var(--bg-main)',
                minHeight: '100vh'
            }}>
                <div className="animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
