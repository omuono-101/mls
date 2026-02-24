import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    MessageSquare, Plus, ChevronRight, Send, ArrowLeft,
    Clock, BookOpen
} from 'lucide-react';

interface ForumTopic {
    id: number;
    unit: number;
    unit_name: string;
    unit_code: string;
    title: string;
    description: string;
    created_at: string;
    created_by: number;
    created_by_name: string;
    message_count: number;
}

interface ForumMessage {
    id: number;
    topic: number;
    user: number;
    user_name: string;
    content: string;
    created_at: string;
}

interface Unit {
    id: number;
    name: string;
    code: string;
}

const Forum: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { topicId } = useParams<{ topicId?: string }>();

    const [topics, setTopics] = useState<ForumTopic[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [currentTopic, setCurrentTopic] = useState<ForumTopic | null>(null);
    const [messages, setMessages] = useState<ForumMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTopicTitle, setNewTopicTitle] = useState('');
    const [newTopicDescription, setNewTopicDescription] = useState('');
    const [newTopicUnit, setNewTopicUnit] = useState<number | ''>('');
    const [newMessage, setNewMessage] = useState('');
    const [showNewTopicForm, setShowNewTopicForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUnits();
        if (topicId) {
            fetchTopicAndMessages(parseInt(topicId));
        } else {
            fetchTopics();
        }
    }, [topicId]);

    const fetchUnits = async () => {
        try {
            const response = await api.get('units/');
            setUnits(response.data);
        } catch (error) {
            console.error('Failed to fetch units', error);
        }
    };

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const response = await api.get('forum-topics/');
            setTopics(response.data);
        } catch (error) {
            console.error('Failed to fetch forum topics', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTopicAndMessages = async (id: number) => {
        setLoading(true);
        try {
            const [topicRes, messagesRes] = await Promise.all([
                api.get(`forum-topics/${id}/`),
                api.get(`forum-messages/?topic=${id}`)
            ]);
            setCurrentTopic(topicRes.data);
            setMessages(messagesRes.data);
        } catch (error) {
            console.error('Failed to fetch topic and messages', error);
            navigate('/student?tab=forum');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTopicTitle || !newTopicUnit) return;

        setSubmitting(true);
        try {
            await api.post('forum-topics/', {
                title: newTopicTitle,
                description: newTopicDescription,
                unit: newTopicUnit
            });
            setNewTopicTitle('');
            setNewTopicDescription('');
            setNewTopicUnit('');
            setShowNewTopicForm(false);
            fetchTopics();
        } catch (error) {
            console.error('Failed to create topic', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage || !currentTopic) return;

        setSubmitting(true);
        try {
            await api.post('forum-messages/', {
                topic: currentTopic.id,
                content: newMessage
            });
            setNewMessage('');
            fetchTopicAndMessages(currentTopic.id);
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Topic List View
    if (!topicId) {
        return (
            <DashboardLayout>
                <div className="animate-fade-in">
                    <div style={{ marginBottom: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Discussion Forums</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Connect with peers and trainers in your unit channels.</p>
                        </div>
                        <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.75rem 1.5rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            onClick={() => setShowNewTopicForm(!showNewTopicForm)}
                        >
                            <Plus size={20} /> New Discussion
                        </button>
                    </div>

                    {showNewTopicForm && (
                        <div className="card-premium animate-fade-in" style={{ padding: '2rem', borderRadius: '28px', marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Start a New Discussion</h3>
                            <form onSubmit={handleCreateTopic}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Select Unit</label>
                                    <select
                                        value={newTopicUnit}
                                        onChange={(e) => setNewTopicUnit(e.target.value ? parseInt(e.target.value) : '')}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            fontSize: '1rem',
                                            background: 'white'
                                        }}
                                        required
                                    >
                                        <option value="">Select a unit...</option>
                                        {units.map(unit => (
                                            <option key={unit.id} value={unit.id}>{unit.code} - {unit.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Topic Title</label>
                                    <input
                                        type="text"
                                        value={newTopicTitle}
                                        onChange={(e) => setNewTopicTitle(e.target.value)}
                                        placeholder="Enter a descriptive title for your discussion"
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            fontSize: '1rem'
                                        }}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>Description (Optional)</label>
                                    <textarea
                                        value={newTopicDescription}
                                        onChange={(e) => setNewTopicDescription(e.target.value)}
                                        placeholder="Add more context to your discussion topic"
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            fontSize: '1rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? 'Creating...' : 'Create Topic'}
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn" 
                                        style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}
                                        onClick={() => setShowNewTopicForm(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="card-premium" style={{ padding: '0', overflow: 'hidden', borderRadius: '28px' }}>
                        {loading ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>
                                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
                            </div>
                        ) : topics.length > 0 ? (
                            topics.map((topic, idx) => (
                                <div
                                    key={topic.id}
                                    className="animate-fade-in"
                                    style={{
                                        padding: '2rem',
                                        borderBottom: idx === topics.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.03)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        background: 'white',
                                        transition: 'all 0.2s ease',
                                        animationDelay: `${idx * 0.05}s`
                                    }}
                                    onClick={() => navigate(`/student/forum/${topic.id}`)}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.paddingLeft = '2.5rem'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.paddingLeft = '2rem'; }}
                                >
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                        <div style={{ background: 'var(--primary-light)', padding: '1rem', borderRadius: '16px', color: 'var(--primary)' }}>
                                            <MessageSquare size={24} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>{topic.title}</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                                <span className="badge badge-primary">{topic.unit_code}</span>
                                                <span>Started by {topic.created_by_name}</span>
                                                <span>•</span>
                                                <span>{formatDate(topic.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ 
                                            background: 'rgba(0,0,0,0.05)', 
                                            color: 'var(--text-muted)', 
                                            padding: '0.5rem 1rem', 
                                            borderRadius: '20px', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 700 
                                        }}>
                                            {topic.message_count} {topic.message_count === 1 ? 'Reply' : 'Replies'}
                                        </div>
                                        <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                                <MessageSquare size={64} style={{ color: 'var(--text-muted)', opacity: 0.1, margin: '0 auto 2rem' }} />
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>No Discussion Topics Yet</h4>
                                <p className="text-muted" style={{ maxWidth: '400px', margin: '1rem auto' }}>
                                    Be the first to start a discussion! Click the "New Discussion" button to create a topic.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Topic Detail View (Messages)
    return (
        <DashboardLayout>
            <div className="animate-fade-in">
                <div style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate('/student?tab=forum')}
                        className="btn glass"
                        style={{ padding: '0.75rem', borderRadius: '50%', width: '45px', height: '45px', color: 'var(--text-main)', marginBottom: '1rem' }}
                    >
                        <ArrowLeft size={24} />
                    </button>
                    {currentTopic && (
                        <div className="card-premium" style={{ padding: '2rem', borderRadius: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <span className="badge badge-primary">{currentTopic.unit_code}</span>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    <BookOpen size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                                    {currentTopic.unit_name}
                                </span>
                            </div>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 900 }}>{currentTopic.title}</h1>
                            {currentTopic.description && (
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{currentTopic.description}</p>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                <span>Started by <strong>{currentTopic.created_by_name}</strong></span>
                                <span>•</span>
                                <span>{formatDate(currentTopic.created_at)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center' }}>
                            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
                        </div>
                    ) : messages.length > 0 ? (
                        messages.map((message, idx) => (
                            <div 
                                key={message.id} 
                                className="animate-fade-in"
                                style={{
                                    padding: '1.5rem',
                                    borderRadius: '20px',
                                    background: message.user === user?.id ? 'var(--primary-light)' : 'white',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    marginLeft: message.user === user?.id ? '3rem' : '0',
                                    marginRight: message.user === user?.id ? '0' : '3rem',
                                    animationDelay: `${idx * 0.05}s`
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '50%', 
                                        background: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '0.875rem'
                                    }}>
                                        {message.user_name[0].toUpperCase()}
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{message.user_name}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={12} />
                                        {formatDate(message.created_at)}
                                    </span>
                                </div>
                                <p style={{ lineHeight: 1.6, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{message.content}</p>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-main)', borderRadius: '20px' }}>
                            <MessageSquare size={48} style={{ color: 'var(--text-muted)', opacity: 0.2, margin: '0 auto 1rem' }} />
                            <p className="text-muted">No messages yet. Be the first to reply!</p>
                        </div>
                    )}
                </div>

                <div className="card-premium" style={{ padding: '1.5rem', borderRadius: '24px', position: 'sticky', bottom: '1rem' }}>
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Write your message..."
                                rows={2}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    fontSize: '1rem',
                                    resize: 'none',
                                    fontFamily: 'inherit'
                                }}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={submitting || !newMessage.trim()}
                            style={{ 
                                padding: '0.75rem 1.5rem', 
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                height: 'fit-content'
                            }}
                        >
                            <Send size={18} />
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Forum;
