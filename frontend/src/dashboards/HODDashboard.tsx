import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { Database, Users, Play, Plus, Book, CheckSquare } from 'lucide-react';

interface Unit {
    id: number;
    name: string;
    code: string;
    total_lessons: number;
    cat_frequency: number;
    course_group_name: string;
    trainer?: number;
    trainer_name?: string;
    cat_total_points: number;
    assessment_total_points: number;
    lessons_taught?: number;
    notes_count?: number;
    cats_count?: number;
}

interface Resource {
    id: number;
    title: string;
    resource_type: string;
    file: string | null;
    url: string | null;
    description: string;
}

interface Lesson {
    id: number;
    unit: number;
    unit_name?: string;
    unit_code?: string;
    trainer_name?: string;
    title: string;
    is_taught: boolean;
    is_approved: boolean;
    order: number;
}

interface Assessment {
    id: number;
    unit: number;
    unit_name?: string;
    assessment_type: string;
    points: number;
    due_date: string;
}

interface Course { id: number; name: string; }
interface Intake { id: number; name: string; }
interface Semester { id: number; start_date: string; end_date: string; }
interface Trainer {
    id: number;
    username: string;
    full_name?: string;
    email?: string;
    assigned_units?: Unit[];
}

const HODDashboard: React.FC = () => {
    const location = useLocation();
    const [units, setUnits] = useState<Unit[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [intakes, setIntakes] = useState<Intake[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
    const [isUnitAssignmentModalOpen, setIsUnitAssignmentModalOpen] = useState(false);

    // Form States
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [selectedUnitForAudit, setSelectedUnitForAudit] = useState<Unit | null>(null);
    const [isResourceAuditOpen, setIsResourceAuditOpen] = useState(false);
    const [isAssessmentAuditOpen, setIsAssessmentAuditOpen] = useState(false);
    const [verificationTab, setVerificationTab] = useState<'lessons' | 'resources' | 'assessments'>('lessons');
    const [groupForm, setGroupForm] = useState({ course: '', intake: '', semester: '', course_code: '' });
    const [unitForm, setUnitForm] = useState({ name: '', code: '', course_group: '', total_lessons: 10, cat_frequency: 3, cat_total_points: 30, assessment_total_points: 20 });
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [courseGroups, setCourseGroups] = useState<any[]>([]);
    const [trainerId, setTrainerId] = useState('');
    const [targetUnitId, setTargetUnitId] = useState('');

    const fetchData = async () => {
        try {
            const results = await Promise.allSettled([
                api.get('units/'),
                api.get('courses/'),
                api.get('intakes/'),
                api.get('semesters/'),
                api.get('users/'),
                api.get('course-groups/'),
                api.get('lessons/'),
                api.get('assessments/')
            ]);

            const [uRes, cRes, iRes, sRes, tRes, cgRes, lRes, aRes] = results;

            if (uRes.status === 'fulfilled') setUnits(uRes.value.data);
            if (cRes.status === 'fulfilled') setCourses(cRes.value.data);
            if (iRes.status === 'fulfilled') setIntakes(iRes.value.data);
            if (sRes.status === 'fulfilled') setSemesters(sRes.value.data);
            if (cgRes.status === 'fulfilled') setCourseGroups(cgRes.value.data);
            if (lRes.status === 'fulfilled') setLessons(lRes.value.data);
            if (aRes.status === 'fulfilled') setAssessments(aRes.value.data);
            if (tRes.status === 'fulfilled') {
                setTrainers(tRes.value.data.filter((u: any) => u.role === 'Trainer'));
            } else {
                console.warn('Failed to fetch trainers - HOD might lack permissions');
            }
        } catch (error) {
            console.error('Serious error in fetchData', error);
        }
    };

    const filteredIntakes = intakes.filter(i => !groupForm.course || (i as any).course === parseInt(groupForm.course));

    useEffect(() => {
        fetchData();
    }, []);

    // Selection logic for course_code auto-population and intake resetting
    useEffect(() => {
        if (groupForm.course) {
            const course = courses.find(c => c.id === parseInt(groupForm.course));
            if (course) {
                // If the currently selected intake doesn't belong to this course, reset it
                const intake = intakes.find(i => i.id === parseInt(groupForm.intake));
                if (intake && (intake as any).course !== course.id) {
                    setGroupForm(prev => ({ ...prev, intake: '', course_code: '' }));
                }

                if (groupForm.intake) {
                    const selectedIntake = intakes.find(i => i.id === parseInt(groupForm.intake));
                    if (selectedIntake) {
                        const intakePart = (selectedIntake as any).group_code || '';
                        const coursePart = (course as any).code || 'GEN';
                        setGroupForm(prev => ({ ...prev, course_code: `${coursePart} ${intakePart}` }));
                    }
                }
            }
        }
    }, [groupForm.course, groupForm.intake, courses, intakes]);

    const handleGenerateCats = async (unitId: number) => {
        setLoading(true);
        try {
            await api.post(`units/${unitId}/generate_cats/`);
            alert('CATs successfully generated for this unit.');
        } catch (error) {
            console.error('Failed to generate CATs', error);
            alert('Failed to generate CATs.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('units/', { ...unitForm, semester_number: 1 }); // Default sem for now
            alert('Unit created successfully');
            setIsUnitModalOpen(false);
            setUnitForm({ name: '', code: '', course_group: '', total_lessons: 10, cat_frequency: 3, cat_total_points: 30, assessment_total_points: 20 });
            fetchData();
        } catch (error) {
            console.error('Failed to create unit', error);
            alert('Failed to create unit');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourseGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('course-groups/', groupForm);
            alert('Course Group created successfully');
            setIsGroupModalOpen(false);
            setGroupForm({ course: '', intake: '', semester: '', course_code: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to create course group', error);
            alert('Failed to create course group');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTrainer = async (e: React.FormEvent) => {
        e.preventDefault();
        const tid = selectedTrainer ? selectedTrainer.id : trainerId;
        const uid = selectedUnit ? selectedUnit.id : targetUnitId;

        if (!tid || !uid) return;
        setLoading(true);
        try {
            await api.patch(`units/${uid}/`, { trainer: tid });
            alert('Assignment successful');
            setIsTrainerModalOpen(false);
            setIsUnitAssignmentModalOpen(false);
            setTrainerId('');
            setTargetUnitId('');
            fetchData();
        } catch (error) {
            console.error('Failed to assign trainer', error);
            alert('Failed to assign trainer');
        } finally {
            setLoading(false);
        }
    };

    const isTrainersPage = location.pathname.includes('/hod/trainers');
    const isVerificationPage = location.pathname.includes('/hod/verifications');

    const handleApproveLesson = async (lessonId: number) => {
        setLoading(true);
        try {
            await api.patch(`lessons/${lessonId}/`, { is_approved: true });
            alert('Lesson approved successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to approve lesson', error);
            alert('Failed to approve lesson');
        } finally {
            setLoading(false);
        }
    };

    const pendingLessons = lessons.filter(l => l.is_taught && !l.is_approved);

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {isVerificationPage ? 'Lesson Verifications' : isTrainersPage ? 'Trainers Management' : 'Department Management'}
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>
                    {isVerificationPage
                        ? 'Review and approve lessons marked as taught by your department trainers.'
                        : isTrainersPage
                            ? 'Manage your department teaching staff and their assignments.'
                            : 'Configure units, assessment schedules, and trainer assignments.'}
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
                    <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#15803d', borderRadius: '12px' }}>
                        <Database size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Registered Units</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{units.length}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #6366f1' }}>
                    <div style={{ padding: '0.75rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '12px' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Department Trainers</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{trainers.length}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#d97706', borderRadius: '12px' }}>
                        <CheckSquare size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pending Verifications</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingLessons.length}</p>
                    </div>
                </div>
            </div>

            {isVerificationPage ? (
                /* Verification View */
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Department Audit</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Audit teaching delivery and material quality.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-alt)', padding: '0.4rem', borderRadius: '12px' }}>
                            <button
                                onClick={() => setVerificationTab('lessons')}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: verificationTab === 'lessons' ? 'var(--bg-main)' : 'transparent', color: verificationTab === 'lessons' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: verificationTab === 'lessons' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                            >
                                Lessons
                            </button>
                            <button
                                onClick={() => setVerificationTab('resources')}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: verificationTab === 'resources' ? 'var(--bg-main)' : 'transparent', color: verificationTab === 'resources' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: verificationTab === 'resources' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                            >
                                Resources
                            </button>
                            <button
                                onClick={() => setVerificationTab('assessments')}
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', background: verificationTab === 'assessments' ? 'var(--bg-main)' : 'transparent', color: verificationTab === 'assessments' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: verificationTab === 'assessments' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                            >
                                Assessments
                            </button>
                        </div>
                    </div>

                    {verificationTab === 'lessons' && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem' }}>Lesson Title</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Unit</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Trainer</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingLessons.length > 0 ? pendingLessons.map(l => (
                                        <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: 600 }}>{l.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lesson Order: #{l.order}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{l.unit_code}</span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                                                        {l.trainer_name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span style={{ fontSize: '0.875rem' }}>{l.trainer_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ padding: '0.25rem 0.6rem', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                    Taught (Unverified)
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: '#10b981', color: 'white' }}
                                                    onClick={() => handleApproveLesson(l.id)}
                                                    disabled={loading}
                                                >
                                                    Approve
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                All caught up! No lessons pending verification.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {verificationTab === 'resources' && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem' }}>Resource Title</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Unit</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Trainer</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Type</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lessons.flatMap(l => ((l as any).resources || []).map((r: Resource) => ({ ...r, unit_code: l.unit_code, trainer_name: l.trainer_name }))).length > 0 ? (
                                        lessons.flatMap(l => ((l as any).resources || []).map((r: Resource) => ({ ...r, unit_code: l.unit_code, trainer_name: l.trainer_name }))).map(r => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{r.unit_code}</span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <span style={{ fontSize: '0.875rem' }}>{r.trainer_name}</span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <span style={{ padding: '0.25rem 0.6rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                        {r.resource_type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    {r.file ? (
                                                        <a href={r.file} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: 'var(--bg-alt)', color: 'var(--text-main)' }}>View File</a>
                                                    ) : r.url ? (
                                                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: 'var(--bg-alt)', color: 'var(--text-main)' }}>Open Link</a>
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No resources uploaded in the department yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {verificationTab === 'assessments' && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem' }}>Assessment</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Unit</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Points</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessments.length > 0 ? assessments.map(a => (
                                        <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: 600 }}>{a.assessment_type}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{a.unit_name}</span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ fontSize: '0.875rem' }}>{a.points} Pts</span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ fontSize: '0.875rem' }}>{new Date(a.due_date).toLocaleDateString()}</span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No assessments scheduled in the department yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : !isTrainersPage ? (
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Unit Management & Automation</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Schedule CATs and manage classroom readiness.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setIsGroupModalOpen(true)}
                                className="btn"
                                style={{ background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.875rem' }}
                            >
                                <Plus size={16} />
                                New Course Group
                            </button>
                            <button
                                onClick={() => setIsUnitModalOpen(true)}
                                className="btn btn-primary"
                                style={{ borderRadius: '10px', fontSize: '0.875rem' }}
                            >
                                <Plus size={16} />
                                Register New Unit
                            </button>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem' }}>Unit Details</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Course Group</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Workload</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Trainer</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {units.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Database size={12} /> {u.code}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{ padding: '0.25rem 0.75rem', background: '#f1f5f9', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500 }}>
                                                {u.course_group_name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontSize: '0.875rem' }}>{u.total_lessons} Lessons</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CAT every {u.cat_frequency} lessons</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {u.trainer_name ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                                                        {u.trainer_name[0]}
                                                    </div>
                                                    <span style={{ fontSize: '0.875rem' }}>{u.trainer_name}</span>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.875rem', color: '#ef4444', fontWeight: 500 }}>Unassigned</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleGenerateCats(u.id)}
                                                className="btn btn-sm"
                                                style={{ fontSize: '0.75rem', background: '#f5f3ff', color: '#6d28d9', borderRadius: '8px' }}
                                                disabled={loading}
                                            >
                                                <Play size={14} />
                                                CATs
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                style={{ fontSize: '0.75rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                                onClick={() => {
                                                    setSelectedUnit(u);
                                                    setTrainerId(u.trainer?.toString() || '');
                                                    setIsTrainerModalOpen(true);
                                                }}
                                            >
                                                <Users size={14} />
                                                Assign
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Trainers View */
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Department Trainers</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Monitor trainer workload and unit assignments.</p>
                        </div>
                        <button className="btn btn-primary btn-sm" style={{ borderRadius: '10px' }} onClick={() => fetchData()}>
                            Refresh List
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem' }}>Staff Member</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Unit Performance</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Summary</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trainers.map(t => {
                                    const trainerUnits = units.filter(u => u.trainer === t.id);
                                    return (
                                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                                                        {t.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{t.username}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            Staff ID: #{t.id}
                                                            {lessons.filter(l => l.trainer_name === t.username && l.is_taught && !l.is_approved).length > 0 && (
                                                                <span style={{ padding: '0.1rem 0.4rem', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                                                                    {lessons.filter(l => l.trainer_name === t.username && l.is_taught && !l.is_approved).length} Pending
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {trainerUnits.length > 0 ? trainerUnits.map(u => (
                                                        <div key={u.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca' }}>{u.code}</span>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.name}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                                                                        <span>Lessons</span>
                                                                        <span>{u.lessons_taught}/{u.total_lessons}</span>
                                                                    </div>
                                                                    <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                                                        <div style={{ height: '100%', background: '#10b981', width: `${((u.lessons_taught || 0) / (u.total_lessons || 1)) * 100}%` }}></div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                                    <div
                                                                        title="View Notes/Resources"
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: u.notes_count ? '#10b981' : '#ef4444', cursor: 'pointer' }}
                                                                        onClick={() => {
                                                                            setSelectedUnitForAudit(u);
                                                                            setIsResourceAuditOpen(true);
                                                                        }}
                                                                    >
                                                                        <Book size={10} /> {u.notes_count || 0}
                                                                    </div>
                                                                    <div
                                                                        title="View CATs Uploaded"
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: u.cats_count ? '#6366f1' : '#ef4444', cursor: 'pointer' }}
                                                                        onClick={() => {
                                                                            setSelectedUnitForAudit(u);
                                                                            setIsAssessmentAuditOpen(true);
                                                                        }}
                                                                    >
                                                                        <Database size={10} /> {u.cats_count || 0}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No units assigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Workload</div>
                                                    <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{trainerUnits.length} Units</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                                                <button
                                                    className="btn btn-sm"
                                                    style={{ background: 'var(--primary)', color: 'white', borderRadius: '8px', width: '100%' }}
                                                    onClick={() => {
                                                        setSelectedTrainer(t);
                                                        setIsUnitAssignmentModalOpen(true);
                                                    }}
                                                >
                                                    <Plus size={14} />
                                                    Assign Unit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Course Group Modal */}
            {isGroupModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '500px',
                        width: '90%',
                        backgroundColor: 'var(--bg-main)',
                        padding: '2.5rem',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border)',
                        position: 'relative'
                    }}>
                        <h3 style={{
                            marginBottom: '1rem',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, var(--text-main) 0%, var(--text-muted) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Create New Course Group</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.925rem' }}>
                            Register a new group by selection existing course and intake configurations.
                        </p>
                        <form onSubmit={handleCreateCourseGroup} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Course</label>
                                <select
                                    className="form-control"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--border)',
                                        backgroundColor: 'var(--bg-alt)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    value={groupForm.course}
                                    onChange={e => setGroupForm({ ...groupForm, course: e.target.value })}
                                >
                                    <option value="">Select Course</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({(c as any).code})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Intake</label>
                                <select
                                    className="form-control"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--border)',
                                        backgroundColor: 'var(--bg-alt)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    value={groupForm.intake}
                                    onChange={e => setGroupForm({ ...groupForm, intake: e.target.value })}
                                >
                                    <option value="">Select Intake</option>
                                    {filteredIntakes.map(i => <option key={i.id} value={i.id}>{i.name} ({(i as any).group_code})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Course Code (Auto-generated or Existing)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        list="existing-codes"
                                        placeholder="e.g. ICT 2501"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '12px',
                                            border: '1.5px solid var(--border)',
                                            backgroundColor: 'var(--bg-alt)',
                                            fontWeight: 600,
                                            color: '#4338ca'
                                        }}
                                        value={groupForm.course_code}
                                        onChange={e => setGroupForm({ ...groupForm, course_code: e.target.value })}
                                    />
                                    <datalist id="existing-codes">
                                        {[...new Set(courseGroups.map(cg => cg.course_code))].filter(Boolean).map(code => (
                                            <option key={code} value={code} />
                                        ))}
                                    </datalist>
                                    <div style={{
                                        position: 'absolute',
                                        right: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        fontSize: '0.75rem',
                                        color: '#6366f1',
                                        pointerEvents: 'none'
                                    }}>Suggested</div>
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Semester</label>
                                <select
                                    className="form-control"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--border)',
                                        backgroundColor: 'var(--bg-alt)'
                                    }}
                                    value={groupForm.semester}
                                    onChange={e => setGroupForm({ ...groupForm, semester: e.target.value })}
                                >
                                    <option value="">Select Semester</option>
                                    {semesters.map(s => <option key={s.id} value={s.id}>{s.start_date} to {s.end_date}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        padding: '0.875rem',
                                        borderRadius: '12px',
                                        background: 'var(--bg-alt)',
                                        fontWeight: 600
                                    }}
                                    onClick={() => setIsGroupModalOpen(false)}
                                >Cancel</button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{
                                        flex: 2,
                                        padding: '0.875rem',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
                                        color: 'white',
                                        fontWeight: 600,
                                        boxShadow: '0 10px 15px -3px rgba(67, 56, 202, 0.3)'
                                    }}
                                    disabled={loading}
                                >{loading ? 'Creating...' : 'Create Group'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Register Unit Modal */}
            {isUnitModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '550px',
                        width: '90%',
                        backgroundColor: 'var(--bg-main)',
                        padding: '2.5rem',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border)'
                    }}>
                        <h3 style={{
                            marginBottom: '1rem',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, var(--text-main) 0%, var(--text-muted) 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Register New Unit</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.925rem' }}>
                            Define unit parameters and link to a validated course group.
                        </p>
                        <form onSubmit={handleCreateUnit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Unit Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                        value={unitForm.name}
                                        onChange={e => setUnitForm({ ...unitForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Unit Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                        value={unitForm.code}
                                        onChange={e => setUnitForm({ ...unitForm, code: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Course Group</label>
                                <select
                                    className="form-control"
                                    required
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                    value={unitForm.course_group}
                                    onChange={e => setUnitForm({ ...unitForm, course_group: e.target.value })}
                                >
                                    <option value="">Select Group</option>
                                    {courseGroups.map(cg => (
                                        <option key={cg.id} value={cg.id}>
                                            {cg.course_code || 'UNNAMED GROUP'} - {cg.course_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Total Lessons</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                        value={unitForm.total_lessons}
                                        onChange={e => setUnitForm({ ...unitForm, total_lessons: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>CAT Frequency</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                        value={unitForm.cat_frequency}
                                        onChange={e => setUnitForm({ ...unitForm, cat_frequency: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>CAT Total Points</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                        value={unitForm.cat_total_points}
                                        onChange={e => setUnitForm({ ...unitForm, cat_total_points: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Assessment Points</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                        value={unitForm.assessment_total_points}
                                        onChange={e => setUnitForm({ ...unitForm, assessment_total_points: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, padding: '0.875rem', borderRadius: '12px', background: 'var(--bg-alt)', fontWeight: 600 }} onClick={() => setIsUnitModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.875rem', borderRadius: '12px', background: 'var(--primary)', color: 'white', fontWeight: 600 }} disabled={loading}>Register Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Trainer Modal (from units view) */}
            {isTrainerModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '400px', width: '90%', background: 'var(--bg-main)',
                        padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>Assign Trainer</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Assign a staff member to handle: <strong>{selectedUnit?.name}</strong>
                        </p>
                        <form onSubmit={handleAssignTrainer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Select Trainer</label>
                                <select
                                    className="form-control"
                                    required
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', marginTop: '0.5rem' }}
                                    value={trainerId}
                                    onChange={e => setTrainerId(e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {trainers.map(t => <option key={t.id} value={t.id}>{t.username}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, background: 'var(--bg-alt)', borderRadius: '10px' }} onClick={() => setIsTrainerModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: '10px' }} disabled={loading}>Assign</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Unit Modal (from trainers view) */}
            {isUnitAssignmentModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '400px', width: '90%', background: 'var(--bg-main)',
                        padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>Assign Unit</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Assign a unit to: <strong>{selectedTrainer?.username}</strong>
                        </p>
                        <form onSubmit={handleAssignTrainer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Select Unit</label>
                                <select
                                    className="form-control"
                                    required
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', marginTop: '0.5rem' }}
                                    value={targetUnitId}
                                    onChange={e => setTargetUnitId(e.target.value)}
                                >
                                    <option value="">Select a unit...</option>
                                    {units.filter(u => u.trainer !== selectedTrainer?.id).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, background: 'var(--bg-alt)', borderRadius: '10px' }} onClick={() => setIsUnitAssignmentModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: '10px' }} disabled={loading}>Assign Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Resource Audit Modal */}
            {isResourceAuditOpen && selectedUnitForAudit && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '500px', width: '90%', background: 'var(--bg-main)',
                        padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Resource Audit</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Notes and Materials for: <strong>{selectedUnitForAudit.code}</strong></p>
                            </div>
                            <button onClick={() => setIsResourceAuditOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {lessons.filter(l => l.unit === selectedUnitForAudit.id).flatMap(l => (l as any).resources || []).length > 0 ? (
                                lessons.filter(l => l.unit === selectedUnitForAudit.id).map(l => (
                                    <div key={l.id}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Lesson {l.order}: {l.title}</div>
                                        {((l as any).resources || []).map((r: any) => (
                                            <div key={r.id} style={{ padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <Book size={18} style={{ color: 'var(--primary)' }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.title}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Type: {r.resource_type}</div>
                                                    </div>
                                                </div>
                                                {r.file ? (
                                                    <a href={r.file} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ borderRadius: '8px', fontSize: '0.75rem' }}>Download</a>
                                                ) : r.url ? (
                                                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ borderRadius: '8px', fontSize: '0.75rem' }}>Open Link</a>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No resources uploaded for this unit yet.</p>
                            )}
                        </div>
                        <button className="btn" style={{ width: '100%', marginTop: '1.5rem', background: 'var(--bg-alt)', borderRadius: '10px' }} onClick={() => setIsResourceAuditOpen(false)}>Close</button>
                    </div>
                </div>
            )}

            {/* Assessment Audit Modal */}
            {isAssessmentAuditOpen && selectedUnitForAudit && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '500px', width: '90%', background: 'var(--bg-main)',
                        padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Assessment Audit</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>CATs and Assignments for: <strong>{selectedUnitForAudit.code}</strong></p>
                            </div>
                            <button onClick={() => setIsAssessmentAuditOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {assessments.filter(a => a.unit === selectedUnitForAudit.id).length > 0 ? (
                                assessments.filter(a => a.unit === selectedUnitForAudit.id).map(a => (
                                    <div key={a.id} style={{ padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Database size={18} style={{ color: '#6366f1' }} />
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{a.assessment_type}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due: {new Date(a.due_date).toLocaleDateString()} | {a.points} Points</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No assessments created for this unit yet.</p>
                            )}
                        </div>
                        <button className="btn" style={{ width: '100%', marginTop: '1.5rem', background: 'var(--bg-alt)', borderRadius: '10px' }} onClick={() => setIsAssessmentAuditOpen(false)}>Close</button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default HODDashboard;
