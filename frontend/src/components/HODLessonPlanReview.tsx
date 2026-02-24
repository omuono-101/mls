import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { 
  CheckCircle, XCircle, Clock, Eye, FileText, 
  Calendar, User, BookOpen, AlertTriangle, Filter, X
} from 'lucide-react';

interface LessonPlan {
  id: number;
  title: string;
  unit: number;
  unit_name: string;
  unit_code: string;
  order: number;
  topic: string;
  subtopic: string;
  week: number | null;
  session_date: string | null;
  session_start: string | null;
  session_end: string | null;
  session: string;
  learning_outcomes: string;
  content: string;
  is_taught: boolean;
  is_approved: boolean;
  is_active: boolean;
  audit_feedback: string;
  trainer_name: string;
  plan_activities: {
    id: number;
    time: string;
    activity: string;
    content: string;
    resources: string;
    references: string;
  }[];
}

const HODLessonPlanReview: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    fetchLessonPlans();
  }, []);

  const fetchLessonPlans = async () => {
    try {
      const response = await api.get('lessons/?include_all=true');
      const submittedLessons = response.data.results || response.data;
      setLessons(submittedLessons.filter((l: LessonPlan) => l.is_taught));
    } catch (error) {
      console.error('Error fetching lesson plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (lessonId: number) => {
    setActionLoading(true);
    try {
      await api.patch(`lessons/${lessonId}/`, {
        is_approved: true,
        is_active: true,
        audit_feedback: feedback || 'Approved by HOD'
      });
      alert('Lesson plan approved!');
      setSelectedLesson(null);
      setFeedback('');
      fetchLessonPlans();
    } catch (error) {
      alert('Failed to approve lesson plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (lessonId: number) => {
    if (!feedback.trim()) {
      alert('Please provide feedback for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await api.patch(`lessons/${lessonId}/`, {
        is_approved: false,
        is_active: false,
        audit_feedback: feedback
      });
      alert('Lesson plan rejected!');
      setSelectedLesson(null);
      setFeedback('');
      fetchLessonPlans();
    } catch (error) {
      alert('Failed to reject lesson plan');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    if (filter === 'pending') return lesson.is_taught && !lesson.is_approved;
    if (filter === 'approved') return lesson.is_approved;
    if (filter === 'rejected') return lesson.is_taught && !lesson.is_approved && lesson.audit_feedback;
    return true;
  });

  const getStatusBadge = (lesson: LessonPlan) => {
    if (lesson.is_approved && lesson.is_active) {
      return <span style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Approved & Active</span>;
    }
    if (lesson.is_taught && !lesson.is_approved) {
      return <span style={{ background: '#f59e0b', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Pending Review</span>;
    }
    return <span style={{ background: '#6b7280', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>Draft</span>;
  };

  const getFilterIcon = () => {
    return <Filter size={16} />;
  };

  const renderLessonDetail = () => {
    if (!selectedLesson) return null;

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', maxWidth: '900px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedLesson.title}</h2>
              <p style={{ color: 'var(--text-muted)' }}>{selectedLesson.unit_code} - {selectedLesson.unit_name}</p>
            </div>
            <button onClick={() => setSelectedLesson(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {/* Session Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Week</p>
                <p style={{ fontWeight: 700 }}>{selectedLesson.week || 'N/A'}</p>
              </div>
              <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Date</p>
                <p style={{ fontWeight: 700 }}>{selectedLesson.session_date || 'N/A'}</p>
              </div>
              <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Session</p>
                <p style={{ fontWeight: 700 }}>{selectedLesson.session || 'N/A'}</p>
              </div>
              <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Time</p>
                <p style={{ fontWeight: 700 }}>{selectedLesson.session_start || 'N/A'} - {selectedLesson.session_end || 'N/A'}</p>
              </div>
              <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Trainer</p>
                <p style={{ fontWeight: 700 }}>{selectedLesson.trainer_name}</p>
              </div>
            </div>

            {/* Topic */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} /> Topic & Sub-topic
              </h3>
              <p><strong>Topic:</strong> {selectedLesson.topic || 'N/A'}</p>
              <p><strong>Sub-topic:</strong> {selectedLesson.subtopic || 'N/A'}</p>
            </div>

            {/* Learning Outcomes */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>By the end of this lesson, the learner should be able to:</h3>
              <div style={{ background: 'var(--bg-muted)', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                {selectedLesson.learning_outcomes || 'No learning outcomes specified'}
              </div>
            </div>

            {/* Lesson Plan Activities */}
            {selectedLesson.plan_activities && selectedLesson.plan_activities.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Lesson Plan Activities</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-muted)' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Time</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Activity</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Content</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Resources</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>References</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLesson.plan_activities.map((activity, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem' }}>{activity.time}</td>
                          <td style={{ padding: '0.75rem' }}>{activity.activity}</td>
                          <td style={{ padding: '0.75rem' }}>{activity.content}</td>
                          <td style={{ padding: '0.75rem' }}>{activity.resources}</td>
                          <td style={{ padding: '0.75rem' }}>{activity.references}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Feedback Section */}
            {!selectedLesson.is_approved && (
              <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} /> Quality Assurance Feedback
                </h3>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter feedback for the trainer (required for rejection, optional for approval)..."
                  rows={4}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', resize: 'vertical', marginBottom: '1rem' }}
                />
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleReject(selectedLesson.id)}
                    disabled={actionLoading || !feedback.trim()}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem', 
                      background: '#f43f5e', color: 'white', border: 'none',
                      padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer',
                      opacity: actionLoading ? 0.7 : 1
                    }}
                  >
                    <XCircle size={18} /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedLesson.id)}
                    disabled={actionLoading}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.5rem', 
                      background: '#10b981', color: 'white', border: 'none',
                      padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer',
                      opacity: actionLoading ? 0.7 : 1
                    }}
                  >
                    <CheckCircle size={18} /> Approve
                  </button>
                </div>
              </div>
            )}

            {selectedLesson.is_approved && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                <p style={{ fontWeight: 600, color: '#10b981' }}>✓ This lesson plan has been approved</p>
                {selectedLesson.audit_feedback && <p style={{ marginTop: '0.5rem' }}>Feedback: {selectedLesson.audit_feedback}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Quality Assurance - Lesson Plans</h1>
          <p style={{ color: 'var(--text-muted)' }}>Review and approve trainer lesson plans before they become visible to students</p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                background: filter === f ? 'var(--primary)' : 'var(--bg-muted)',
                color: filter === f ? 'white' : 'var(--text-main)',
                fontWeight: 600,
                textTransform: 'capitalize',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {f === 'pending' && <Clock size={16} />}
              {f === 'approved' && <CheckCircle size={16} />}
              {f === 'rejected' && <XCircle size={16} />}
              {f === 'all' && getFilterIcon()}
              {f}
            </button>
          ))}
        </div>

        {/* Lesson Plans List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
          </div>
        ) : filteredLessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No lesson plans found</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredLessons.map((lesson) => (
              <div 
                key={lesson.id}
                className="card-premium"
                style={{ padding: '1.5rem', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s' }}
                onClick={() => setSelectedLesson(lesson)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{lesson.title}</h3>
                      {getStatusBadge(lesson)}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      {lesson.unit_code} - {lesson.unit_name} | Lesson {lesson.order}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      <User size={14} style={{ marginRight: '0.25rem' }} /> {lesson.trainer_name} | 
                      <Calendar size={14} style={{ margin: '0 0.25rem 0 0.5rem' }} /> {lesson.session_date || 'Date not set'} | 
                      <Clock size={14} style={{ margin: '0 0.25rem 0 0.5rem' }} /> {lesson.session_start || 'N/A'}
                    </p>
                  </div>
                  <Eye size={20} style={{ color: 'var(--text-muted)' }} />
                </div>
                {lesson.topic && (
                  <p style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <strong>Topic:</strong> {lesson.topic}
                    {lesson.subtopic && <> | <strong>Sub-topic:</strong> {lesson.subtopic}</>}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {renderLessonDetail()}
      </div>
    </DashboardLayout>
  );
};

export default HODLessonPlanReview;
