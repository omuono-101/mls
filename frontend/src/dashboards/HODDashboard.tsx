import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { Database, Users, Play, Plus, Book, CheckSquare, CheckCircle, Edit2, UserPlus, FileText } from 'lucide-react';
import {
    useUnits,
    useCourses,
    useIntakes,
    useSemesters,
    useCourseGroups,
    useLessons,
    useAssessments,
    useTrainers
} from '../hooks/useDataHooks';

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
    course_group_code?: string;
}

interface Resource {
    id: number;
    title: string;
    resource_type: string;
    file: string | null;
    url: string | null;
    description: string;
    is_approved: boolean;
    is_active: boolean;
    audit_feedback: string;
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
    audit_feedback: string;
    resources?: Resource[];
}

interface Assessment {
    id: number;
    unit: number;
    unit_name?: string;
    title: string;
    assessment_type: string;
    points: number;
    due_date: string;
    is_approved: boolean;
    is_active: boolean;
    audit_feedback: string;
}

interface Course { id: number; name: string; code?: string; }
interface Intake { id: number; name: string; course: number; group_code?: string; }
interface Semester { id: number; name: string; start_date: string; end_date: string; intake: number; }
interface CourseGroup {
    semester_name: string;
    intake_name: string;
    id: number;
    course: number;
    intake: number;
    semester: number;
    course_code: string;
    course_name?: string;
}
interface Trainer {
    id: number;
    username: string;
    full_name?: string;
    email?: string;
    assigned_units?: Unit[];
}

