import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Toast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface Pet { id: number; name: string; species: string; }
interface VetUser { id: number; firstName: string; lastName: string; email: string; }
interface Surgery {
    id: number; procedureName: string; preOpInstructions: string;
    surgeryDateTime: string; postOpNotes: string | null;
    status: 'SCHEDULED' | 'PRE_OP' | 'COMPLETED' | 'CANCELLED';
    pet: Pet; vet: VetUser; owner: { id: number; firstName: string; lastName: string; };
}

const STATUS_INFO: Record<string, { label: string; color: string; badge: string; icon: string }> = {
    SCHEDULED: { label: 'Scheduled', color: '#4eb8ff', badge: 'badge-blue', icon: '' },
    PRE_OP: { label: 'Pre-Op', color: '#fbbf24', badge: 'badge-warning', icon: '' },
    COMPLETED: { label: 'Completed', color: '#34d399', badge: 'badge-success', icon: '' },
    CANCELLED: { label: 'Cancelled', color: '#f87171', badge: 'badge-danger', icon: '' },
};

const PROCEDURES = [
    'Spay (Female Sterilisation)',
    'Neuter (Male Sterilisation)',
    'Dental Cleaning',
    'Tumour Removal',
    'Fracture Repair',
    'Cataract Surgery',
    'Gastropexy',
    'Other',
];

const speciesInitial = (s?: string) => (s || 'P')[0].toUpperCase();

const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
        + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const EMPTY_FORM = { petId: '', vetId: '', procedureName: '', surgeryDateTime: '', preOpInstructions: '' };

