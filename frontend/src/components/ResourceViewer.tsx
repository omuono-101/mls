import React, { useState, useEffect } from 'react';
import {
    X, Download, ExternalLink, FileText, 
    Video, Link as LinkIcon, 
    Maximize2, ZoomIn, ZoomOut,
    File, Presentation, Eye
} from 'lucide-react';

interface Resource {
    id: number;
    title: string;
    resource_type: string;
    file?: string;
    url?: string;
    description?: string;
    lesson_title?: string;
    lesson?: number;
}

interface ResourceViewerProps {
    resource: Resource;
    onClose: () => void;
}

const ResourceViewer: React.FC<ResourceViewerProps> = ({ resource, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(100);
    const [error, setError] = useState<string | null>(null);

    const getResourceIcon = () => {
        switch (resource.resource_type) {
            case 'PDF':
                return <FileText size={24} />;
            case 'Video':
                return <Video size={24} />;
            case 'PPT':
                return <Presentation size={24} />;
            case 'Link':
                return <LinkIcon size={24} />;
            default:
                return <File size={24} />;
        }
    };

    const getResourceColor = () => {
        switch (resource.resource_type) {
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

    const handleDownload = () => {
        if (resource.file) {
            const link = document.createElement('a');
            link.href = resource.file;
            link.download = resource.title;
            link.click();
        }
    };

    const handleOpenExternal = () => {
        if (resource.file) {
            window.open(resource.file, '_blank');
        } else if (resource.url) {
            window.open(resource.url, '_blank');
        }
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 200));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 50));
    };

    useEffect(() => {
        setLoading(false);
    }, [resource]);

    const renderContent = () => {
        if (resource.resource_type === 'Link') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
                    <div style={{ 
                        background: 'var(--primary-light)', 
                        padding: '2rem', 
                        borderRadius: '50%', 
                        marginBottom: '2rem',
                        color: 'var(--primary)'
                    }}>
                        <LinkIcon size={48} />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{resource.title}</h3>
                    {resource.description && (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem', maxWidth: '400px' }}>
                            {resource.description}
                        </p>
                    )}
                    {resource.url && (
                        <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem' }}
                        >
                            <ExternalLink size={20} />
                            Open Link
                        </a>
                    )}
                </div>
            );
        }

        if (resource.resource_type === 'Video') {
            return (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {resource.url || resource.file ? (
                        <video
                            controls
                            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                            src={resource.file || resource.url}
                        >
                            Your browser does not support video playback.
                        </video>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                            No video content available
                        </div>
                    )}
                </div>
            );
        }

        if (resource.resource_type === 'PDF') {
            return (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* PDF Controls */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-main)',
                        borderBottom: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                onClick={handleZoomOut}
                                className="btn"
                                style={{ padding: '0.5rem', borderRadius: '8px' }}
                                disabled={zoom <= 50}
                            >
                                <ZoomOut size={18} />
                            </button>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '50px', textAlign: 'center' }}>
                                {zoom}%
                            </span>
                            <button
                                onClick={handleZoomIn}
                                className="btn"
                                style={{ padding: '0.5rem', borderRadius: '8px' }}
                                disabled={zoom >= 200}
                            >
                                <ZoomIn size={18} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleOpenExternal}
                                className="btn"
                                style={{ padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                            >
                                <Maximize2 size={16} /> Full Screen
                            </button>
                        </div>
                    </div>

                    {/* PDF Viewer */}
                    <div style={{ flex: 1, overflow: 'auto', background: '#525659' }}>
                        {resource.file ? (
                            <iframe
                                src={`${resource.file}#zoom=${zoom}`}
                                style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    border: 'none',
                                    transform: `scale(${zoom / 100})`,
                                    transformOrigin: 'top center'
                                }}
                                title={resource.title}
                                onError={() => setError('Failed to load PDF')}
                            />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <FileText size={64} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                    <p>No PDF file available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Default for other types
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem' }}>
                <div style={{ 
                    background: `${getResourceColor()}20`, 
                    padding: '2rem', 
                    borderRadius: '50%', 
                    marginBottom: '2rem',
                    color: getResourceColor()
                }}>
                    {getResourceIcon()}
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{resource.title}</h3>
                {resource.description && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem', maxWidth: '400px' }}>
                        {resource.description}
                    </p>
                )}
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    This file type cannot be previewed directly.
                </p>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 2000,
            backdropFilter: 'blur(5px)'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                background: 'rgba(0, 0, 0, 0.5)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        background: `${getResourceColor()}20`, 
                        padding: '0.75rem', 
                        borderRadius: '12px', 
                        color: getResourceColor(),
                        display: 'flex'
                    }}>
                        {getResourceIcon()}
                    </div>
                    <div>
                        <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{resource.title}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                            {resource.resource_type} • {resource.lesson_title || 'Lesson Resource'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {resource.file && (
                        <>
                            <button
                                onClick={handleOpenExternal}
                                className="btn"
                                style={{ 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '10px',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Eye size={18} /> Preview
                            </button>
                            <button
                                onClick={handleDownload}
                                className="btn btn-primary"
                                style={{ 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Download size={18} /> Download
                            </button>
                        </>
                    )}
                    <button
                        onClick={onClose}
                        style={{ 
                            background: 'rgba(255,255,255,0.1)', 
                            border: 'none', 
                            padding: '0.75rem',
                            borderRadius: '10px',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%' }} />
                    </div>
                ) : error ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ marginBottom: '1rem' }}>{error}</p>
                            <button onClick={handleDownload} className="btn btn-primary">
                                Download Instead
                            </button>
                        </div>
                    </div>
                ) : (
                    renderContent()
                )}
            </div>
        </div>
    );
};

export default ResourceViewer;
