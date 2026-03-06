import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Toast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface UserSummary { id: number; firstName: string; lastName: string; email: string; role: string; }
interface NotifDto {
    id: number; title: string; message: string; type: string;
    read: boolean; createdAt: string; broadcast: boolean;
    recipient: UserSummary | null; sender: UserSummary;
}

const TYPES = ['INFO', 'WARNING', 'REMINDER', 'ALERT'];
const TYPE_COLORS: Record<string, string> = {
    INFO: '#4eb8ff', WARNING: '#fbbf24', REMINDER: '#7c6af5', ALERT: '#f87171',
};

const EMPTY_FORM = { title: '', message: '', type: 'INFO', recipientId: '' };

const NotificationsPage = () => {
    const { user } = useAuth();
    const [tab, setTab] = useState<'compose' | 'sent'>('compose');
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [sent, setSent] = useState<NotifDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(EMPTY_FORM);
    const [sendMode, setSendMode] = useState<'one' | 'all'>('one');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    const fetchData = async () => {
        setLoading(true);
        const [uRes, sRes] = await Promise.allSettled([
            api.get('/api/notifications/users'),
            api.get('/api/notifications/sent'),
        ]);
        if (uRes.status === 'fulfilled') setUsers(uRes.value.data);
        if (sRes.status === 'fulfilled') setSent(sRes.value.data);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) { setError('Title is required.'); return; }
        if (!form.message.trim()) { setError('Message is required.'); return; }
        if (sendMode === 'one' && !form.recipientId) { setError('Please select a recipient.'); return; }
        setError(''); setSaving(true);
        try {
            if (sendMode === 'all') {
                await api.post('/api/notifications/broadcast', {
                    title: form.title, message: form.message, type: form.type,
                });
                showToast('Notification broadcast to all users.');
            } else {
                await api.post('/api/notifications/send', {
                    recipientId: Number(form.recipientId),
                    title: form.title, message: form.message, type: form.type,
                });
                const recip = users.find(u => u.id === Number(form.recipientId));
                showToast(`Notification sent to ${recip?.firstName || 'user'}.`);
            }
            setForm(EMPTY_FORM);
            fetchData();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to send notification.');
        }
        setSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this notification?')) return;
        try {
            await api.delete(`/api/notifications/${id}`);
            setSent(prev => prev.filter(n => n.id !== id));
            showToast('Notification deleted.');
        } catch {
            showToast('Failed to delete.');
        }
    };

    const fmtTime = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
        } catch { return iso; }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <Toast message={toast} />

            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>Notifications</h2>
                    <p style={{ color: '#8890b8', marginTop: 4 }}>
                        Send notifications to pet owners — individually or to everyone
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div style={styles.tabRow}>
                <button style={{ ...styles.tab, ...(tab === 'compose' ? styles.tabActive : {}) }}
                    onClick={() => setTab('compose')}>
                    Compose
                </button>
                <button style={{ ...styles.tab, ...(tab === 'sent' ? styles.tabActive : {}) }}
                    onClick={() => setTab('sent')}>
                    Sent ({sent.length})
                </button>
            </div>

            {/* ── Compose Tab ── */}
            {tab === 'compose' && (
                <div className="card" style={{ maxWidth: 640 }}>
                    {/* Send mode toggle */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        <button
                            style={{ ...styles.modeBtn, ...(sendMode === 'one' ? styles.modeBtnActive : {}) }}
                            onClick={() => setSendMode('one')}
                        >
                            Send to Individual
                        </button>
                        <button
                            style={{ ...styles.modeBtn, ...(sendMode === 'all' ? styles.modeBtnActive : {}) }}
                            onClick={() => setSendMode('all')}
                        >
                            Broadcast to All
                        </button>
                    </div>

                    <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Recipient picker (only for individual) */}
                        {sendMode === 'one' && (
                            <label style={styles.label}>
                                Recipient *
                                <select name="recipientId" value={form.recipientId} onChange={handleChange} style={styles.input} required>
                                    <option value="">Select a user…</option>
                                    {users.filter(u => u.id !== user?.id).map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.firstName} {u.lastName} ({u.email}) — {u.role}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        {sendMode === 'all' && (
                            <div style={{
                                padding: '10px 14px', borderRadius: 10,
                                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
                                color: '#fbbf24', fontSize: '0.85rem',
                            }}>
                                This notification will be sent to <strong>all users</strong> ({users.length} users).
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 14 }}>
                            <label style={{ ...styles.label, flex: 1 }}>
                                Title *
                                <input name="title" value={form.title} onChange={handleChange}
                                    placeholder="e.g., Vaccination Reminder" style={styles.input} required />
                            </label>
                            <label style={{ ...styles.label, width: 160 }}>
                                Type
                                <select name="type" value={form.type} onChange={handleChange} style={styles.input}>
                                    {TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <label style={styles.label}>
                            Message *
                            <textarea name="message" value={form.message} onChange={handleChange}
                                placeholder="Write your notification message here..."
                                style={{ ...styles.input, minHeight: 100, resize: 'vertical' }} required />
                        </label>

                        {error && <p style={{ color: '#f87171', fontSize: '0.88rem' }}>{error}</p>}

                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary"
                                onClick={() => setForm(EMPTY_FORM)}>Clear</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Sending…' : sendMode === 'all' ? 'Broadcast Notification' : 'Send Notification'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Sent Tab ── */}
            {tab === 'sent' && (
                sent.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={{ fontSize: '0.85rem', marginBottom: 16, color: '#7c6af5', fontWeight: 800 }}>No sent notifications</div>
                        <h3 style={{ color: '#f0f2ff', marginBottom: 8 }}>You haven't sent any notifications yet</h3>
                        <p style={{ color: '#8890b8' }}>Switch to the Compose tab to send your first notification.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {sent.map(n => {
                            const color = TYPE_COLORS[n.type] || '#7c6af5';
                            return (
                                <div key={n.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                    {/* Type icon */}
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                        background: `${color}18`, border: `1px solid ${color}35`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.65rem', fontWeight: 800, color,
                                    }}>
                                        {n.type.slice(0, 3)}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f0f2ff' }}>{n.title}</span>
                                            <span style={{
                                                fontSize: '0.72rem', fontWeight: 700, color,
                                                background: `${color}15`, borderRadius: 100,
                                                padding: '2px 10px',
                                            }}>
                                                {n.broadcast ? 'Broadcast' : 'Individual'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#a0a8c8', lineHeight: 1.5, marginBottom: 6 }}>{n.message}</p>
                                        <div style={{ fontSize: '0.78rem', color: '#5a6080', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                            <span>Sent {fmtTime(n.createdAt)}</span>
                                            {n.recipient && (
                                                <span>To: {n.recipient.firstName} {n.recipient.lastName}</span>
                                            )}
                                            {n.broadcast && <span>To: All users</span>}
                                        </div>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        style={styles.deleteBtn}
                                        onClick={() => handleDelete(n.id)}
                                        title="Delete"
                                    >Del</button>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
    },
    tabRow: { display: 'flex', gap: 8, marginBottom: 24 },
    tab: {
        padding: '9px 20px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 600,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#8890b8', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    },
    tabActive: {
        background: 'rgba(124,106,245,0.15)', border: '1px solid rgba(124,106,245,0.4)',
        color: '#a89cf5',
    },
    modeBtn: {
        padding: '8px 18px', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#8890b8', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    },
    modeBtnActive: {
        background: 'rgba(124,106,245,0.15)', border: '1px solid rgba(124,106,245,0.4)',
        color: '#a89cf5',
    },
    label: {
        display: 'flex', flexDirection: 'column', gap: 6,
        fontSize: '0.88rem', fontWeight: 600, color: '#c5c8e8',
    },
    input: {
        padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.06)', color: '#f0f2ff', fontSize: '0.95rem',
        fontFamily: 'inherit', outline: 'none', width: '100%',
    },
    emptyState: {
        textAlign: 'center', padding: '80px 24px',
        background: 'rgba(255,255,255,0.02)', borderRadius: 16,
        border: '1px dashed rgba(255,255,255,0.08)',
    },
    deleteBtn: {
        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
        color: '#f87171', borderRadius: 8, padding: '6px 12px', fontSize: '0.78rem',
        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
    },
};

export default NotificationsPage;
