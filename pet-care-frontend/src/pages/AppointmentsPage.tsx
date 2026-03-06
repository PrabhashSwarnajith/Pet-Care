import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Toast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface Pet { id: number; name: string; species: string; }
interface VetUser { id: number; firstName: string; lastName: string; email: string; }
interface Appointment {
    id: number; reason: string; appointmentTime: string;
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
    serviceType: string; meetingLink?: string;
    pet: Pet; vet: VetUser;
}

const speciesInitial = (s?: string) => (s || 'P')[0].toUpperCase();

const SERVICE_TYPES = [
    { value: 'VET_VISIT', label: 'In-Clinic Visit' },
    { value: 'VIDEO_CONSULTATION', label: 'Video Consultation' },
    { value: 'PET_SITTING', label: 'Pet Sitting' },
    { value: 'EMERGENCY', label: 'Emergency Services' }
];

const SPECIES_COLORS: Record<string, string> = {
    Dog: '#7c6af5', Cat: '#ff6b8b', Bird: '#4eb8ff', Rabbit: '#34d399', Fish: '#fbbf24', Hamster: '#f87171',
};

const SpeciesBadge = ({ species, size = 32 }: { species?: string; size?: number }) => {
    const color = SPECIES_COLORS[species || ''] || '#7c6af5';
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: `${color}20`, border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: `${size * 0.36}px`, fontWeight: 800, color,
        }}>
            {(species || 'P')[0]}
        </div>
    );
};

const statusStyle = (s: string) => ({
    SCHEDULED: { badge: 'badge-blue', dot: '#4eb8ff', label: 'Scheduled' },
    COMPLETED: { badge: 'badge-success', dot: '#34d399', label: 'Completed' },
    CANCELLED: { badge: 'badge-danger', dot: '#f87171', label: 'Cancelled' },
}[s] ?? { badge: 'badge-purple', dot: '#7c6af5', label: s });

