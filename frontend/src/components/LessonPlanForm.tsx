import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, Clock, BookOpen, Users, FileText, 
  Save, Send, Plus, Trash2, ArrowLeft, User, CheckCircle
} from 'lucide-react';

interface LessonPlanFormProps {
  unitId?: number;
  lessonId?: number;
  onClose?: () => void;
}

interface LessonPlanActivity {
  id?: number;
  time: string;
  activity: string;
  content: string;
  resources: string;
  references: string;
}

const LessonPlanForm: React.FC<LessonPlanFormProps> = ({ unitId, lessonId, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    unit: unitId ? String(unitId) : '',
    title: '',
    order: '1',
    week: '',
    session_date: '',
    session_start: '',
    session_end: '',
    session: 'Morning',
    topic: '',
    subtopic: '',
    learning_outcomes: '',
    content: '',
    is_lab: false,
  });

  const [activities, setActivities] = useState<LessonPlanActivity[]>([
    { time: '', activity: '', content: '', resources: '', references: '' }
  ]);

  const [isDraft, setIsDraft] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleActivityChange = (index: number, field: keyof LessonPlanActivity, value: string) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], [field]: value };
    setActivities(newActivities);
  };

  const addActivity = () => {
    setActivities([...activities, { time: '', activity: '', content: '', resources: '', references: '' }]);
  };

  const removeActivity = (index: number) => {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== index));
    }
  };

  const handleSaveDraft = async () => {
    await handleSubmit(true);
  };

  const handleSubmitForApproval = async () => {
    await handleSubmit(false);
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    setLoading(true);
    setError('');
    setSubmitted(false);

    try {
      const lessonData = {
        unit: parseInt(formData.unit as string),
        week: formData.week ? parseInt(formData.week) : null,
        order: parseInt(formData.order),
        session_date: formData.session_date || null,
        session_start: formData.session_start || null,
        session_end: formData.session_end || null,
        session: formData.session,
        topic: formData.topic,
        subtopic: formData.subtopic,
        learning_outcomes: formData.learning_outcomes,
        content: formData.content,
        is_lab: formData.is_lab,
        is_taught: !saveAsDraft,
        is_approved: false,
      };

      let lessonResponse;
      if (lessonId) {
        lessonResponse = await api.patch(`lessons/${lessonId}/`, lessonData);
      } else {
        lessonResponse = await api.post('lessons/', lessonData);
      }

      const lessonIdResult = lessonResponse.data.id;

      // Create lesson plan activities
      if (activities.length > 0 && activities[0].time) {
        for (const activity of activities) {
          if (activity.time && activity.activity) {
            await api.post('lesson-plan-activities/', {
              lesson: lessonIdResult,
              time: activity.time,
              activity: activity.activity,
              content: activity.content,
              resources: activity.resources,
              references: activity.references,
            });
          }
        }
      }

      if (saveAsDraft) {
        setIsDraft(true);
        alert('Lesson plan saved as draft!');
      } else {
        setIsDraft(false);
        setSubmitted(true);
        alert('Lesson plan submitted for HOD approval!');
      }

      if (onClose) {
        onClose();
      } else {
        navigate('/trainer');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save lesson plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      {onClose && (
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={20} /> Back
        </button>
      )}

      <div className="card-premium" style={{ padding: '2rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {lessonId ? 'Edit Lesson Plan' : 'Create Lesson Plan'}
          </h2>
          {submitted && !isDraft && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>
              <CheckCircle size={18} />
              Submitted for Approval
            </div>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Fill in the lesson plan details. Submit for HOD approval when ready.
        </p>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmitForApproval(); }}>
          {/* Session Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} /> Session Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Date</label>
                <input
                  type="date"
                  name="session_date"
                  value={formData.session_date}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Week</label>
                <input
                  type="number"
                  name="week"
                  value={formData.week}
                  onChange={handleChange}
                  placeholder="Week number"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Session</label>
                <select
                  name="session"
                  value={formData.session}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Lesson No.</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  min="1"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                />
              </div>
            </div>
          </div>

          {/* Time */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} /> Time
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Start Time</label>
                <input
                  type="time"
                  name="session_start"
                  value={formData.session_start}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>End Time</label>
                <input
                  type="time"
                  name="session_end"
                  value={formData.session_end}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                />
              </div>
            </div>
          </div>

          {/* Unit Information */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={20} /> Unit Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Unit *</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                >
                  <option value="">Select Unit</option>
                  {unitId && <option value={String(unitId)}>Selected Unit</option>}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                  <User size={16} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                  Trainer
                </label>
                <input
                  type="text"
                  value={user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || ''}
                  disabled
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-muted)', opacity: 0.7 }}
                />
              </div>
            </div>
          </div>

          {/* Topic */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Topic & Sub-topic</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Topic *</label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  required
                  placeholder="Main topic of the lesson"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Sub-topic</label>
                <input
                  type="text"
                  name="subtopic"
                  value={formData.subtopic}
                  onChange={handleChange}
                  placeholder="Sub-topic if any"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                />
              </div>
            </div>
          </div>

          {/* Learning Outcomes */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              By the end of this lesson, the learner should be able to:
            </h3>
            <textarea
              name="learning_outcomes"
              value={formData.learning_outcomes}
              onChange={handleChange}
              placeholder="1. Understand...&#10;2. Apply...&#10;3. Analyze..."
              rows={5}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', resize: 'vertical' }}
            />
          </div>

          {/* Lesson Plan Activities Table */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                <FileText size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Lesson Plan Activities
              </h3>
              <button
                type="button"
                onClick={addActivity}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px' }}
              >
                <Plus size={16} /> Add Activity
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-muted)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Time</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Learning Activity</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Lesson Content</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>Resources/Activities</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>References</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid var(--border)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => (
                    <tr key={index}>
                      <td style={{ padding: '0.5rem' }}>
                        <input
                          type="text"
                          value={activity.time}
                          onChange={(e) => handleActivityChange(index, 'time', e.target.value)}
                          placeholder="9:00-9:30"
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <textarea
                          value={activity.activity}
                          onChange={(e) => handleActivityChange(index, 'activity', e.target.value)}
                          placeholder="Learning activity..."
                          rows={2}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', resize: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <textarea
                          value={activity.content}
                          onChange={(e) => handleActivityChange(index, 'content', e.target.value)}
                          placeholder="Content..."
                          rows={2}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', resize: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <textarea
                          value={activity.resources}
                          onChange={(e) => handleActivityChange(index, 'resources', e.target.value)}
                          placeholder="Resources..."
                          rows={2}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', resize: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem' }}>
                        <textarea
                          value={activity.references}
                          onChange={(e) => handleActivityChange(index, 'references', e.target.value)}
                          placeholder="References..."
                          rows={2}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-card)', resize: 'none' }}
                        />
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeActivity(index)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f43f5e' }}
                          disabled={activities.length === 1}
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lesson Content */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Lesson Content / Notes</h3>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Enter lesson notes, lecture content..."
              rows={8}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-card)', resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', borderRadius: '8px' }}
              disabled={loading}
            >
              <Save size={18} /> Save as Draft
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none' }}
              disabled={loading}
            >
              <Send size={18} /> {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LessonPlanForm;
