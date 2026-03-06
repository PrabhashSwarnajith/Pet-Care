import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Toast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface Pet { id: number; name: string; species: string; }
interface Medication {
    id: number; name: string; dosage: string; frequency: string;
    startDate: string; endDate: string | null; notes: string;
    pet: Pet;
}

const EMPTY_FORM = { name: '', dosage: '', frequency: '', startDate: '', endDate: '', notes: '' };
const FREQ_OPTS = ['Once daily', 'Twice daily', 'Every 8 hours', 'Weekly', 'Monthly', 'As needed'];

const isActive = (med: Medication) =>
    !med.endDate || new Date(med.endDate) >= new Date();

const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const SPECIES_COLORS: Record<string, string> = {
    Dog: '#7c6af5', Cat: '#ff6b8b', Bird: '#4eb8ff', Rabbit: '#34d399', Fish: '#fbbf24', Hamster: '#f87171',
};

const SpeciesBadge = ({ species, size = 28 }: { species?: string; size?: number }) => {
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

const MedicationsPage = () => {
    const { user } = useAuth();
    const isOwner = user?.role === 'USER';

    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
    const [meds, setMeds] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMeds, setLoadingMeds] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingMed, setEditingMed] = useState<Medication | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    // Load pets on mount
    useEffect(() => {
        api.get('/api/pets')
            .then(r => {
                setPets(r.data);
                if (r.data.length > 0) setSelectedPetId(r.data[0].id);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    // Load medications when selected pet changes
    useEffect(() => {
        if (selectedPetId === null) return;
        setLoadingMeds(true);
        api.get(`/api/medications?petId=${selectedPetId}`)
            .then(r => setMeds(r.data))
            .catch(() => setMeds([]))
            .finally(() => setLoadingMeds(false));
    }, [selectedPetId]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const openAdd = () => {
        setEditingMed(null);
        setForm(EMPTY_FORM);
        setError('');
        setShowModal(true);
    };

    const openEdit = (med: Medication) => {
        setEditingMed(med);
        setForm({
            name: med.name, dosage: med.dosage ?? '', frequency: med.frequency ?? '',
            startDate: med.startDate ?? '', endDate: med.endDate ?? '', notes: med.notes ?? '',
        });
        setError('');
        setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Medication name is required.'); return; }
        if (!selectedPetId) { setError('Please select a pet first.'); return; }
        setError(''); setSaving(true);
        try {
            const body = {
                petId: selectedPetId,
                name: form.name.trim(),
                dosage: form.dosage,
                frequency: form.frequency,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                notes: form.notes,
            };
            if (editingMed) {
                await api.put(`/api/medications/${editingMed.id}`, body);
                showToast('Medication updated.');
            } else {
                await api.post('/api/medications', body);
                showToast('Medication added.');
            }
            setShowModal(false);
            // Reload meds
            const r = await api.get(`/api/medications?petId=${selectedPetId}`);
            setMeds(r.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to save. Please try again.');
        }
        setSaving(false);
    };

    const handleDelete = async (med: Medication) => {
        if (!window.confirm(`Remove "${med.name}"?`)) return;
        try {
            await api.delete(`/api/medications/${med.id}`);
            setMeds(prev => prev.filter(m => m.id !== med.id));
            showToast(`${med.name} removed.`);
        } catch {
            showToast('Failed to delete medication.');
        }
    };

    const selectedPet = pets.find(p => p.id === selectedPetId);
    const activeMeds = meds.filter(isActive);
    const pastMeds = meds.filter(m => !isActive(m));

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <Toast message={toast} />

            {/* Page header */}
            <div style={styles.header}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>
                        Medications & Treatments
                    </h2>
                    <p style={{ color: '#8890b8', marginTop: 4 }}>
                        Track medicines and ongoing treatments for your pets
                    </p>
                </div>
                {selectedPetId && isOwner && (
                    <button className="btn btn-primary" onClick={openAdd}>+ Add Medication</button>
                )}
            </div>

            {/* No pets state */}
            {pets.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={{ fontSize: '0.85rem', marginBottom: 16, color: '#7c6af5', fontWeight: 800 }}>No pets</div>
                    <h3 style={{ color: '#f0f2ff', marginBottom: 8 }}>No pets yet</h3>
                    <p style={{ color: '#8890b8' }}>Add a pet first to start tracking medications.</p>
                </div>
            ) : (
                <>
                    {/* Pet selector tabs */}
                    <div style={styles.petTabs}>
                        {pets.map(pet => (
                            <button
                                key={pet.id}
                                style={{
                                    ...styles.petTab,
                                    ...(selectedPetId === pet.id ? styles.petTabActive : {}),
                                }}
                                onClick={() => setSelectedPetId(pet.id)}
                            >
                                <SpeciesBadge species={pet.species} size={28} />
                                <span>{pet.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Medications list */}
                    {loadingMeds ? (
                        <LoadingSpinner />
                    ) : meds.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: '0.85rem', marginBottom: 16, color: '#ff6b8b', fontWeight: 800 }}>No meds</div>
                            <h3 style={{ color: '#f0f2ff', marginBottom: 8 }}>
                                No medications for {selectedPet?.name}
                            </h3>
                            <p style={{ color: '#8890b8' }}>
                                Click "Add Medication" to log a medicine or treatment.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Active medications */}
                            {activeMeds.length > 0 && (
                                <MedSection
                                    title={`Active (${activeMeds.length})`}
                                    color="#34d399"
                                    meds={activeMeds}
                                    isOwner={isOwner}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                />
                            )}
                            {/* Past medications */}
                            {pastMeds.length > 0 && (
                                <MedSection
                                    title={`Past / Completed (${pastMeds.length})`}
                                    color="#8890b8"
                                    meds={pastMeds}
                                    isOwner={isOwner}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                />
                            )}
                        </>
                    )}
                </>
            )}

            {/* ── Add / Edit Modal ── */}
            {showModal && (
                <div style={styles.overlay} onClick={() => setShowModal(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>
                                {editingMed ? 'Edit Medication' : 'Add Medication'}
                            </h3>
                            <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <label style={styles.label}>
                                Medication / Treatment Name *
                                <input
                                    name="name" value={form.name} onChange={handleChange}
                                    placeholder="e.g., Apoquel, Flea Treatment"
                                    style={styles.input} required
                                />
                            </label>

                            <div style={styles.row}>
                                <label style={{ ...styles.label, flex: 1 }}>
                                    Dosage
                                    <input
                                        name="dosage" value={form.dosage} onChange={handleChange}
                                        placeholder="e.g., 16mg, 1 tablet"
                                        style={styles.input}
                                    />
                                </label>
                                <label style={{ ...styles.label, flex: 1 }}>
                                    Frequency
                                    <select name="frequency" value={form.frequency} onChange={handleChange} style={styles.input}>
                                        <option value="">Select…</option>
                                        {FREQ_OPTS.map(f => <option key={f}>{f}</option>)}
                                    </select>
                                </label>
                            </div>

                            <div style={styles.row}>
                                <label style={{ ...styles.label, flex: 1 }}>
                                    Start Date
                                    <input
                                        name="startDate" type="date" value={form.startDate}
                                        onChange={handleChange} style={styles.input}
                                    />
                                </label>
                                <label style={{ ...styles.label, flex: 1 }}>
                                    End Date <span style={{ color: '#8890b8', fontWeight: 400 }}>(leave blank if ongoing)</span>
                                    <input
                                        name="endDate" type="date" value={form.endDate}
                                        onChange={handleChange} style={styles.input}
                                    />
                                </label>
                            </div>

                            <label style={styles.label}>
                                Notes / Instructions
                                <textarea
                                    name="notes" value={form.notes} onChange={handleChange}
                                    placeholder="e.g., Give with food. Check for rash."
                                    style={{ ...styles.input, resize: 'vertical', minHeight: 80 }}
                                />
                            </label>

                            {error && <p style={{ color: '#f87171', fontSize: '0.88rem' }}>{error}</p>}

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving…' : editingMed ? 'Save Changes' : 'Add Medication'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const MedSection = ({
    title, color, meds, isOwner, onEdit, onDelete,
}: {
    title: string; color: string;
    meds: Medication[];
    isOwner: boolean;
    onEdit: (m: Medication) => void;
    onDelete: (m: Medication) => void;
}) => (
    <div style={{ marginBottom: 32 }}>
        <h3 style={{ color, fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {meds.map(med => (
                <div key={med.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    {/* Icon */}
                    <div style={{
                        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                        background: `${color}20`, border: `1px solid ${color}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem',
                        fontWeight: 700, color: color,
                    }}>
                        Rx
                    </div>
                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f0f2ff' }}>{med.name}</span>
                            {med.dosage && (
                                <span style={{ fontSize: '0.78rem', color, background: `${color}15`, borderRadius: 100, padding: '2px 10px', fontWeight: 600 }}>
                                    {med.dosage}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px', fontSize: '0.85rem', color: '#8890b8' }}>
                            {med.frequency && <span>{med.frequency}</span>}
                            <span>{fmtDate(med.startDate)} → {fmtDate(med.endDate)}</span>
                        </div>
                        {med.notes && (
                            <p style={{ marginTop: 6, fontSize: '0.85rem', color: '#a0a8c8', lineHeight: 1.5 }}>{med.notes}</p>
                        )}
                    </div>
                    {/* Actions */}
                    {isOwner && (
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button
                                style={styles.iconBtn}
                                onClick={() => onEdit(med)}
                                title="Edit"
                            >Edit</button>
                            <button
                                style={{ ...styles.iconBtn, color: '#f87171' }}
                                onClick={() => onDelete(med)}
                                title="Delete"
                            >Del</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
);

const styles: Record<string, React.CSSProperties> = {
    header: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
    },
    emptyState: {
        textAlign: 'center', padding: '80px 24px',
        background: 'rgba(255,255,255,0.02)', borderRadius: 16,
        border: '1px dashed rgba(255,255,255,0.08)',
    },
    petTabs: {
        display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28,
    },
    petTab: {
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 18px', borderRadius: 100,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
        color: '#8890b8', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.2s',
    },
    petTabActive: {
        background: 'rgba(124,106,245,0.15)', border: '1px solid rgba(124,106,245,0.4)',
        color: '#a89cf5',
    },
    iconBtn: {
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '0.9rem',
        fontFamily: 'inherit',
    },
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 500, backdropFilter: 'blur(4px)', padding: 16,
    },
    modal: {
        background: '#1a1c2e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 540,
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

export default MedicationsPage;
