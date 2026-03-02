import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    BookOpen, Users, ClipboardList, UserCheck, Plus, X,
    Calendar, Edit2, Trash2, Eye, CheckCircle, Clock, FileText
} from 'lucide-react';
import LessonPlanList from '../components/LessonPlanList';
import LessonPlanForm from '../components/LessonPlanForm';

interface Unit {
    id: number;
    name: string;
    code: string;
    course_group: number;
    trainer?: number;
}

interface Student {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
}

interface StudentEnrollment {
    id: number;
    student: number;
    student_name: string;
    student_email: string;
    course_group: number;
    course_group_display: string;
    course_name: string;
    student_details?: Student;
}

interface Assessment {
    id: number;
    unit: number;
    unit_name: string;
    assessment_type: string;
    title?: string;
    points: number;
    due_date: string;
    lesson?: number;
}

interface Submission {
    id: number;
    student: number;
    student_name: string;
    assessment: number;
    assessment_name: string;
    grade: number | null;
    feedback: string;
    submitted_at: string;
}

interface Lesson {
    id: number;
    unit: number;
    unit_name?: string;
    unit_code?: string;
    title: string;
    order: number;
    topic?: string;
    subtopic?: string;
    week?: number;
    session_date?: string;
    session_start?: string;
    session_end?: string;
    session?: string;
    is_taught: boolean;
    is_approved: boolean;
    is_active: boolean;
    audit_feedback?: string;
    trainer_name?: string;
    trainer?: number;
    is_lab: boolean;
}

interface Attendance {
    id: number;
    lesson: number;
    student: number;
    student_name: string;
    status: 'Present' | 'Absent' | 'Late';
}

