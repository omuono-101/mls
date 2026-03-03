import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ResourceViewer from '../components/ResourceViewer';
import api from '../services/api';
import {
    FileText, Video, Link as LinkIcon, Search,
    Download, Eye,
    Layers, Grid, List, FolderOpen
} from 'lucide-react';

interface Resource {
    id: number;
    title: string;
    resource_type: string;
    file?: string;
    url?: string;
    description?: string;
    lesson: number;
    lesson_title?: string;
    unit_name?: string;
    unit_code?: string;
    created_at?: string;
}

const MyResources: React.FC = () => {
    const [allResources, setAllResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'PDF' | 'Video' | 'PPT' | 'Link' | 'Recent'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const response = await api.get('resources/');
            const resourcesData = response.data.results || response.data;
            setAllResources(resourcesData);
        } catch (error) {
            console.error('Failed to fetch resources', error);
        } finally {
            setLoading(false);
        }
    };

    const isNewResource = (dateStr?: string) => {
        if (!dateStr) return false;
        const resourceDate = new Date(dateStr);
        const now = new Date();
        const diffHours = (now.getTime() - resourceDate.getTime()) / (1000 * 60 * 60);
        return diffHours < 48; // New if within 48 hours
    };

    // Filter resources
    const filteredResources = allResources.filter((resource: Resource) => {
        const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterType === 'Recent') {
            return matchesSearch && isNewResource(resource.created_at);
        }

        const matchesType = filterType === 'all' || resource.resource_type === filterType;
        return matchesSearch && matchesType;
    });

    // Group resources by unit
    const getResourcesByUnit = () => {
        const grouped: Record<string, Resource[]> = {};
        filteredResources.forEach((resource: Resource) => {
            const key = resource.unit_name || 'Unknown Unit';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(resource);
        });
        return grouped;
    };

    const getResourceIcon = (type: string) => {
        switch (type) {
            case 'PDF':
                return <FileText size={20} />;
            case 'Video':
                return <Video size={20} />;
            case 'PPT':
                return <FileText size={20} />;
            case 'Link':
                return <LinkIcon size={20} />;
            default:
                return <FileText size={20} />;
        }
    };

    const getResourceColor = (type: string) => {
        switch (type) {
            case 'PDF':
                return '#f43f5e';
            case 'Video':
                return '#8b5cf6';
            case 'PPT':
                return '#f59e0b';
            case 'Link':
                return 'var(--primary)';
            default:
                return 'var(--text-muted)';
        }
    };

    const handleDownload = (resource: Resource) => {
        if (resource.file) {
            const link = document.createElement('a');
            link.href = resource.file;
            link.download = resource.title;
            link.click();
        }
    };

    const groupedResources = getResourcesByUnit();

    return (
        <DashboardLayout>
            <div className="animate-fade-in" style={{
                minHeight: '100%',
                background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(99, 102, 241, 0.05) 100%)',
                padding: '1rem',
                margin: '-1rem',
                borderRadius: 'inherit'
            }}>
                <div style={{ marginBottom: '3rem', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '-20px',
                        width: '100px',
                        height: '100px',
                        background: 'var(--primary)',
                        filter: 'blur(80px)',
                        opacity: 0.15,
                        zIndex: 0
                    }} />
                    <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
                        Resource <span style={{ color: 'var(--primary)' }}>Hub</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', fontWeight: 500 }}>
                        Your centralized library of approved learning materials, sorted by module and relevance.
                    </p>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="card-premium" style={{
                        padding: '1.5rem',
                        borderRadius: '24px',
                        background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)',
                        border: '1px solid rgba(0,0,0,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '16px' }}>
                            <Layers size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{allResources.length}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.25rem' }}>Total Files</div>
                        </div>
                    </div>
                    <div className="card-premium" style={{
                        padding: '1.5rem',
                        borderRadius: '24px',
                        background: 'linear-gradient(to bottom right, #ffffff, #fff5f5)',
                        border: '1px solid rgba(0,0,0,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', borderRadius: '16px' }}>
                            <FileText size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{allResources.filter(r => r.resource_type === 'PDF').length}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.25rem' }}>Documents</div>
                        </div>
                    </div>
                    <div className="card-premium" style={{
                        padding: '1.5rem',
                        borderRadius: '24px',
                        background: 'linear-gradient(to bottom right, #ffffff, #f5f3ff)',
                        border: '1px solid rgba(0,0,0,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '16px' }}>
                            <Video size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{allResources.filter(r => r.resource_type === 'Video').length}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.25rem' }}>Lectures</div>
                        </div>
                    </div>
                    <div className="card-premium" style={{
                        padding: '1.5rem',
                        borderRadius: '24px',
                        background: 'linear-gradient(to bottom right, #ffffff, #fffbeb)',
                        border: '1px solid rgba(0,0,0,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '16px' }}>
                            <Star size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>{allResources.filter(r => isNewResource(r.created_at)).length}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.25rem' }}>Fresh Content</div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '3rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    background: 'white',
                    padding: '0.75rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                        <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }} />
                        <input
                            type="text"
                            placeholder="Find resources by title or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.875rem 1rem 0.875rem 3.5rem',
                                width: '100%',
                                border: 'none',
                                background: 'transparent',
                                fontSize: '1rem',
                                outline: 'none',
                                fontWeight: 500
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '14px' }}>
                        {(['all', 'Recent', 'PDF', 'Video', 'PPT', 'Link'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '11px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    background: filterType === type ? 'var(--primary)' : 'transparent',
                                    color: filterType === type ? 'white' : 'var(--text-muted)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: filterType === type ? '0 10px 15px -3px rgba(99, 102, 241, 0.3)' : 'none'
                                }}
                            >
                                {type === 'all' ? 'All' : type}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '14px' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '0.6rem',
                                borderRadius: '11px',
                                background: viewMode === 'grid' ? 'white' : 'transparent',
                                border: 'none',
                                color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <Grid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '0.6rem',
                                borderRadius: '11px',
                                background: viewMode === 'list' ? 'white' : 'transparent',
                                border: 'none',
                                color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>

                {/* Resources by Unit */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
                    </div>
                ) : filteredResources.length === 0 ? (
                    <div className="card-premium" style={{ padding: '4rem', borderRadius: '24px', textAlign: 'center' }}>
                        <FolderOpen size={48} style={{ color: 'var(--text-muted)', opacity: 0.2, margin: '0 auto 1rem' }} />
                        <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>No Resources Found</h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {searchTerm || filterType !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Resources from your enrolled units will appear here'}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {Object.entries(groupedResources).map(([unitName, resources]) => (
                            <div key={unitName} style={{
                                background: 'rgba(255,255,255,0.4)',
                                padding: '1.5rem',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.6)',
                                backdropFilter: 'blur(10px)',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '0.6rem', background: 'var(--primary)', color: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)' }}>
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>{unitName}</h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{resources.length} resources available</span>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                    {resources.map((resource) => (
                                        <div
                                            key={resource.id}
                                            className="glass hover-scale"
                                            style={{
                                                padding: '1.25rem',
                                                borderRadius: '16px',
                                                border: '1px solid rgba(0,0,0,0.05)',
                                                cursor: 'pointer',
                                                background: 'white',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                            }}
                                        >
                                            {isNewResource(resource.created_at) && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '12px',
                                                    right: '-32px',
                                                    background: 'linear-gradient(to right, #f43f5e, #e11d48)',
                                                    color: 'white',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 900,
                                                    padding: '4px 35px',
                                                    transform: 'rotate(45deg)',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                    zIndex: 2
                                                }}>
                                                    NEW!
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                                <div style={{
                                                    background: `${getResourceColor(resource.resource_type)}15`,
                                                    padding: '0.75rem',
                                                    borderRadius: '12px',
                                                    color: getResourceColor(resource.resource_type),
                                                    display: 'flex',
                                                    flexShrink: 0
                                                }}>
                                                    {getResourceIcon(resource.resource_type)}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                                                        {resource.title}
                                                    </h4>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                        {resource.lesson_title}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => setSelectedResource(resource)}
                                                    className="btn"
                                                    style={{
                                                        flex: 1,
                                                        justifyContent: 'center',
                                                        padding: '0.5rem',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.4rem'
                                                    }}
                                                >
                                                    <Eye size={16} /> View
                                                </button>
                                                {resource.file && (
                                                    <button
                                                        onClick={() => handleDownload(resource)}
                                                        className="btn btn-primary"
                                                        style={{
                                                            flex: 1,
                                                            justifyContent: 'center',
                                                            padding: '0.5rem',
                                                            borderRadius: '8px',
                                                            fontSize: '0.8rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem'
                                                        }}
                                                    >
                                                        <Download size={16} /> Download
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card-premium" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden' }}>
                        {filteredResources.map((resource, idx) => (
                            <div
                                key={resource.id}
                                className="animate-fade-in"
                                style={{
                                    padding: '1.25rem 1.5rem',
                                    borderBottom: idx === filteredResources.length - 1 ? 'none' : '1px solid rgba(0,0,0,0.03)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setSelectedResource(resource)}
                            >
                                <div style={{
                                    background: `${getResourceColor(resource.resource_type)}15`,
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    color: getResourceColor(resource.resource_type),
                                    display: 'flex'
                                }}>
                                    {getResourceIcon(resource.resource_type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
                                        <div style={{ fontWeight: 700 }}>{resource.title}</div>
                                        {isNewResource(resource.created_at) && (
                                            <span style={{
                                                fontSize: '0.6rem',
                                                background: '#f43f5e',
                                                color: 'white',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                fontWeight: 900,
                                                letterSpacing: '0.05em'
                                            }}>NEW</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {resource.lesson_title} • {resource.unit_code}
                                    </div>
                                </div>
                                <span className="badge" style={{ background: `${getResourceColor(resource.resource_type)}15`, color: getResourceColor(resource.resource_type) }}>
                                    {resource.resource_type}
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedResource(resource); }}
                                        className="btn"
                                        style={{ padding: '0.5rem', borderRadius: '8px' }}
                                    >
                                        <Eye size={18} />
                                    </button>
                                    {resource.file && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownload(resource); }}
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem', borderRadius: '8px' }}
                                        >
                                            <Download size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Resource Viewer Modal */}
                {selectedResource && (
                    <ResourceViewer
                        resource={selectedResource}
                        onClose={() => setSelectedResource(null)}
                    />
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyResources;
