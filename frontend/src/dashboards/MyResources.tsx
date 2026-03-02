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
}

interface Lesson {
    id: number;
    title: string;
    unit_name?: string;
    unit_code?: string;
    resources?: Resource[];
}

interface Unit {
    id: number;
    name: string;
    code: string;
    lessons: Lesson[];
}

const MyResources: React.FC = () => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'PDF' | 'Video' | 'PPT' | 'Link'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        setLoading(true);
        try {
            const response = await api.get('units/');
            const unitsData = response.data.results || response.data;
            
            // Fetch detailed unit info to get resources
            const detailedUnits = await Promise.all(
                (unitsData as Unit[]).slice(0, 5).map(async (unit: any) => {
                    try {
                        const detailRes = await api.get(`units/${unit.id}/`);
                        return detailRes.data;
                    } catch {
                        return unit;
                    }
                })
            );
            
            setUnits(detailedUnits);
        } catch (error) {
            console.error('Failed to fetch resources', error);
        } finally {
            setLoading(false);
        }
    };

    // Flatten all resources from all units
    const getAllResources = (): Resource[] => {
        const resources: Resource[] = [];
        units.forEach(unit => {
            (unit.lessons || []).forEach((lesson: Lesson) => {
                (lesson.resources || []).forEach(resource => {
                    resources.push({
                        ...resource,
                        lesson_title: lesson.title,
                        unit_name: unit.name,
                        unit_code: unit.code
                    });
                });
            });
        });
        return resources;
    };

    const allResources = getAllResources();

    // Filter resources
    const filteredResources = allResources.filter(resource => {
        const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resource.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || resource.resource_type === filterType;
        return matchesSearch && matchesType;
    });

    // Group resources by unit
    const getResourcesByUnit = () => {
        const grouped: Record<string, Resource[]> = {};
        filteredResources.forEach(resource => {
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
            <div className="animate-fade-in">
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                        My Resources
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                        Browse and download learning materials from your enrolled units.
                    </p>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card-premium" style={{ padding: '1.25rem', borderRadius: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{allResources.length}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
                    </div>
                    <div className="card-premium" style={{ padding: '1.25rem', borderRadius: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f43f5e' }}>{allResources.filter(r => r.resource_type === 'PDF').length}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>PDFs</div>
                    </div>
                    <div className="card-premium" style={{ padding: '1.25rem', borderRadius: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#8b5cf6' }}>{allResources.filter(r => r.resource_type === 'Video').length}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Videos</div>
                    </div>
                    <div className="card-premium" style={{ padding: '1.25rem', borderRadius: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{allResources.filter(r => r.resource_type === 'Link').length}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Links</div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search resources..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input"
                            style={{ paddingLeft: '3rem', width: '100%' }}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['all', 'PDF', 'Video', 'PPT', 'Link'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`btn ${filterType === type ? 'btn-primary' : ''}`}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    background: filterType === type ? 'var(--primary)' : 'var(--bg-main)',
                                    color: filterType === type ? 'white' : 'var(--text-muted)',
                                    border: filterType === type ? 'none' : '1px solid var(--border)'
                                }}
                            >
                                {type === 'all' ? 'All' : type}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-main)', padding: '0.25rem', borderRadius: '10px' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`btn ${viewMode === 'grid' ? '' : ''}`}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '8px',
                                background: viewMode === 'grid' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`btn ${viewMode === 'list' ? '' : ''}`}
                            style={{
                                padding: '0.5rem',
                                borderRadius: '8px',
                                background: viewMode === 'list' ? 'white' : 'transparent',
                                boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            <List size={18} />
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
                            <div key={unitName} className="card-premium" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                    <Layers size={20} className="text-primary" />
                                    <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>{unitName}</h3>
                                    <span className="badge" style={{ marginLeft: 'auto', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                        {resources.length} resources
                                    </span>
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
                                                background: 'white'
                                            }}
                                        >
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
                                                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {resource.title}
                                                    </h4>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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
                                    <div style={{ fontWeight: 700, marginBottom: '0.125rem' }}>{resource.title}</div>
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
