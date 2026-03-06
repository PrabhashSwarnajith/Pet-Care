import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface EducationItem {
    id: number;
    title: string;
    content: string;
    category: string;
    type: string;
    mediaUrl: string;
}

const BLANK_FORM = { title: '', content: '', category: 'GENERAL', type: 'ARTICLE', mediaUrl: '' };
const MOCK_CONTENT: EducationItem[] = [
    { id: 1, title: 'How to Train Your Puppy', content: 'Consistency is key. Use positive reinforcement and start with basic commands like sit and stay.', category: 'TRAINING', type: 'ARTICLE', mediaUrl: '' },
    { id: 2, title: 'Best Diet for Senior Cats', content: 'Senior cats need a diet lower in calories but high in protein. Ensure they stay hydrated.', category: 'NUTRITION', type: 'ARTICLE', mediaUrl: '' },
    { id: 3, title: 'Recognizing Signs of Heatstroke', content: 'Excessive panting, drooling, and lethargy are early signs. Act quickly and move your pet to a cool place.', category: 'HEALTH', type: 'ARTICLE', mediaUrl: '' },
];

const CATEGORIES = ['ALL', 'NUTRITION', 'TRAINING', 'HEALTH', 'GENERAL'];
const CONTENT_TYPES = ['ARTICLE', 'VIDEO', 'GUIDE'];

