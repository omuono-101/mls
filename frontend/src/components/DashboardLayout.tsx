import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            {/* Mobile Header */}
            <header className="mobile-only" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 'var(--header-height)',
                background: 'var(--bg-sidebar)',
                color: 'white',
                padding: '0 1rem',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 1000,
                boxShadow: 'var(--shadow)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>MLS Portal</h2>
                </div>
                <button
                    onClick={() => setSidebarOpen(!isSidebarOpen)}
                    style={{ background: 'transparent', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="mobile-only"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 90
                    }}
                />
            )}

            <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

            <main style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width)',
                padding: '2rem',
                background: 'var(--bg-main)',
                minHeight: '100vh',
                transition: 'margin-left 0.3s ease',
                width: '100%',
                overflowX: 'hidden'
            }}>
                {/* Mobile Spacing Adjustment */}
                <div className="mobile-only" style={{ height: 'var(--header-height)' }} />

                <div className="animate-fade-in" style={{ maxWidth: '1600px', margin: '0 auto' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