const FILTERS = [
    { value: 'ALL', label: 'All', icon: '', color: '#7c6af5', bg: 'rgba(124,106,245,0.1)' },
    { value: 'SCHEDULED', label: 'Upcoming', icon: '', color: '#4eb8ff', bg: 'rgba(78,184,255,0.1)' },
    { value: 'COMPLETED', label: 'Completed', icon: '', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    { value: 'CANCELLED', label: 'Cancelled', icon: '', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
];

const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return {
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        day: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    };
};

const EMPTY_BOOK = { petId: '', vetId: '', date: '', time: '', reason: '', serviceType: 'VET_VISIT' };

const AppointmentsPage = () => {
    const { user } = useAuth();
    const isVet = user?.role === 'VET';
    const isAdmin = user?.role === 'ADMIN';

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [pets, setPets] = useState<Pet[]>([]);
    const [vets, setVets] = useState<VetUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_BOOK);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    // Meeting link modal state (VET only)
    const [linkModal, setLinkModal] = useState<Appointment | null>(null);
    const [linkValue, setLinkValue] = useState('');

    const fetchAll = async () => {
        setLoading(true);
        const [aRes, pRes, vRes] = await Promise.allSettled([
            api.get('/api/appointments'),
            api.get('/api/pets'),
            api.get('/api/appointments/vets'),
        ]);
        if (aRes.status === 'fulfilled') setAppointments(aRes.value.data);
        if (pRes.status === 'fulfilled') setPets(pRes.value.data);
        if (vRes.status === 'fulfilled') setVets(vRes.value.data);
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const handleSaveMeetingLink = async () => {
        if (!linkModal) return;
        try {
            await api.put(`/api/appointments/${linkModal.id}/meeting-link`, { meetingLink: linkValue });
            setLinkModal(null);
            setLinkValue('');
            fetchAll();
            showToast('Meeting link saved successfully.');
        } catch {
            showToast('Failed to save meeting link.');
        }
    };

    const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);
    const counts: Record<string, number> = {
        ALL: appointments.length,
        SCHEDULED: appointments.filter(a => a.status === 'SCHEDULED').length,
        COMPLETED: appointments.filter(a => a.status === 'COMPLETED').length,
        CANCELLED: appointments.filter(a => a.status === 'CANCELLED').length,
    };

    const handleCancel = async (id: number) => {
        if (!window.confirm('Cancel this service booking?')) return;
        try {
            await api.put(`/api/appointments/${id}/cancel`);
            showToast('Booking cancelled successfully.');
            fetchAll();
        } catch {
            showToast('Failed to cancel booking.');
        }
    };

    const handleComplete = async (id: number) => {
        if (!window.confirm('Mark this appointment as completed?')) return;
        try {
            await api.put(`/api/appointments/${id}/complete`);
            showToast('Appointment marked as completed successfully.');
            fetchAll();
        } catch {
            showToast('Failed to complete appointment.');
        }
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.petId || !form.vetId || !form.date || !form.time) {
            setError('Please fill in all required fields.');
            return;
        }
        setError(''); setSaving(true);
        try {
            const appointmentTime = `${form.date}T${form.time}:00`;
            await api.post('/api/appointments', {
                petId: Number(form.petId),
                vetId: Number(form.vetId),
                appointmentTime,
                reason: form.reason,
                serviceType: form.serviceType
            });
            setShowModal(false); setForm(EMPTY_BOOK); fetchAll();
            showToast('Service booked successfully.');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to book service.');
        }
        setSaving(false);
    };

    return (
        <div>
            <Toast message={toast} />

            <div style={styles.header}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>My Bookings & Services</h2>
                    <p style={{ color: '#8890b8', marginTop: 4 }}>
                        {isVet ? 'Your appointment calendar' : 'Manage vet visits, video calls, and pet sitting'}
                    </p>
                </div>
                {!isVet && !isAdmin && (
                    <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); setForm(EMPTY_BOOK); }}>
                        Book a Service
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div style={styles.filterRow}>
                {FILTERS.map((f) => {
                    const isActive = filter === f.value;
                    return (
                        <button key={f.value} onClick={() => setFilter(f.value)}
                            style={{
                                ...styles.filterBtn,
                                background: isActive ? f.bg : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isActive ? f.color + '50' : 'rgba(255,255,255,0.07)'}`,
                                color: isActive ? f.color : '#8890b8',
                            }}>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontWeight: 700, fontSize: '1.3rem', lineHeight: 1 }}>{counts[f.value]}</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
                                    {f.label}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <LoadingSpinner size={44} />
            ) : filtered.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={{ fontSize: '1.2rem', marginBottom: 16, color: '#4eb8ff', fontWeight: 800 }}>No bookings</div>
                    <h3>No {filter === 'ALL' ? '' : filter.toLowerCase()} bookings</h3>
                    <p style={{ color: '#8890b8', marginTop: 8 }}>
                        {filter === 'ALL' ? 'Book your first service.' : 'Try switching to a different filter.'}
                    </p>
                    {filter === 'ALL' && !isVet && !isAdmin && (
                        <button className="btn btn-primary" style={{ marginTop: 20 }}
                            onClick={() => { setShowModal(true); setError(''); setForm(EMPTY_BOOK); }}>
                            Book a Service
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {filtered.map((appt) => {
                        const dt = appt.appointmentTime ? fmtDate(appt.appointmentTime) : null;
                        const ss = statusStyle(appt.status);
                        const srvLabel = SERVICE_TYPES.find(s => s.value === appt.serviceType)?.label || 'Service';

                        return (
                            <div key={appt.id} className="card" style={{ ...styles.apptCard, borderLeft: `4px solid ${ss.dot}` }}>
                                <div style={styles.dateBlock}>
                                    {dt ? (
                                        <>
                                            <div style={{ color: ss.dot, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>{dt.weekday}</div>
                                            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: '#f0f2ff', margin: '4px 0' }}>{dt.day}</div>
                                            <div style={{ color: '#8890b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{dt.month}</div>
                                            <div style={{ color: ss.dot, fontSize: '0.76rem', fontWeight: 600, marginTop: 6 }}>{dt.time}</div>
                                        </>
                                    ) : <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4a5080' }}>TBD</span>}
                                </div>

                                <div style={styles.apptMain}>
                                    <div style={styles.apptTop}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <SpeciesBadge species={appt.pet?.species} size={36} />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f0f2ff' }}>
                                                    {appt.pet?.name || '—'}
                                                    <span style={{ color: '#8890b8', fontWeight: 500, marginLeft: 8, fontSize: '0.9rem' }}>
                                                        • {srvLabel}
                                                    </span>
                                                </div>
                                                <div style={{ color: '#8890b8', fontSize: '0.82rem', marginTop: 4 }}>
                                                    Provider: {appt.vet?.firstName} {appt.vet?.lastName}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <span className={`badge ${ss.badge}`}>{ss.label}</span>
                                            {/* VET: add/update meeting link for video consultations */}
                                            {isVet && appt.status === 'SCHEDULED' && appt.serviceType === 'VIDEO_CONSULTATION' && (
                                                <button
                                                    style={styles.linkBtn}
                                                    onClick={() => { setLinkModal(appt); setLinkValue(appt.meetingLink || ''); }}
                                                >
                                                    {appt.meetingLink ? 'Update Link' : 'Add Link'}
                                                </button>
                                            )}
                                            {/* Owner/Admin: cancel */}
                                            {appt.status === 'SCHEDULED' && (
                                                <button onClick={() => handleCancel(appt.id)} style={styles.cancelBtn}>Cancel</button>
                                            )}
                                            {(isVet || isAdmin) && appt.status === 'SCHEDULED' && (
                                                <button onClick={() => handleComplete(appt.id)} style={styles.completeBtn}>Complete</button>
                                            )}
                                        </div>
                                    </div>

                                    {appt.reason && (
                                        <div style={styles.reasonBox}>
                                            <span style={{ color: '#7c6af5', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</span>
                                            <p style={{ color: '#c5c8e8', fontSize: '0.88rem', marginTop: 4 }}>{appt.reason}</p>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                                        {appt.status === 'SCHEDULED' && dt && (
                                            <div style={styles.upcomingPill}>{dt.full} at {dt.time}</div>
                                        )}

                                        {appt.status === 'SCHEDULED' && appt.serviceType === 'VIDEO_CONSULTATION' && (
                                            <div style={{ marginTop: 10 }}>
                                                {appt.meetingLink ? (
                                                    <a href={appt.meetingLink} target="_blank" rel="noreferrer" style={{ ...styles.upcomingPill, background: '#34d39920', color: '#34d399', borderColor: '#34d39950', textDecoration: 'none' }}>
                                                        Join Video Call
                                                    </a>
                                                ) : (
                                                    <div style={{ ...styles.upcomingPill, background: 'transparent', borderColor: 'transparent', color: '#8890b8' }}>
                                                        Waiting for video link...
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Book Appointment Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#7c6af5' }}>APT</span>
                                <h3>Book a Service</h3>
                            </div>
                            <button className="btn btn-icon btn-secondary" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        {pets.length === 0 && (
                            <div className="alert alert-info">Please add a pet first before booking.</div>
                        )}
                        {vets.length === 0 && (
                            <div className="alert alert-info">No service providers are currently registered in the system.</div>
                        )}
                        <form onSubmit={handleBook}>
                            <div className="form-group">
                                <label className="form-label">Service Type *</label>
                                <select className="form-select" value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })} required>
                                    {SERVICE_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                            <div className="grid-2" style={{ gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Pet *</label>
                                    <select className="form-select" value={form.petId} onChange={e => setForm({ ...form, petId: e.target.value })} required>
                                        <option value="">Select pet…</option>
                                        {pets.map(p => <option key={p.id} value={p.id}>{p.species} — {p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Provider / Vet *</label>
                                    <select className="form-select" value={form.vetId} onChange={e => setForm({ ...form, vetId: e.target.value })} required>
                                        <option value="">Select provider…</option>
                                        {vets.map(v => <option key={v.id} value={v.id}>Dr. {v.firstName} {v.lastName}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date *</label>
                                    <input type="date" className="form-input" value={form.date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => setForm({ ...form, date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Time *</label>
                                    <input type="time" className="form-input" value={form.time}
                                        onChange={e => setForm({ ...form, time: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Notes (Optional)</label>
                                    <textarea className="form-textarea" rows={3}
                                        placeholder="e.g. Annual vaccination, instructions for pet sitter..."
                                        value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving || pets.length === 0 || vets.length === 0}>
                                    {saving ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Booking…</> : 'Confirm Booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Meeting Link Modal (VET only) */}
            {linkModal && (
                <div className="modal-overlay" onClick={() => setLinkModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#7c6af5' }}>VID</span>
                                <h3>Set Video Meeting Link</h3>
                            </div>
                            <button className="btn btn-icon btn-secondary" onClick={() => setLinkModal(null)}>✕</button>
                        </div>
                        <p style={{ color: '#8890b8', fontSize: '0.88rem', marginBottom: 16 }}>
                            Appointment with <strong style={{ color: '#f0f2ff' }}>{linkModal.pet?.name}</strong>
                            {' — '}{new Date(linkModal.appointmentTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="form-group">
                            <label className="form-label">Meeting URL (Zoom / Google Meet / Teams)</label>
                            <input
                                className="form-input"
                                placeholder="https://meet.google.com/..."
                                value={linkValue}
                                onChange={e => setLinkValue(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                            <button className="btn btn-secondary" onClick={() => setLinkModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveMeetingLink} disabled={!linkValue.trim()}>
                                Save Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 },
    filterRow: { display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' },
    filterBtn: {
        flex: 1, minWidth: 110, display: 'flex', alignItems: 'center', gap: 14,
        borderRadius: 16, padding: '16px 18px', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.2s',
    },
    emptyState: {
        textAlign: 'center', padding: '80px 40px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24,
    },
    apptCard: { padding: '20px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' },
    dateBlock: {
        width: 72, flexShrink: 0, textAlign: 'center',
        background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '14px 8px',
        border: '1px solid rgba(255,255,255,0.07)',
    },
    apptMain: { flex: 1, minWidth: 0 },
    apptTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' },
    reasonBox: {
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, padding: '10px 14px', marginTop: 0,
    },
    upcomingPill: {
        marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(78,184,255,0.08)', border: '1px solid rgba(78,184,255,0.2)',
        borderRadius: 100, padding: '4px 14px', fontSize: '0.8rem', color: '#4eb8ff', fontWeight: 600,
    },
    cancelBtn: {
        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
        borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem',
        color: '#f87171', fontFamily: 'inherit', fontWeight: 600,
    },
    linkBtn: {
        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
        borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem',
        color: '#34d399', fontFamily: 'inherit', fontWeight: 600,
    },
    completeBtn: {
        background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
        borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem',
        color: '#34d399', fontFamily: 'inherit', fontWeight: 600,
    },
};

export default AppointmentsPage;