const SurgicalPage = () => {
    const { user } = useAuth();
    const isVet = user?.role === 'VET';

    const [surgeries, setSurgeries] = useState<Surgery[]>([]);
    const [pets, setPets] = useState<Pet[]>([]);
    const [vets, setVets] = useState<VetUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [postOpModal, setPostOpModal] = useState<Surgery | null>(null);
    const [postOpText, setPostOpText] = useState('');
    const [filter, setFilter] = useState('ALL');

    const fetchAll = async () => {
        setLoading(true);
        const [sRes, pRes, vRes] = await Promise.allSettled([
            api.get('/api/surgeries'),
            api.get('/api/pets'),
            api.get('/api/surgeries/vets'),
        ]);
        if (sRes.status === 'fulfilled') setSurgeries(sRes.value.data);
        if (pRes.status === 'fulfilled') setPets(pRes.value.data);
        if (vRes.status === 'fulfilled') setVets(vRes.value.data);
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.petId || !form.vetId) { setError('Please select a pet and a vet.'); return; }
        if (!form.procedureName) { setError('Please select a procedure.'); return; }
        if (!form.surgeryDateTime) { setError('Please select a surgery date and time.'); return; }
        setError(''); setSaving(true);
        try {
            await api.post('/api/surgeries', {
                petId: Number(form.petId),
                vetId: Number(form.vetId),
                procedureName: form.procedureName,
                surgeryDateTime: new Date(form.surgeryDateTime).toISOString().slice(0, 19),
                preOpInstructions: form.preOpInstructions,
            });
            setShowModal(false);
            setForm(EMPTY_FORM);
            fetchAll();
            showToast('Surgery scheduled successfully!');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to schedule. Please try again.');
        }
        setSaving(false);
    };

    const handleUpdateStatus = async (surgery: Surgery, newStatus: string) => {
        try {
            await api.put(`/api/surgeries/${surgery.id}/status`, { status: newStatus });
            fetchAll();
            showToast(`Status updated to ${STATUS_INFO[newStatus]?.label || newStatus}.`);
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to update status.');
        }
    };

    const handleCancel = async (surgery: Surgery) => {
        if (!window.confirm(`Cancel "${surgery.procedureName}" for ${surgery.pet.name}?`)) return;
        try {
            await api.put(`/api/surgeries/${surgery.id}/cancel`);
            fetchAll();
            showToast('Surgery cancelled.');
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to cancel.');
        }
    };

    const handlePostOp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!postOpModal) return;
        try {
            await api.put(`/api/surgeries/${postOpModal.id}/post-op`, { postOpNotes: postOpText });
            setPostOpModal(null);
            setPostOpText('');
            fetchAll();
            showToast('Post-op notes saved.');
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to save notes.');
        }
    };

    const filtered = filter === 'ALL' ? surgeries : surgeries.filter(s => s.status === filter);

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <Toast message={toast} />

            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>Surgical Scheduling</h2>
                    <p style={{ color: '#8890b8', marginTop: 4 }}>
                        {isVet ? 'Your surgical calendar' : 'Schedule and track surgical procedures'}
                    </p>
                </div>
                {!isVet && (
                    <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }}>
                        + Schedule Surgery
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div style={styles.filterRow}>
                {['ALL', 'SCHEDULED', 'PRE_OP', 'COMPLETED', 'CANCELLED'].map(f => (
                    <button
                        key={f}
                        style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'ALL' ? 'All' : STATUS_INFO[f]?.label ?? f}
                        {f !== 'ALL' && (
                            <span style={{ marginLeft: 4 }}>
                                ({surgeries.filter(s => s.status === f).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Surgeries list */}
            {filtered.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={{ fontSize: '0.85rem', marginBottom: 16, color: '#4eb8ff', fontWeight: 800 }}>No procedures</div>
                    <h3 style={{ color: '#f0f2ff', marginBottom: 8 }}>No procedures found</h3>
                    <p style={{ color: '#8890b8' }}>
                        {isVet ? 'No surgeries have been assigned to you yet.'
                            : 'Click "Schedule Surgery" to book a procedure.'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filtered.map(surgery => {
                        const info = STATUS_INFO[surgery.status];
                        return (
                            <div key={surgery.id} className="card">
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                    {/* Icon */}
                                    <div style={{
                                        width: 50, height: 50, borderRadius: 14, flexShrink: 0,
                                        background: `${info.color}18`, border: `1px solid ${info.color}40`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem',
                                    }}>
                                        {speciesInitial(surgery.pet?.species)}
                                    </div>
                                    {/* Details */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f0f2ff' }}>
                                                {surgery.procedureName}
                                            </span>
                                            <span style={{ fontSize: '0.78rem', color: info.color, background: `${info.color}15`, borderRadius: 100, padding: '2px 10px', fontWeight: 700 }}>
                                                {info.label}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.88rem', color: '#8890b8', display: 'flex', flexWrap: 'wrap', gap: '4px 20px', marginBottom: 6 }}>
                                            <span>{surgery.pet?.species} — {surgery.pet?.name}</span>
                                            <span>Dr. {surgery.vet?.firstName} {surgery.vet?.lastName}</span>
                                            <span>{fmtDate(surgery.surgeryDateTime)}</span>
                                        </div>
                                        {surgery.preOpInstructions && (
                                            <div style={{ fontSize: '0.85rem', color: '#fbbf24', background: 'rgba(251,191,36,0.07)', borderRadius: 8, padding: '6px 10px', marginBottom: 6 }}>
                                                Pre-Op: {surgery.preOpInstructions}
                                            </div>
                                        )}
                                        {surgery.postOpNotes && (
                                            <div style={{ fontSize: '0.85rem', color: '#34d399', background: 'rgba(52,211,153,0.07)', borderRadius: 8, padding: '6px 10px' }}>
                                                Post-Op: {surgery.postOpNotes}
                                            </div>
                                        )}
                                    </div>
                                    {/* Actions */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                                        {/* Vet actions */}
                                        {isVet && surgery.status === 'SCHEDULED' && (
                                            <button className="btn btn-secondary btn-sm"
                                                onClick={() => handleUpdateStatus(surgery, 'PRE_OP')}>
                                                Mark Pre-Op
                                            </button>
                                        )}
                                        {isVet && surgery.status === 'PRE_OP' && (
                                            <button className="btn btn-primary btn-sm"
                                                onClick={() => { setPostOpModal(surgery); setPostOpText(''); }}>
                                                Complete + Notes
                                            </button>
                                        )}
                                        {/* Cancel (owner or vet) */}
                                        {surgery.status !== 'COMPLETED' && surgery.status !== 'CANCELLED' && (
                                            <button
                                                style={styles.cancelBtn}
                                                onClick={() => handleCancel(surgery)}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Schedule Modal ── */}
            {showModal && (
                <div style={styles.overlay} onClick={() => setShowModal(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>Schedule a Surgery</h3>
                            <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={styles.row}>
                                <label style={{ ...styles.label, flex: 1 }}>
                                    Pet *
                                    <select name="petId" value={form.petId} onChange={handleChange} style={styles.input} required>
                                        <option value="">Select pet…</option>
                                        {pets.map(p => <option key={p.id} value={p.id}>{p.species} — {p.name}</option>)}
                                    </select>
                                </label>
                                <label style={{ ...styles.label, flex: 1 }}>
                                    Vet *
                                    <select name="vetId" value={form.vetId} onChange={handleChange} style={styles.input} required>
                                        <option value="">Select vet…</option>
                                        {vets.map(v => <option key={v.id} value={v.id}>Dr. {v.firstName} {v.lastName}</option>)}
                                    </select>
                                </label>
                            </div>
                            <label style={styles.label}>
                                Procedure *
                                <select name="procedureName" value={form.procedureName} onChange={handleChange} style={styles.input} required>
                                    <option value="">Select procedure…</option>
                                    {PROCEDURES.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </label>
                            <label style={styles.label}>
                                Surgery Date & Time *
                                <input
                                    name="surgeryDateTime" type="datetime-local" value={form.surgeryDateTime}
                                    onChange={handleChange} style={styles.input} required
                                />
                            </label>
                            <label style={styles.label}>
                                Pre-Op Instructions <span style={{ color: '#8890b8', fontWeight: 400 }}>(optional)</span>
                                <textarea
                                    name="preOpInstructions" value={form.preOpInstructions}
                                    onChange={handleChange}
                                    placeholder="e.g., Fast for 12 hours before surgery"
                                    style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
                                />
                            </label>
                            {error && <p style={{ color: '#f87171', fontSize: '0.88rem' }}>{error}</p>}
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Scheduling…' : 'Schedule Surgery'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Post-Op Notes Modal ── */}
            {postOpModal && (
                <div style={styles.overlay} onClick={() => setPostOpModal(null)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>
                                Post-Op Notes — {postOpModal.procedureName}
                            </h3>
                            <button style={styles.closeBtn} onClick={() => setPostOpModal(null)}>✕</button>
                        </div>
                        <form onSubmit={handlePostOp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <label style={styles.label}>
                                Recovery instructions & notes for the owner
                                <textarea
                                    value={postOpText}
                                    onChange={e => setPostOpText(e.target.value)}
                                    placeholder="e.g., Keep incision dry for 10 days. Follow-up in 2 weeks."
                                    style={{ ...styles.input, minHeight: 120, resize: 'vertical' }}
                                    required
                                />
                            </label>
                            <p style={{ fontSize: '0.85rem', color: '#fbbf24' }}>
                                Note: This will mark the surgery as <strong>Completed</strong>.
                            </p>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setPostOpModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save & Complete</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
    },
    filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 },
    filterBtn: {
        padding: '7px 16px', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#8890b8', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    },
    filterBtnActive: {
        background: 'rgba(124,106,245,0.15)', border: '1px solid rgba(124,106,245,0.4)',
        color: '#a89cf5',
    },
    emptyState: {
        textAlign: 'center', padding: '80px 24px',
        background: 'rgba(255,255,255,0.02)', borderRadius: 16,
        border: '1px dashed rgba(255,255,255,0.08)',
    },
    cancelBtn: {
        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
        color: '#f87171', borderRadius: 8, padding: '6px 14px', fontSize: '0.82rem',
        fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    },
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 500, backdropFilter: 'blur(4px)', padding: 16,
    },
    modal: {
        background: '#1a1c2e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
    },
    modalHeader: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20,
    },
    closeBtn: {
        background: 'none', border: 'none', color: '#8890b8',
        fontSize: '1.1rem', cursor: 'pointer', fontFamily: 'inherit',
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
    row: { display: 'flex', gap: 14 },
};

export default SurgicalPage;