const EnhancedTrainerDashboard: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'assessments' | 'submissions' | 'attendance' | 'lesson-plans'>('overview');

    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/students')) setActiveTab('students');
        else if (path.includes('/assessments')) setActiveTab('assessments');
        else if (path.includes('/submissions')) setActiveTab('submissions');
        else if (path.includes('/attendance')) setActiveTab('attendance');
        else if (path.includes('/lesson-plans')) setActiveTab('lesson-plans');
        else setActiveTab('overview');
    }, [location]);

    // Data states
    const [units, setUnits] = useState<Unit[]>([]);
    const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    // Note: attendance data is fetched but currently unused in this view
    const [, setAttendances] = useState<Attendance[]>([]);

    // Modal states
    const [showAssessmentModal, setShowAssessmentModal] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showEditAssessmentModal, setShowEditAssessmentModal] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
    const [showLessonPlanModal, setShowLessonPlanModal] = useState(false);
    const [selectedLessonPlan, setSelectedLessonPlan] = useState<number | undefined>(undefined);

    // Form states
    const [assessmentForm, setAssessmentForm] = useState({
        unit: '',
        assessment_type: 'CAT',
        points: 20,
        due_date: '',
        lesson: ''
    });

    const [attendanceRecords, setAttendanceRecords] = useState<Record<number, string>>({});
    const [markingResults, setMarkingResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Report states
    const [reportData, setReportData] = useState<any[]>([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportTitle, setReportTitle] = useState('');

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const [unitsRes, enrollmentsRes, assessmentsRes, submissionsRes, lessonsRes, attendanceRes] = await Promise.all([
                api.get('units/'),
                api.get('student-enrollments/'),
                api.get('assessments/'),
                api.get('submissions/'),
                api.get('lessons/'),
                api.get('attendance/')
            ]);

            setUnits(unitsRes.data.filter((u: Unit) => u.trainer == user?.id));
            setEnrollments(enrollmentsRes.data);
            setAssessments(assessmentsRes.data);
            setSubmissions(submissionsRes.data);
            setLessons(lessonsRes.data);
            setAttendances(attendanceRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    };

    const handleViewReport = async (lessonId?: number, assessmentId?: number, title?: string) => {
        setReportLoading(true);
        setReportTitle(title || 'Attendance Report');
        setShowReportModal(true);
        try {
            const params = lessonId ? `lesson_id=${lessonId}` : `assessment_id=${assessmentId}`;
            const response = await api.get(`attendance/attendance_report/?${params}`);
            setReportData(response.data);
        } catch (error) {
            console.error('Failed to fetch report', error);
            alert('Failed to fetch report');
        } finally {
            setReportLoading(false);
        }
    };

    const handleCreateAssessment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('assessments/', assessmentForm);
            alert('Assessment created successfully');
            setShowAssessmentModal(false);
            setAssessmentForm({ unit: '', assessment_type: 'CAT', points: 20, due_date: '', lesson: '' });
            fetchData();
        } catch (error) {
            console.error('Failed to create assessment', error);
            alert('Failed to create assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAssessment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssessment) return;
        setLoading(true);
        try {
            await api.patch(`assessments/${selectedAssessment.id}/`, {
                points: assessmentForm.points,
                due_date: assessmentForm.due_date
            });
            alert('Assessment updated successfully');
            setShowEditAssessmentModal(false);
            fetchData();
        } catch (error) {
            console.error('Failed to update assessment', error);
            alert('Failed to update assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAssessment = async (id: number) => {
        if (!confirm('Are you sure you want to delete this assessment?')) return;
        setLoading(true);
        try {
            await api.delete(`assessments/${id}/`);
            alert('Assessment deleted successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to delete assessment', error);
            alert('Failed to delete assessment');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async () => {
        if (!selectedLesson) return;
        setLoading(true);
        try {
            const attendanceData = Object.entries(attendanceRecords).map(([studentId, status]) => ({
                lesson: selectedLesson.id,
                student: parseInt(studentId),
                status,
            }));

            const response = await api.post('attendance/bulk_mark/', { records: attendanceData });
            setMarkingResults(response.data);
            alert('Attendance marked successfully');
            // Don't close immediately, show the summary table
            // setShowAttendanceModal(false); 
            // setAttendanceRecords({});
            fetchData();
        } catch (error) {
            console.error('Failed to mark attendance', error);
            alert('Failed to mark attendance');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAutoMark = async () => {
        if (!selectedLesson) return;
        setLoading(true);
        try {
            const response = await api.post('attendance/bulk_auto_mark/', { lesson_id: selectedLesson.id });
            setMarkingResults(response.data);
            alert('Bulk attendance (Auto-Present) marked successfully');
            fetchData();
        } catch (error) {
            console.error('Failed to auto-mark attendance', error);
            alert('Failed to auto-mark attendance');
        } finally {
            setLoading(false);
        }
    };

    const trainerUnits = units.filter(u => u.trainer == user?.id);
    const trainerCourseGroups = [...new Set(trainerUnits.map(u => u.course_group))];
    const studentsInTrainerCourses = enrollments.filter(e => trainerCourseGroups.includes(e.course_group));
    const trainerAssessments = assessments.filter(a => trainerUnits.some(u => u.id === a.unit));
    const trainerSubmissions = submissions.filter(s =>
        trainerAssessments.some(a => a.id === s.assessment)
    );

    return (
        <DashboardLayout>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>Trainer Portal</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Comprehensive management for your units, students, and assessments.</p>
                </div>
                <button
                    className="btn"
                    onClick={() => navigate('/trainer/authoring')}
                    style={{ background: 'var(--bg-main)', border: '1px solid var(--border)' }}
                >
                    <BookOpen size={20} /> Course Authoring
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="card" style={{ padding: 0, marginBottom: '2rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }} className="scroll-x-auto">
                    {[
                        { key: 'overview', label: 'Overview', icon: <BookOpen size={18} /> },
                        { key: 'students', label: 'Students', icon: <Users size={18} /> },
                        { key: 'assessments', label: 'Assessments', icon: <ClipboardList size={18} /> },
                        { key: 'lesson-plans', label: 'Lesson Plans', icon: <FileText size={18} /> },
                        { key: 'submissions', label: 'Submissions', icon: <Edit2 size={18} /> },
                        { key: 'attendance', label: 'Attendance', icon: <UserCheck size={18} /> }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => {
                                if (tab.key === 'overview') navigate('/trainer');
                                else navigate(`/trainer/${tab.key}`);
                            }}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                background: activeTab === tab.key ? 'var(--primary)' : 'transparent',
                                color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                                minWidth: '120px'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div>
                    <div className="grid-responsive" style={{ marginBottom: '2rem' }}>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '12px' }}>
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Assigned Units</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{trainerUnits.length}</p>
                            </div>
                        </div>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: '#dbeafe', color: '#1e40af', borderRadius: '12px' }}>
                                <Users size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Students</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{studentsInTrainerCourses.length}</p>
                            </div>
                        </div>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#92400e', borderRadius: '12px' }}>
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Assessments</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{trainerAssessments.length}</p>
                            </div>
                        </div>
                        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '12px' }}>
                                <Edit2 size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Pending Grading</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {trainerSubmissions.filter(s => s.grade === null).length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>My Units</h2>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {trainerUnits.map(unit => (
                                <div key={unit.id} className="glass" style={{ padding: '1rem', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{unit.code}: {unit.name}</h3>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                                {lessons.filter(l => l.unit === unit.id).length} Lessons |
                                                {' '}{assessments.filter(a => a.unit === unit.id).length} Assessments
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Lesson Plans Tab */}
            {activeTab === 'lesson-plans' && (
                <div className="animate-fade-in">
                    <LessonPlanList
                        onCreateNew={() => {
                            setSelectedLessonPlan(undefined);
                            setShowLessonPlanModal(true);
                        }}
                        onEdit={(lesson) => {
                            setSelectedLessonPlan(lesson.id);
                            setShowLessonPlanModal(true);
                        }}
                        onView={(lesson) => {
                            setSelectedLessonPlan(lesson.id);
                            setShowLessonPlanModal(true);
                        }}
                    />
                </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Enrolled Students</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Students enrolled in your course groups
                        </p>
                    </div>
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-main)', fontSize: '0.875rem', fontWeight: 600 }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Student Name</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Email</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Course</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Group</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentsInTrainerCourses.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            No students enrolled yet
                                        </td>
                                    </tr>
                                ) : (
                                    studentsInTrainerCourses.map(enrollment => (
                                        <tr key={enrollment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{enrollment.student_name}</td>
                                            <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{enrollment.student_email}</td>
                                            <td style={{ padding: '1rem 1.5rem' }}>{enrollment.course_name}</td>
                                            <td style={{ padding: '1rem 1.5rem' }}>{enrollment.course_group_display}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Assessments Tab */}
            {activeTab === 'assessments' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowAssessmentModal(true)}
                        >
                            <Plus size={20} />
                            Create Assessment
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-main)', fontSize: '0.875rem', fontWeight: 600 }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Type</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Unit</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Points</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Due Date</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trainerAssessments.map(assessment => (
                                    <tr key={assessment.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: assessment.assessment_type === 'CAT' ? '#dbeafe' : '#fef3c7',
                                                color: assessment.assessment_type === 'CAT' ? '#1e40af' : '#92400e'
                                            }}>
                                                {assessment.assessment_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{assessment.unit_name}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>{assessment.points} pts</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                                                {new Date(assessment.due_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                    onClick={() => navigate(`/trainer/grade/${assessment.id}`)}
                                                >
                                                    <ClipboardList size={16} />
                                                    Grade Submissions
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={() => {
                                                        setSelectedAssessment(assessment);
                                                        setAssessmentForm({
                                                            unit: assessment.unit.toString(),
                                                            assessment_type: assessment.assessment_type,
                                                            points: assessment.points,
                                                            due_date: assessment.due_date.split('T')[0],
                                                            lesson: assessment.lesson?.toString() || ''
                                                        });
                                                        setShowEditAssessmentModal(true);
                                                    }}
                                                    style={{ fontSize: '0.75rem', padding: '0.5rem', background: '#fef3c7', color: '#92400e' }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={() => navigate(`/trainer/assessment/${assessment.id}/author`)}
                                                    style={{ fontSize: '0.75rem', padding: '0.5rem', background: '#dcfce7', color: '#166534' }}
                                                    title="Manage Questions"
                                                >
                                                    <ClipboardList size={16} />
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={() => handleDeleteAssessment(assessment.id)}
                                                    style={{ fontSize: '0.75rem', padding: '0.5rem', background: '#fee2e2', color: '#991b1b' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Student Submissions</h2>
                    </div>
                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'var(--bg-main)', fontSize: '0.875rem', fontWeight: 600 }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Student</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Assessment</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Submitted</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left' }}>Grade</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {trainerSubmissions.map(submission => (
                                    <tr key={submission.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{submission.student_name}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>{submission.assessment_name}</td>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                            {new Date(submission.submitted_at).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                                            {submission.grade !== null ? `${submission.grade}%` : '-'}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                {submission.grade !== null ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#d1fae5', color: '#065f46' }}>
                                                        <CheckCircle size={12} /> Graded
                                                    </span>
                                                ) : (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>
                                                        <Clock size={12} /> Pending
                                                    </span>
                                                )}
                                                <button className="btn btn-sm" onClick={() => alert('View submission details')} title="View Details">
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Attendance Tab */}
            {
                activeTab === 'attendance' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAttendanceModal(true)}
                            >
                                <Plus size={20} />
                                Mark Manual Attendance
                            </button>
                        </div>

                        <div className="grid-responsive" style={{ gap: '2rem' }}>
                            <div className="card">
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                                    Lesson Attendance
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {lessons.filter(l => units.some(u => u.id === l.unit)).map(lesson => (
                                        <div key={lesson.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{lesson.title}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lesson Order: {lesson.order}</p>
                                            </div>
                                            <button className="btn btn-sm glass" onClick={() => handleViewReport(lesson.id, undefined, `Attendance: ${lesson.title}`)}>
                                                <Eye size={16} /> View List
                                            </button>
                                        </div>
                                    ))}
                                    {lessons.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No lessons available.</p>}
                                </div>
                            </div>

                            <div className="card">
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ClipboardList size={20} style={{ color: 'var(--primary)' }} />
                                    Assessment Attendance & Results
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {assessments.filter(a => units.some(u => u.id === a.unit)).map(assessment => (
                                        <div key={assessment.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{assessment.title || `${assessment.assessment_type} Assessment`}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{assessment.assessment_type} • Due {new Date(assessment.due_date).toLocaleDateString()}</p>
                                            </div>
                                            <button className="btn btn-sm glass" onClick={() => handleViewReport(undefined, assessment.id, `Results: ${assessment.title || assessment.assessment_type}`)}>
                                                <Eye size={16} /> View Results
                                            </button>
                                        </div>
                                    ))}
                                    {assessments.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No assessments available.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Attendance Report Modal */}
            {
                showReportModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        backdropFilter: 'blur(5px)'
                    }}>
                        <div className="card animate-fade-in" style={{
                            width: '100%',
                            maxWidth: '800px',
                            maxHeight: '90vh',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative'
                        }}>
                            <button
                                onClick={() => setShowReportModal(false)}
                                style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>{reportTitle}</h2>

                            {reportLoading ? (
                                <div style={{ padding: '4rem', textAlign: 'center' }}>Loading report...</div>
                            ) : (
                                <div className="table-responsive" style={{ flex: 1 }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: 'var(--bg-main)', position: 'sticky', top: 0 }}>
                                            <tr>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Student</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                                <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                                                {reportData.some(r => r.grade !== undefined) && (
                                                    <>
                                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Grade</th>
                                                        <th style={{ padding: '1rem', textAlign: 'left' }}>Submitted At</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.map((record, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{record.student_name}</td>
                                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{record.email}</td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            background: record.status === 'Present' ? '#d1fae5' : '#fee2e2',
                                                            color: record.status === 'Present' ? '#065f46' : '#991b1b'
                                                        }}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                    {record.grade !== undefined && (
                                                        <>
                                                            <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>
                                                                {record.grade !== null ? `${record.grade}%` : '-'}
                                                            </td>
                                                            <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                                {record.submitted_at ? new Date(record.submitted_at).toLocaleString() : '-'}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Create Assessment Modal */}
            {
                showAssessmentModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}>
                        <div className="card animate-fade-in" style={{
                            width: '100%',
                            maxWidth: '500px',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                            <button
                                onClick={() => setShowAssessmentModal(false)}
                                style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create Assessment</h2>

                            <form onSubmit={handleCreateAssessment}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Unit</label>
                                    <select
                                        className="input"
                                        required
                                        value={assessmentForm.unit}
                                        onChange={e => setAssessmentForm({ ...assessmentForm, unit: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Select Unit</option>
                                        {trainerUnits.map(unit => (
                                            <option key={unit.id} value={unit.id}>{unit.code}: {unit.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Assessment Type</label>
                                    <select
                                        className="input"
                                        required
                                        value={assessmentForm.assessment_type}
                                        onChange={e => setAssessmentForm({ ...assessmentForm, assessment_type: e.target.value })}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="CAT">CAT (Continuous Assessment Test)</option>
                                        <option value="Test">Test</option>
                                        <option value="Assignment">Assignment</option>
                                        <option value="LabTask">Lab Task</option>
                                        <option value="LessonAssessment">Lesson Assessment</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Points</label>
                                    <input
                                        type="number"
                                        className="input"
                                        required
                                        value={assessmentForm.points}
                                        onChange={e => setAssessmentForm({ ...assessmentForm, points: parseInt(e.target.value) })}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Due Date</label>
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        required
                                        value={assessmentForm.due_date}
                                        onChange={e => setAssessmentForm({ ...assessmentForm, due_date: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setShowAssessmentModal(false)}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ flex: 1, justifyContent: 'center' }}
                                        disabled={loading}
                                    >
                                        {loading ? 'Creating...' : 'Create Assessment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Assessment Modal */}
            {
                showEditAssessmentModal && selectedAssessment && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}>
                        <div className="card animate-fade-in" style={{
                            width: '100%',
                            maxWidth: '500px',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                            <button
                                onClick={() => setShowEditAssessmentModal(false)}
                                style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Edit Assessment</h2>

                            <form onSubmit={handleUpdateAssessment}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Points</label>
                                    <input
                                        type="number"
                                        className="input"
                                        required
                                        value={assessmentForm.points}
                                        onChange={e => setAssessmentForm({ ...assessmentForm, points: parseInt(e.target.value) })}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Due Date</label>
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        required
                                        value={assessmentForm.due_date}
                                        onChange={e => setAssessmentForm({ ...assessmentForm, due_date: e.target.value })}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setShowEditAssessmentModal(false)}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        style={{ flex: 1, justifyContent: 'center' }}
                                        disabled={loading}
                                    >
                                        {loading ? 'Updating...' : 'Update Assessment'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Mark Attendance Modal */}
            {
                showAttendanceModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        backdropFilter: 'blur(5px)'
                    }}>
                        <div className="card animate-fade-in" style={{
                            width: '100%',
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                            <button
                                onClick={() => {
                                    setShowAttendanceModal(false);
                                    setSelectedLesson(null);
                                    setAttendanceRecords({});
                                }}
                                style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>

                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Mark Attendance</h2>

                            {markingResults.length > 0 ? (
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#10b981' }}>
                                        <CheckCircle size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                                        Marking Summary
                                    </h3>
                                    <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ background: 'var(--bg-main)', fontSize: '0.875rem' }}>
                                                <tr>
                                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Student</th>
                                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {markingResults.map((res, i) => (
                                                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{res.student_name}</td>
                                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                            <span style={{
                                                                padding: '0.2rem 0.5rem',
                                                                borderRadius: '4px',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 700,
                                                                background: res.status === 'Present' ? '#dcfce7' : res.status === 'Late' ? '#fef3c7' : '#fee2e2',
                                                                color: res.status === 'Present' ? '#15803d' : res.status === 'Late' ? '#92400e' : '#991b1b'
                                                            }}>
                                                                {res.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setShowAttendanceModal(false);
                                            setSelectedLesson(null);
                                            setAttendanceRecords({});
                                            setMarkingResults([]);
                                        }}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : !selectedLesson ? (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Select Lesson</label>
                                    <select
                                        className="input"
                                        onChange={e => {
                                            const lesson = lessons.find(l => l.id === parseInt(e.target.value));
                                            setSelectedLesson(lesson || null);
                                        }}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="">Choose a lesson...</option>
                                        {lessons.filter(l => trainerUnits.some(u => u.id === l.unit)).map(lesson => (
                                            <option key={lesson.id} value={lesson.id}>
                                                Lesson {lesson.order}: {lesson.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                                            {selectedLesson.title}
                                        </h3>
                                        <button
                                            className="btn btn-sm"
                                            style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                                            onClick={handleBulkAutoMark}
                                            disabled={loading}
                                        >
                                            Mark All Present
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {studentsInTrainerCourses.map(enrollment => (
                                            <div key={enrollment.student} className="glass" style={{ padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 600 }}>{enrollment.student_name}</span>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {['Present', 'Late', 'Absent'].map(status => (
                                                        <button
                                                            key={status}
                                                            onClick={() => setAttendanceRecords({
                                                                ...attendanceRecords,
                                                                [enrollment.student]: status
                                                            })}
                                                            style={{
                                                                padding: '0.5rem 1rem',
                                                                borderRadius: '6px',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                background: attendanceRecords[enrollment.student] === status
                                                                    ? status === 'Present' ? '#10b981' : status === 'Late' ? '#f59e0b' : '#ef4444'
                                                                    : 'var(--bg-main)',
                                                                color: attendanceRecords[enrollment.student] === status ? 'white' : 'var(--text-main)'
                                                            }}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                                        <button
                                            className="btn"
                                            onClick={() => {
                                                setSelectedLesson(null);
                                                setAttendanceRecords({});
                                            }}
                                            style={{ flex: 1, justifyContent: 'center' }}
                                        >
                                            Back
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleMarkAttendance}
                                            style={{ flex: 1, justifyContent: 'center' }}
                                            disabled={Object.keys(attendanceRecords).length === 0 || loading}
                                        >
                                            {loading ? 'Saving...' : 'Save Attendance'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
            {/* Lesson Plan Modal */}
            {
                showLessonPlanModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        padding: '2rem',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            background: 'var(--bg-main)',
                            borderRadius: '20px',
                            width: '100%',
                            maxWidth: '1000px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                        }}>
                            <button
                                onClick={() => {
                                    setShowLessonPlanModal(false);
                                    setSelectedLessonPlan(undefined);
                                }}
                                style={{
                                    position: 'absolute',
                                    top: '1.5rem',
                                    right: '1.5rem',
                                    background: 'var(--bg-muted)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    color: 'var(--text-main)'
                                }}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ padding: '1rem' }}>
                                <LessonPlanForm
                                    lessonId={selectedLessonPlan}
                                    onClose={() => {
                                        setShowLessonPlanModal(false);
                                        setSelectedLessonPlan(undefined);
                                        fetchData(); // Refresh overview data if needed
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </DashboardLayout >
    );
};

export default EnhancedTrainerDashboard;