const EducationPage = () => {
    const { user } = useAuth();
    const canManage = user?.role === 'ADMIN' || user?.role === 'VET';

    const [contents, setContents] = useState<EducationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('ALL');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<EducationItem | null>(null);
    const [form, setForm] = useState(BLANK_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchContent = async (category: string) => {
        setLoading(true);
        try {
            const url = category === 'ALL' ? '/api/education' : `/api/education?category=${category}`;
            const res = await api.get(url);
            setContents(res.data);
        } catch {
            setContents(MOCK_CONTENT.filter(c => c.category === category || category === 'ALL'));
        }
        setLoading(false);
    };

    useEffect(() => { fetchContent(activeCategory); }, [activeCategory]);

    const openCreate = () => {
        setEditItem(null);
        setForm(BLANK_FORM);
        setError('');
        setShowModal(true);
    };

    const openEdit = (item: EducationItem) => {
        setEditItem(item);
        setForm({ title: item.title, content: item.content, category: item.category, type: item.type, mediaUrl: item.mediaUrl || '' });
        setError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            setError('Title and content are required.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (editItem) {
                await api.put(`/api/education/${editItem.id}`, form);
            } else {
                await api.post('/api/education', form);
            }
            setShowModal(false);
            fetchContent(activeCategory);
        } catch (e: any) {
            setError(e.response?.data?.message || 'Failed to save article.');
        }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this article? This cannot be undone.')) return;
        try {
            await api.delete(`/api/education/${id}`);
            fetchContent(activeCategory);
        } catch {
            alert('Failed to delete article.');
        }
    };

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case 'NUTRITION': return '#34d399';
            case 'TRAINING': return '#4eb8ff';
            case 'HEALTH': return '#ff6b8b';
            default: return '#7c6af5';
        }
    };

    return (
        <div>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>Educational Hub</h2>
                    <p style={{ color: '#8890b8', marginTop: 4 }}>Expert-curated articles and tips for your pets</p>
                </div>
                {canManage && (
                    <button style={styles.addBtn} onClick={openCreate}>+ Add Article</button>
                )}
            </div>

            {/* Category Filters */}
            <div style={styles.filters}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        style={{ ...styles.filterBtn, ...(activeCategory === cat ? styles.filterBtnActive : {}) }}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            {loading ? (
                <LoadingSpinner size={48} />
            ) : contents.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={{ fontSize: '0.85rem', marginBottom: 16, color: '#7c6af5', fontWeight: 800 }}>No articles</div>
                    <h3>No articles found</h3>
                    <p style={{ color: '#8890b8', marginTop: 8 }}>
                        {canManage ? 'Click "+ Add Article" to create the first one.' : 'Check back later for more content.'}
                    </p>
                </div>
            ) : (
                <div className="grid-3" style={{ gap: 24 }}>
                    {contents.map((item) => {
                        const color = getCategoryColor(item.category);
                        return (
                            <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ height: 4, background: color }} />
                                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                        <span className="badge" style={{ background: `${color}20`, color: color, fontWeight: 600 }}>
                                            {item.category}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: '#8890b8', fontWeight: 500 }}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', marginBottom: 12, lineHeight: 1.4, color: '#f0f2ff' }}>{item.title}</h3>
                                    <p style={{ color: '#8890b8', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>{item.content}</p>

                                    {item.mediaUrl && (
                                        <a href={item.mediaUrl} target="_blank" rel="noreferrer" style={{ ...styles.readMore, marginTop: 12 }}>
                                            View Media →
                                        </a>
                                    )}

                                    {canManage && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                            <button style={styles.editBtn} onClick={() => openEdit(item)}>Edit</button>
                                            <button style={styles.deleteBtn} onClick={() => handleDelete(item.id)}>Delete</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Modal */}
            {showModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3 style={{ color: '#f0f2ff', marginBottom: 20, fontSize: '1.3rem' }}>
                            {editItem ? 'Edit Article' : 'Add New Article'}
                        </h3>

                        <div style={styles.field}>
                            <label style={styles.label}>Title *</label>
                            <input
                                style={styles.input}
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Article title"
                            />
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Content *</label>
                            <textarea
                                style={{ ...styles.input, minHeight: 120, resize: 'vertical' }}
                                value={form.content}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                                placeholder="Write the article content here..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ ...styles.field, flex: 1 }}>
                                <label style={styles.label}>Category</label>
                                <select style={styles.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                    {CATEGORIES.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div style={{ ...styles.field, flex: 1 }}>
                                <label style={styles.label}>Type</label>
                                <select style={styles.input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Media URL (optional)</label>
                            <input
                                style={styles.input}
                                value={form.mediaUrl}
                                onChange={e => setForm({ ...form, mediaUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>

                        {error && <p style={{ color: '#ff6b8b', marginBottom: 12, fontSize: '0.88rem' }}>{error}</p>}

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button style={styles.cancelBtn} onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                            <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : editItem ? 'Update Article' : 'Create Article'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    header: {
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 16,
    },
    addBtn: {
        padding: '10px 22px', borderRadius: 10, border: 'none',
        background: '#7c6af5', color: '#fff',
        fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
    },
    filters: {
        display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', paddingBottom: 8,
    },
    filterBtn: {
        padding: '8px 20px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.03)', color: '#8890b8', fontWeight: 600, fontSize: '0.85rem',
        cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
    },
    filterBtnActive: {
        background: '#7c6af5', color: '#fff', borderColor: '#7c6af5',
    },
    emptyState: {
        textAlign: 'center', padding: '80px 40px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24,
    },
    readMore: {
        display: 'inline-block', color: '#7c6af5', fontWeight: 600, fontSize: '0.9rem',
        textDecoration: 'none', transition: 'opacity 0.2s'
    },
    editBtn: {
        flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid #4eb8ff44',
        background: '#4eb8ff18', color: '#4eb8ff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
    },
    deleteBtn: {
        flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid #ff6b8b44',
        background: '#ff6b8b18', color: '#ff6b8b', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
    },
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modal: {
        background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
        padding: '32px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
    },
    field: { marginBottom: 16 },
    label: { display: 'block', color: '#8890b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 },
    input: {
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        color: '#f0f2ff', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box',
    },
    saveBtn: {
        padding: '10px 24px', borderRadius: 10, border: 'none',
        background: '#7c6af5', color: '#fff',
        fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
    },
    cancelBtn: {
        padding: '10px 24px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
        background: 'transparent', color: '#8890b8', fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer',
    },
};

export default EducationPage;