const HODDashboard: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Data hooks
    const { data: units = [], refetch: refetchUnits } = useUnits();
    const { data: courses = [], refetch: refetchCourses } = useCourses();
    const { data: intakes = [], refetch: refetchIntakes } = useIntakes();
    const { data: semesters = [], refetch: refetchSemesters } = useSemesters();
    const { data: courseGroups = [], refetch: refetchCourseGroups } = useCourseGroups();
    const { data: lessons = [], refetch: refetchLessons } = useLessons();
    const { data: assessments = [], refetch: refetchAssessments } = useAssessments();
    const { data: trainers = [], refetch: refetchTrainers } = useTrainers();

    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                refetchUnits(),
                refetchCourses(),
                refetchIntakes(),
                refetchSemesters(),
                refetchCourseGroups(),
                refetchLessons(),
                refetchAssessments(),
                refetchTrainers()
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Modals
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
    const [isUnitAssignmentModalOpen, setIsUnitAssignmentModalOpen] = useState(false);
    const [isEditUnitModalOpen, setIsEditUnitModalOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

    // Form States
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
    const [selectedUnitForAudit, setSelectedUnitForAudit] = useState<Unit | null>(null);
    const [isResourceAuditOpen, setIsResourceAuditOpen] = useState(false);
    const [isAssessmentAuditOpen, setIsAssessmentAuditOpen] = useState(false);

    // Detail Modal States for Department Audit
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [resourceFeedback, setResourceFeedback] = useState('');
    const [assessmentFeedback, setAssessmentFeedback] = useState('');

    const [verificationTab, setVerificationTab] = useState<'lessons' | 'resources' | 'assessments'>('lessons');
    const [groupForm, setGroupForm] = useState({ course: '', intake: '', semester: '', course_code: '' });
    const [unitForm, setUnitForm] = useState({ name: '', code: '', course_group: '', total_lessons: 10, cat_frequency: 3, cat_total_points: 30, assessment_total_points: 20 });
    const [editUnitForm, setEditUnitForm] = useState({ id: 0, name: '', code: '', course_group: '', total_lessons: 10, cat_frequency: 3, cat_total_points: 30, assessment_total_points: 20 });
    const [feedbackForm, setFeedbackForm] = useState({ contentId: 0, contentType: 'lesson' as 'lesson' | 'resource' | 'assessment', feedback: '' });
    const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
    const [managementTab, setManagementTab] = useState<'units' | 'groups'>('units');
    const [trainerId, setTrainerId] = useState('');
    const [targetUnitId, setTargetUnitId] = useState('');

    const filteredIntakes = groupForm.course
        ? intakes.filter((i: Intake) => i.course === parseInt(groupForm.course))
        : [];

    const filteredSemesters = groupForm.intake
        ? semesters.filter((s: Semester) => s.intake === parseInt(groupForm.intake))
        : [];


    // Selection logic for course_code auto-population and intake resetting
    useEffect(() => {
        if (groupForm.course) {
            const course = courses.find((c: Course) => c.id === parseInt(groupForm.course));
            if (course) {
                // If the currently selected intake doesn't belong to this course, reset it
                const intake = intakes.find((i: Intake) => i.id === parseInt(groupForm.intake));
                if (intake && intake.course !== course.id) {
                    setGroupForm((prev: any) => ({ ...prev, intake: '', course_code: '' }));
                }

                if (groupForm.intake) {
                    const selectedIntake = intakes.find((i: Intake) => i.id === parseInt(groupForm.intake));

                    // If the currently selected semester doesn't belong to this intake, reset it
                    const semester = semesters.find((s: Semester) => s.id === parseInt(groupForm.semester));
                    if (semester && selectedIntake && semester.intake !== selectedIntake.id) {
                        setGroupForm((prev: any) => ({ ...prev, semester: '' }));
                    }

                    if (selectedIntake) {
                        const intakePart = selectedIntake.group_code || '';
                        const coursePart = course.code || 'GEN';
                        setGroupForm((prev: any) => ({ ...prev, course_code: `${coursePart} ${intakePart}` }));
                    }
                } else {
                    // Reset semester if intake is cleared
                    setGroupForm((prev: any) => ({ ...prev, semester: '' }));
                }
            }
        } else {
            // Reset intake and semester if course is cleared
            setGroupForm((prev: any) => ({ ...prev, intake: '', semester: '', course_code: '' }));
        }
    }, [groupForm.course, groupForm.intake, groupForm.semester, courses, intakes, semesters]);



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

    const openEditUnitModal = (unit: Unit) => {
        setEditUnitForm({
            id: unit.id,
            name: unit.name,
            code: unit.code,
            course_group: (unit as any).course_group?.toString() || '',
            total_lessons: unit.total_lessons,
            cat_frequency: unit.cat_frequency,
            cat_total_points: unit.cat_total_points,
            assessment_total_points: unit.assessment_total_points
        });
        setIsEditUnitModalOpen(true);
    };

    const handleUpdateUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch(`units/${editUnitForm.id}/`, editUnitForm);
            alert('Unit updated successfully');
            setIsEditUnitModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to update unit', error);
            alert('Failed to update unit');
        } finally {
            setLoading(false);
        }
    };


    const isTrainersPage = location.pathname.includes('/hod/trainers');
    const isVerificationPage = location.pathname.includes('/hod/verifications');

    const handleAuditAction = async (type: 'lesson' | 'resource' | 'assessment', id: number, approved: boolean, feedback: string = '') => {
        setLoading(true);
        const endpoint = type === 'lesson' ? 'lessons' : type === 'resource' ? 'resources' : 'assessments';
        try {
            await api.patch(`${endpoint}/${id}/`, {
                is_approved: approved,
                audit_feedback: feedback
            });
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} ${approved ? 'approved' : 'feedback sent'} successfully`);
            setIsFeedbackModalOpen(false);
            setFeedbackForm({ contentId: 0, contentType: 'lesson', feedback: '' });
            fetchData();
        } catch (error) {
            console.error(`Failed to audit ${type}`, error);
            alert(`Failed to audit ${type}`);
        } finally {
            setLoading(false);
        }
    };

    const openFeedbackModal = (type: 'lesson' | 'resource' | 'assessment', id: number) => {
        setFeedbackForm({ contentId: id, contentType: type, feedback: '' });
        setIsFeedbackModalOpen(true);
    };

    const pendingLessons = lessons.filter((l: Lesson) => l.is_taught && !l.is_approved);

    const handleActivateDeactivate = async (type: 'resource' | 'assessment', id: number, isActive: boolean) => {
        setLoading(true);
        const endpoint = type === 'resource' ? 'resources' : 'assessments';
        try {
            await api.patch(`${endpoint}/${id}/`, {
                is_active: isActive
            });
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} ${isActive ? 'activated' : 'deactivated'} successfully`);
            fetchData();
        } catch (error) {
            console.error(`Failed to ${isActive ? 'activate' : 'deactivate'} ${type}`, error);
            alert(`Failed to ${isActive ? 'activate' : 'deactivate'} ${type}`);
        } finally {
            setLoading(false);
        }
    };

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

            <div className="grid-responsive" style={{ marginBottom: '2.5rem' }}>
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
                <div
                    className="card"
                    style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f43f5e', cursor: 'pointer' }}
                    onClick={() => navigate('/hod/lesson-plans')}
                >
                    <div style={{ padding: '0.75rem', background: '#ffe4e6', color: '#e11d48', borderRadius: '12px' }}>
                        <FileText size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Lesson Plans</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>Review &rarr;</p>
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
                        <div className="table-responsive">
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
                                    {lessons.filter((l: Lesson) => l.is_taught).length > 0 ? lessons.filter((l: Lesson) => l.is_taught).map((l: Lesson) => (
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
                                                {l.is_approved ? (
                                                    <span style={{ padding: '0.25rem 0.6rem', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                        Approved
                                                    </span>
                                                ) : l.audit_feedback ? (
                                                    <span style={{ padding: '0.25rem 0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                        Audit Feedback Sent
                                                    </span>
                                                ) : (
                                                    <span style={{ padding: '0.25rem 0.6rem', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>
                                                        Pending Audit
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {!l.is_approved && (
                                                        <button
                                                            className="btn btn-sm"
                                                            title="Approve Lesson"
                                                            style={{ padding: '0.4rem', minWidth: 'auto', background: '#dcfce7', color: '#15803d', borderRadius: '8px', border: '1px solid #bbf7d0' }}
                                                            onClick={() => handleAuditAction('lesson', l.id, true)}
                                                            disabled={loading}
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-sm"
                                                        title="Provide Feedback"
                                                        style={{ padding: '0.4rem', minWidth: 'auto', background: '#f3f4f6', color: '#374151', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                        onClick={() => openFeedbackModal('lesson', l.id)}
                                                        disabled={loading}
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                </div>
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
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem' }}>Resource Title</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Unit</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Trainer</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Type</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lessons.flatMap((l: Lesson) => (l.resources || []).map((r: Resource) => ({ ...r, unit_code: l.unit_code, trainer_name: l.trainer_name }))).length > 0 ? (
                                        lessons.flatMap((l: Lesson) => (l.resources || []).map((r: Resource) => ({ ...r, unit_code: l.unit_code, trainer_name: l.trainer_name }))).map((r: any) => (
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
                                                    {r.is_approved ? (
                                                        <span style={{ padding: '0.25rem 0.6rem', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>Approved</span>
                                                    ) : r.audit_feedback ? (
                                                        <span style={{ padding: '0.25rem 0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>Feedback Sent</span>
                                                    ) : (
                                                        <span style={{ padding: '0.25rem 0.6rem', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>Pending</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem 1.5rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                        {r.file ? (
                                                            <a href={r.file} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: 'var(--bg-alt)', color: 'var(--text-main)', fontSize: '0.75rem', minWidth: 'auto' }}>View</a>
                                                        ) : r.url ? (
                                                            <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: 'var(--bg-alt)', color: 'var(--text-main)', fontSize: '0.75rem', minWidth: 'auto' }}>Link</a>
                                                        ) : null}

                                                        {!r.is_approved && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleAuditAction('resource', r.id, true)}
                                                                    style={{ background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '6px', padding: '0.3rem', cursor: 'pointer' }}
                                                                    title="Approve Resource"
                                                                >
                                                                    <CheckCircle size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => openFeedbackModal('resource', r.id)}
                                                                    style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', padding: '0.3rem', cursor: 'pointer' }}
                                                                    title="Request Changes"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                            </>
                                                        )}

                                                        {r.is_approved && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleActivateDeactivate('resource', r.id, !r.is_active)}
                                                                    style={{
                                                                        background: r.is_active ? '#fef3c7' : '#dcfce7',
                                                                        color: r.is_active ? '#92400e' : '#15803d',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        padding: '0.3rem',
                                                                        cursor: 'pointer',
                                                                        fontSize: '0.7rem',
                                                                        fontWeight: 600
                                                                    }}
                                                                    title={r.is_active ? 'Deactivate Resource' : 'Activate Resource'}
                                                                >
                                                                    {r.is_active ? 'Deactivate' : 'Activate'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
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
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem' }}>Assessment</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Unit</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Points</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Due Date</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assessments.length > 0 ? assessments.map((a: Assessment) => (
                                        <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: 600 }}>{a.assessment_type}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.title}</div>
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
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                {a.is_approved ? (
                                                    <span style={{ padding: '0.25rem 0.6rem', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>Approved</span>
                                                ) : a.audit_feedback ? (
                                                    <span style={{ padding: '0.25rem 0.6rem', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>Feedback Sent</span>
                                                ) : (
                                                    <span style={{ padding: '0.25rem 0.6rem', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>Pending</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                    {!a.is_approved && (
                                                        <>
                                                            <button
                                                                onClick={() => handleAuditAction('assessment', a.id, true)}
                                                                style={{ background: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '6px', padding: '0.3rem', cursor: 'pointer' }}
                                                                title="Approve Assessment"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => openFeedbackModal('assessment', a.id)}
                                                                style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', padding: '0.3rem', cursor: 'pointer' }}
                                                                title="Request Changes"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {a.is_approved && (
                                                        <button
                                                            onClick={() => handleActivateDeactivate('assessment', a.id, !a.is_active)}
                                                            style={{
                                                                background: a.is_active ? '#fef3c7' : '#dcfce7',
                                                                color: a.is_active ? '#92400e' : '#15803d',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                padding: '0.3rem',
                                                                cursor: 'pointer',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600
                                                            }}
                                                            title={a.is_active ? 'Deactivate Assessment' : 'Activate Assessment'}
                                                        >
                                                            {a.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    )}
                                                </div>
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
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Department Management</h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Configure Units and Course Groups.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-alt)', padding: '0.3rem', borderRadius: '10px' }}>
                            <button
                                onClick={() => setManagementTab('units')}
                                style={{
                                    padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                    background: managementTab === 'units' ? 'var(--bg-main)' : 'transparent',
                                    color: managementTab === 'units' ? 'var(--primary)' : 'var(--text-muted)',
                                    boxShadow: managementTab === 'units' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >Units</button>
                            <button
                                onClick={() => setManagementTab('groups')}
                                style={{
                                    padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                    background: managementTab === 'groups' ? 'var(--bg-main)' : 'transparent',
                                    color: managementTab === 'groups' ? 'var(--primary)' : 'var(--text-muted)',
                                    boxShadow: managementTab === 'groups' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >Course Groups</button>
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
                    {managementTab === 'units' ? (
                        <div className="table-responsive">
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
                                    {units.map((u: Unit) => (
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
                                            <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => handleGenerateCats(u.id)}
                                                    className="btn btn-sm"
                                                    title="Generate CATs"
                                                    style={{ padding: '0.4rem', minWidth: 'auto', background: '#f5f3ff', color: '#6d28d9', borderRadius: '8px', border: '1px solid #ddd6fe' }}
                                                    disabled={loading}
                                                >
                                                    <Play size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    title="Assign Trainer"
                                                    style={{ padding: '0.4rem', minWidth: 'auto', background: '#f0f9ff', color: '#0369a1', borderRadius: '8px', border: '1px solid #bae6fd' }}
                                                    onClick={() => {
                                                        setSelectedUnit(u);
                                                        setTrainerId(u.trainer?.toString() || '');
                                                        setIsTrainerModalOpen(true);
                                                    }}
                                                >
                                                    <UserPlus size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-sm"
                                                    title="Edit Unit"
                                                    style={{ padding: '0.4rem', minWidth: 'auto', background: '#f3f4f6', color: '#374151', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                    onClick={() => openEditUnitModal(u)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                    <tr>
                                        <th style={{ padding: '1rem 1.5rem' }}>Course Name</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Group Code</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Intake</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Semester</th>
                                        <th style={{ padding: '1rem 1.5rem' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courseGroups.length > 0 ? courseGroups.map((cg: CourseGroup) => (
                                        <tr key={cg.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontWeight: 600 }}>{cg.course_name || 'N/A'}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <span style={{ padding: '0.2rem 0.5rem', background: 'var(--bg-alt)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    {cg.course_code}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontSize: '0.875rem' }}>{cg.intake_name || 'N/A'}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ fontSize: '0.875rem' }}>{cg.semester_name || 'N/A'}</div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <button className="btn btn-sm" style={{ background: 'var(--bg-alt)', borderRadius: '8px' }}>Edit</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No course groups found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
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
                    <div className="table-responsive">
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
                                {trainers.map((t: Trainer) => {
                                    const trainerUnits = units.filter((u: Unit) => u.trainer === t.id);
                                    const trainerLessons = lessons.filter((l: Lesson) => l.trainer_name === t.username);
                                    const taughtLessons = trainerLessons.filter((l: Lesson) => l.is_taught);
                                    const pendingLessons = taughtLessons.filter((l: Lesson) => !l.is_approved);
                                    const trainerAssessments = assessments.filter((a: Assessment) => trainerUnits.some((u: Unit) => u.id === a.unit));
                                    const totalLessons = trainerUnits.reduce((sum: number, u: Unit) => sum + u.total_lessons, 0);
                                    const totalTaughtLessons = trainerUnits.reduce((sum: number, u: Unit) => sum + (u.lessons_taught || 0), 0);
                                    const totalResources = trainerUnits.reduce((sum: number, u: Unit) => sum + (u.notes_count || 0), 0);
                                    const totalAssessments = trainerAssessments.length;

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
                                                            {pendingLessons.length > 0 && (
                                                                <span style={{ padding: '0.1rem 0.4rem', background: '#fef3c7', color: '#92400e', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                                                                    {pendingLessons.length} Pending Approval
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    {trainerUnits.length > 0 ? trainerUnits.map((u: Unit) => {
                                                        const unitLessons = trainerLessons.filter((l: Lesson) => l.unit === u.id);
                                                        const unitTaught = unitLessons.filter((l: Lesson) => l.is_taught);
                                                        const unitApproved = unitTaught.filter((l: Lesson) => l.is_approved);
                                                        const progressPercent = u.total_lessons > 0 ? ((u.lessons_taught || 0) / u.total_lessons) * 100 : 0;

                                                        return (
                                                            <div key={u.id} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4338ca' }}>{u.code}</span>
                                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.name}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                                                                    <div style={{ flex: 1 }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                                                                            <span>Lessons Progress</span>
                                                                            <span>{u.lessons_taught || 0}/{u.total_lessons}</span>
                                                                        </div>
                                                                        <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                                                                            <div style={{
                                                                                height: '100%',
                                                                                background: progressPercent >= 100 ? '#10b981' : progressPercent >= 75 ? '#3b82f6' : progressPercent >= 50 ? '#f59e0b' : '#ef4444',
                                                                                width: `${progressPercent}%`,
                                                                                transition: 'width 0.3s ease'
                                                                            }}></div>
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
                                                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                                    <span>Created: {unitLessons.length}</span>
                                                                    <span>•</span>
                                                                    <span>Taught: {unitTaught.length}</span>
                                                                    <span>•</span>
                                                                    <span>Approved: {unitApproved.length}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No units assigned</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                        <div style={{ textAlign: 'center', padding: '0.5rem', background: '#f0f9ff', borderRadius: '8px' }}>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Lessons</div>
                                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0369a1' }}>{totalLessons}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'center', padding: '0.5rem', background: '#dcfce7', borderRadius: '8px' }}>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</div>
                                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#15803d' }}>{totalTaughtLessons}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                        <div style={{ textAlign: 'center', padding: '0.5rem', background: '#fef3c7', borderRadius: '8px' }}>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assessments</div>
                                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#92400e' }}>{totalAssessments}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'center', padding: '0.5rem', background: '#e0e7ff', borderRadius: '8px' }}>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resources</div>
                                                            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#4338ca' }}>{totalResources}</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Overall Progress</div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                                                            <span>Lessons</span>
                                                            <span>{totalTaughtLessons}/{totalLessons}</span>
                                                        </div>
                                                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{
                                                                height: '100%',
                                                                background: totalLessons > 0 && totalTaughtLessons === totalLessons ? '#10b981' : '#3b82f6',
                                                                width: totalLessons > 0 ? `${(totalTaughtLessons / totalLessons) * 100}%` : '0%',
                                                                transition: 'width 0.3s ease'
                                                            }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem 1.5rem', verticalAlign: 'top' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                                        {trainerUnits.length} unit{trainerUnits.length !== 1 ? 's' : ''} assigned
                                                    </div>
                                                </div>
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
                                    {courses.map((c: Course) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
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
                                        transition: 'all 0.2s ease',
                                        opacity: !groupForm.course ? 0.5 : 1,
                                        cursor: !groupForm.course ? 'not-allowed' : 'pointer'
                                    }}
                                    value={groupForm.intake}
                                    onChange={e => setGroupForm({ ...groupForm, intake: e.target.value })}
                                    disabled={!groupForm.course}
                                >
                                    <option value="">{groupForm.course ? "Select Intake" : "Select Course First"}</option>
                                    {filteredIntakes.map((i: Intake) => <option key={i.id} value={i.id}>{i.name} ({i.group_code})</option>)}
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
                                        {([...new Set(courseGroups.map((cg: CourseGroup) => cg.course_code))].filter(Boolean) as string[]).map((code: string) => (
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
                                        backgroundColor: 'var(--bg-alt)',
                                        transition: 'all 0.2s ease',
                                        opacity: !groupForm.intake ? 0.5 : 1,
                                        cursor: !groupForm.intake ? 'not-allowed' : 'pointer'
                                    }}
                                    value={groupForm.semester}
                                    onChange={e => setGroupForm({ ...groupForm, semester: e.target.value })}
                                    disabled={!groupForm.intake}
                                >
                                    <option value="">{groupForm.intake ? "Select Semester" : "Select Intake First"}</option>
                                    {filteredSemesters.map((s: Semester) => <option key={s.id} value={s.id}>{s.name} ({s.start_date} - {s.end_date})</option>)}
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
                                    {courseGroups.map((cg: CourseGroup) => (
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
                                    {trainers.map((t: Trainer) => <option key={t.id} value={t.id}>{t.username}</option>)}
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
                                    {units.map((u: Unit) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.code}) - {u.course_group_code || u.course_group_name}
                                            {u.trainer_name ? ` (Current: ${u.trainer_name})` : ' (Unassigned)'}
                                        </option>
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
                            {lessons.filter((l: Lesson) => l.unit === selectedUnitForAudit.id).flatMap((l: Lesson) => l.resources || []).length > 0 ? (
                                lessons.filter((l: Lesson) => l.unit === selectedUnitForAudit.id).map((l: Lesson) => (
                                    <div key={l.id}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Lesson {l.order}: {l.title}</div>
                                        {(l.resources || []).map((r: Resource) => (
                                            <div key={r.id} style={{ padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <Book size={18} style={{ color: 'var(--primary)' }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.title}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Type: {r.resource_type}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => setSelectedResource(r)}
                                                        className="btn btn-sm"
                                                        style={{ background: '#e0e7ff', color: '#4338ca', borderRadius: '8px', fontSize: '0.75rem' }}
                                                    >
                                                        View Details
                                                    </button>
                                                    {r.file ? (
                                                        <a href={r.file} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ borderRadius: '8px', fontSize: '0.75rem' }}>Download</a>
                                                    ) : r.url ? (
                                                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ borderRadius: '8px', fontSize: '0.75rem' }}>Open Link</a>
                                                    ) : null}
                                                </div>
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

            {/* Resource Detail Modal */}
            {selectedResource && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '700px', width: '90%', background: 'var(--bg-main)',
                        padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedResource.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Resource Details & Quality Review</p>
                            </div>
                            <button onClick={() => setSelectedResource(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'var(--bg-alt)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Resource Information</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type:</span>
                                        <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {selectedResource.resource_type}
                                        </span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
                                        {selectedResource.is_approved ? (
                                            <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                Approved ✓
                                            </span>
                                        ) : (
                                            <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                Pending Review
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'var(--bg-alt)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Resource Preview</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {selectedResource.file ? (
                                        <div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>File:</span>
                                            <a href={selectedResource.file} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.5rem', color: 'var(--primary)', textDecoration: 'underline' }}>
                                                Download File
                                            </a>
                                        </div>
                                    ) : selectedResource.url ? (
                                        <div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Link:</span>
                                            <a href={selectedResource.url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.5rem', color: 'var(--primary)', textDecoration: 'underline' }}>
                                                Open Link
                                            </a>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {selectedResource.description && (
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Description</h4>
                                <div style={{ background: 'var(--bg-alt)', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                                    {selectedResource.description}
                                </div>
                            </div>
                        )}

                        {!selectedResource.is_approved && (
                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Quality Assurance Feedback</h4>
                                <textarea
                                    value={resourceFeedback}
                                    onChange={(e) => setResourceFeedback(e.target.value)}
                                    placeholder="Provide feedback for the trainer regarding this resource..."
                                    rows={4}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', resize: 'vertical', marginBottom: '1rem' }}
                                />
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => {
                                            handleAuditAction('resource', selectedResource.id, false, resourceFeedback);
                                            setSelectedResource(null);
                                            setResourceFeedback('');
                                        }}
                                        disabled={loading || !resourceFeedback.trim()}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            background: '#f43f5e', color: 'white', border: 'none',
                                            padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer',
                                            opacity: loading ? 0.7 : 1
                                        }}
                                    >
                                        Request Changes
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleAuditAction('resource', selectedResource.id, true, resourceFeedback || 'Approved by HOD');
                                            setSelectedResource(null);
                                            setResourceFeedback('');
                                        }}
                                        disabled={loading}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            background: '#10b981', color: 'white', border: 'none',
                                            padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer',
                                            opacity: loading ? 0.7 : 1
                                        }}
                                    >
                                        Approve Resource
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedResource.is_approved && (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                <p style={{ fontWeight: 600, color: '#10b981' }}>✓ This resource has been approved and is visible to students</p>
                                {selectedResource.audit_feedback && <p style={{ marginTop: '0.5rem' }}>Feedback: {selectedResource.audit_feedback}</p>}
                            </div>
                        )}
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
                            {assessments.filter((a: Assessment) => a.unit === selectedUnitForAudit.id).length > 0 ? (
                                assessments.filter((a: Assessment) => a.unit === selectedUnitForAudit.id).map((a: Assessment) => (
                                    <div key={a.id} style={{ padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <Database size={18} style={{ color: '#6366f1' }} />
                                            <div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{a.assessment_type}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Due: {new Date(a.due_date).toLocaleDateString()} | {a.points} Points</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedAssessment(a)}
                                            className="btn btn-sm"
                                            style={{ background: '#e0e7ff', color: '#4338ca', borderRadius: '8px', fontSize: '0.75rem' }}
                                        >
                                            View Details
                                        </button>
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

            {/* Assessment Detail Modal */}
            {selectedAssessment && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '700px', width: '90%', background: 'var(--bg-main)',
                        padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedAssessment.assessment_type}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Assessment Details & Quality Review</p>
                            </div>
                            <button onClick={() => setSelectedAssessment(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ background: 'var(--bg-alt)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Assessment Information</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Type:</span>
                                        <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>{selectedAssessment.assessment_type}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Points:</span>
                                        <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>{selectedAssessment.points} pts</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Due Date:</span>
                                        <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>{new Date(selectedAssessment.due_date).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
                                        {selectedAssessment.is_approved ? (
                                            <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>Approved ✓</span>
                                        ) : (
                                            <span style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>Pending Review</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: 'var(--bg-alt)', padding: '1.5rem', borderRadius: '12px' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Quality Checklist</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <CheckCircle size={16} style={{ color: selectedAssessment.points > 0 ? '#10b981' : '#ef4444' }} />
                                        <span style={{ color: selectedAssessment.points > 0 ? '#10b981' : '#ef4444' }}>{selectedAssessment.points > 0 ? 'Has points assigned' : 'Missing points'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <CheckCircle size={16} style={{ color: selectedAssessment.due_date ? '#10b981' : '#ef4444' }} />
                                        <span style={{ color: selectedAssessment.due_date ? '#10b981' : '#ef4444' }}>{selectedAssessment.due_date ? 'Has due date set' : 'Missing due date'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                        <CheckCircle size={16} style={{ color: '#10b981' }} />
                                        <span style={{ color: '#10b981' }}>Unit assigned</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!selectedAssessment.is_approved && (
                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Quality Assurance Feedback</h4>
                                <textarea
                                    value={assessmentFeedback}
                                    onChange={(e) => setAssessmentFeedback(e.target.value)}
                                    placeholder="Provide feedback for the trainer regarding this assessment..."
                                    rows={4}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', resize: 'vertical', marginBottom: '1rem' }}
                                />
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => { handleAuditAction('assessment', selectedAssessment.id, false, assessmentFeedback); setSelectedAssessment(null); setAssessmentFeedback(''); }}
                                        disabled={loading || !assessmentFeedback.trim()}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f43f5e', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                                    >Request Changes</button>
                                    <button
                                        onClick={() => { handleAuditAction('assessment', selectedAssessment.id, true, assessmentFeedback || 'Approved by HOD'); setSelectedAssessment(null); setAssessmentFeedback(''); }}
                                        disabled={loading}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                                    >Approve Assessment</button>
                                </div>
                            </div>
                        )}

                        {selectedAssessment.is_approved && (
                            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                                <p style={{ fontWeight: 600, color: '#10b981' }}>✓ This assessment has been approved and is visible to students</p>
                                {selectedAssessment.audit_feedback && <p style={{ marginTop: '0.5rem' }}>Feedback: {selectedAssessment.audit_feedback}</p>}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Audit Feedback Modal */}
            {isFeedbackModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '500px', width: '90%', backgroundColor: 'var(--bg-main)',
                        padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border)'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>Quality Audit Feedback</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Provide feedback to the trainer regarding the {feedbackForm.contentType}.
                            This will mark the item as "Needs Revision".
                        </p>

                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Audit Observations / Requirements</label>
                            <textarea
                                className="form-control"
                                rows={4}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)', resize: 'none' }}
                                value={feedbackForm.feedback}
                                onChange={e => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                                placeholder="e.g. Please update the resource with more recent case studies..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button className="btn" style={{ flex: 1, padding: '0.75rem' }} onClick={() => setIsFeedbackModalOpen(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 2, padding: '0.75rem' }}
                                disabled={loading || !feedbackForm.feedback.trim()}
                                onClick={() => handleAuditAction(feedbackForm.contentType, feedbackForm.contentId, false, feedbackForm.feedback)}
                            >
                                Submit Revision Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Unit Modal */}
            {isEditUnitModalOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        maxWidth: '500px', width: '90%', backgroundColor: 'var(--bg-main)',
                        padding: '2.5rem', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid var(--border)', position: 'relative'
                    }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>Edit Unit Configuration</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.925rem' }}>Update basic unit parameters and scoring configuration.</p>

                        <form onSubmit={handleUpdateUnit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Unit Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    required
                                    style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                    value={editUnitForm.name}
                                    onChange={e => setEditUnitForm({ ...editUnitForm, name: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Unit Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                        value={editUnitForm.code}
                                        onChange={e => setEditUnitForm({ ...editUnitForm, code: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Lessons Count</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                        value={editUnitForm.total_lessons}
                                        onChange={e => setEditUnitForm({ ...editUnitForm, total_lessons: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>CAT Total Points</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                        value={editUnitForm.cat_total_points}
                                        onChange={e => setEditUnitForm({ ...editUnitForm, cat_total_points: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Assignment Points</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        required
                                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid var(--border)', backgroundColor: 'var(--bg-alt)' }}
                                        value={editUnitForm.assessment_total_points}
                                        onChange={e => setEditUnitForm({ ...editUnitForm, assessment_total_points: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, padding: '0.875rem', borderRadius: '12px' }} onClick={() => setIsEditUnitModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '0.875rem', borderRadius: '12px' }} disabled={loading}>Update Unit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default HODDashboard;
