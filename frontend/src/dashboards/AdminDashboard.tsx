import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { Users, UserCheck, UserX, ShieldCheck, X, Plus, Archive, ArchiveRestore } from 'lucide-react';

interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    is_activated: boolean;
    is_archived: boolean;
}

const AdminOverview: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        students: 0,
        staff: 0,
        active: 0,
        deactivated: 0,
        archived: 0
    });
    const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');
    const [showArchived, setShowArchived] = useState(false);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'Student' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = async () => {
        try {
            const response = await api.get('users/');
            setUsers(response.data);
            const students = response.data.filter((u: any) => u.role === 'Student');
            const staff = response.data.filter((u: any) => u.role !== 'Student');
            const active = response.data.filter((u: any) => u.is_activated && !u.is_archived);
            const deactivated = response.data.filter((u: any) => !u.is_activated && !u.is_archived);
            const archived = response.data.filter((u: any) => u.is_archived);
            setStats({
                total: response.data.length,
                students: students.length,
                staff: staff.length,
                active: active.length,
                deactivated: deactivated.length,
                archived: archived.length
            });
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const toggleActivation = async (userId: number, currentStatus: boolean) => {
        try {
            const action = currentStatus ? 'deactivate' : 'activate';
            await api.patch(`users/${userId}/${action}/`);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update user', error);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('users/', { ...newUser, is_activated: true });
            setIsAddUserOpen(false);
            setNewUser({ username: '', email: '', password: '', role: 'Student' });
            fetchUsers();
        } catch (error) {
            console.error('Failed to create user', error);
            alert('Failed to create user. Please check inputs.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleArchiveUser = async (userId: number, isCurrentlyArchived: boolean) => {
        const action = isCurrentlyArchived ? 'unarchive' : 'archive';
        const confirmMsg = isCurrentlyArchived
            ? 'Are you sure you want to unarchive this user?'
            : 'Are you sure you want to archive this user? They will be deactivated and hidden from normal view.';

        if (!window.confirm(confirmMsg)) return;

        try {
            await api.patch(`users/${userId}/${action}/`);
            fetchUsers();
        } catch (error) {
            console.error(`Failed to ${action} user`, error);
            alert(`Failed to ${action} user`);
        }
    };

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>System Overview</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage system-wide entities and user roles.</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '12px' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Users</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.total}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#15803d', borderRadius: '12px' }}>
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Students</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.students}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px' }}>
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Staff Members</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.staff}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: '12px' }}>
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Active Users</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.active}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: '12px' }}>
                        <UserX size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Deactivated</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.deactivated}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: '#f3f4f6', color: '#6b7280', borderRadius: '12px' }}>
                        <Archive size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Archived Users</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.archived}</p>
                    </div>
                </div>
            </div>



            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>User Management</h2>
                        <div style={{ display: 'flex', background: 'var(--bg-main)', padding: '0.25rem', borderRadius: '8px' }}>
                            <button
                                onClick={() => setActiveTab('students')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: activeTab === 'students' ? 'white' : 'transparent',
                                    color: activeTab === 'students' ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    boxShadow: activeTab === 'students' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Students
                            </button>
                            <button
                                onClick={() => setActiveTab('staff')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: activeTab === 'staff' ? 'white' : 'transparent',
                                    color: activeTab === 'staff' ? 'var(--primary)' : 'var(--text-muted)',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    boxShadow: activeTab === 'staff' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Staff
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showArchived}
                                onChange={(e) => setShowArchived(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                            />
                            Show Archived
                        </label>
                        <button
                            onClick={() => setIsAddUserOpen(true)}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={16} />
                            Add New User
                        </button>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                            <tr>
                                <th style={{ padding: '1rem 1.5rem' }}>User</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Role</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody style={{ fontSize: '0.875rem' }}>
                            {users
                                .filter(u => {
                                    const roleMatch = activeTab === 'students' ? u.role === 'Student' : u.role !== 'Student';
                                    const archiveMatch = showArchived ? true : !u.is_archived;
                                    return roleMatch && archiveMatch;
                                })
                                .map(u => (
                                    <tr key={u.id} style={{
                                        borderBottom: '1px solid var(--border)',
                                        opacity: u.is_archived ? 0.6 : 1,
                                        background: u.is_archived ? 'var(--bg-alt)' : 'transparent'
                                    }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600 }}>
                                                {u.username}
                                                {u.is_archived && (
                                                    <span style={{
                                                        marginLeft: '0.5rem',
                                                        padding: '0.125rem 0.5rem',
                                                        background: '#f3f4f6',
                                                        color: '#6b7280',
                                                        borderRadius: '4px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 500
                                                    }}>
                                                        ARCHIVED
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.625rem',
                                                background: 'var(--ring)',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {!u.is_archived && (
                                                    <button
                                                        onClick={() => toggleActivation(u.id, u.is_activated)}
                                                        className="btn"
                                                        style={{
                                                            padding: '0.4rem 0.8rem',
                                                            fontSize: '0.75rem',
                                                            background: u.is_activated ? '#fee2e2' : '#dcfce7',
                                                            color: u.is_activated ? '#b91c1c' : '#15803d'
                                                        }}
                                                    >
                                                        {u.is_activated ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleArchiveUser(u.id, u.is_archived)}
                                                    className="btn"
                                                    style={{
                                                        padding: '0.4rem 0.8rem',
                                                        fontSize: '0.75rem',
                                                        background: u.is_archived ? '#dbeafe' : '#fef3c7',
                                                        color: u.is_archived ? '#1e40af' : '#92400e',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}
                                                >
                                                    {u.is_archived ? (
                                                        <>
                                                            <ArchiveRestore size={14} />
                                                            Unarchive
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Archive size={14} />
                                                            Archive
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation can be a simple window.confirm for now or a modal */}

            {
                isAddUserOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
                            <button
                                onClick={() => setIsAddUserOpen(false)}
                                style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Add New User</h2>

                            <form onSubmit={handleAddUser}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Username</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={newUser.username}
                                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email</label>
                                    <input
                                        type="email"
                                        className="input"
                                        value={newUser.email}
                                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Role</label>
                                    <select
                                        className="input"
                                        value={newUser.role}
                                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="Student">Student</option>
                                        <option value="Trainer">Trainer</option>
                                        <option value="HOD">HOD</option>
                                        <option value="CourseMaster">Course Master</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setIsAddUserOpen(false)}
                                        style={{ background: 'transparent', border: '1px solid var(--border)' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </DashboardLayout >
    );
};

export default AdminOverview;
