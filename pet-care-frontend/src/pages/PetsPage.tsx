import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Toast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface Pet {
    id: number; name: string; species: string; breed: string;
    age: number; weight: number; medicalHistory: string;
}

const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Fish', 'Hamster', 'Other'];

const SPECIES_COLORS: Record<string, string> = {
    Dog: '#7c6af5', Cat: '#ff6b8b', Bird: '#4eb8ff',
    Rabbit: '#34d399', Fish: '#fbbf24', Hamster: '#f87171',
};

const SpeciesBadge = ({ species, size = 52 }: { species: string; size?: number }) => {
    const color = SPECIES_COLORS[species] || '#7c6af5';
    return (
        <div style={{
            width: size, height: size, borderRadius: 16, flexShrink: 0,
            background: `${color}18`, border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: `${size * 0.4}px`, fontWeight: 800, color, letterSpacing: '-0.04em',
        }}>
            {species?.[0] || 'P'}
        </div>
    );
};

const EMPTY_FORM = { name: '', species: 'Dog', breed: '', age: '', weight: '', medicalHistory: '' };

const PetsPage = () => {
    const { user } = useAuth();
    const isOwner = user?.role === 'USER';

    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingPetId, setEditingPetId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');

    const fetchPets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/pets');
            setPets(res.data);
        } catch (err: any) {
            console.error('Failed to load pets:', err.response?.data || err.message);
        }
        setLoading(false);
    };

    useEffect(() => { fetchPets(); }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const openEdit = (pet: Pet) => {
        setEditingPetId(pet.id);
        setForm({
            name: pet.name, species: pet.species, breed: pet.breed || '',
            age: String(pet.age), weight: String(pet.weight ?? ''),
            medicalHistory: pet.medicalHistory || '',
        });
        setError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false); setEditingPetId(null);
        setForm(EMPTY_FORM); setError('');
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Pet name is required.'); return; }
        setError(''); setSaving(true);
        try {
            await api.post('/api/pets', {
                name: form.name, species: form.species, breed: form.breed,
                age: Number(form.age), weight: Number(form.weight),
                medicalHistory: form.medicalHistory,
            });
            closeModal(); fetchPets();
            showToast('Pet added successfully.');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to add pet. Please try again.');
        }
        setSaving(false);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) { setError('Pet name is required.'); return; }
        setError(''); setSaving(true);
        try {
            await api.put(`/api/pets/${editingPetId}`, {
                name: form.name, species: form.species, breed: form.breed,
                age: Number(form.age), weight: Number(form.weight),
                medicalHistory: form.medicalHistory,
            });
            closeModal(); fetchPets();
            showToast('Pet updated successfully.');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to update pet. Please try again.');
        }
        setSaving(false);
    };

    const handleDelete = async (petId: number, name: string) => {
        if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
        try {
            await api.delete(`/api/pets/${petId}`);
            fetchPets();
            showToast(`${name} removed.`);
        } catch (err: any) {
            showToast('Failed to delete pet.');
        }
    };

    return (
        <div>
            <Toast message={toast} />

            <div style={styles.header}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>My Pets</h2>
                    <p style={{ color: '#8890b8', marginTop: 4 }}>{pets.length} pet{pets.length !== 1 ? 's' : ''} registered</p>
                </div>
                {isOwner && (
                    <button id="add-pet-btn" className="btn btn-primary" onClick={() => { setEditingPetId(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); }}>
                        + Add New Pet
                    </button>
                )}
            </div>

            {loading ? (
                <LoadingSpinner size={48} />
            ) : pets.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={{ color: '#7c6af5', fontSize: '2.5rem', fontWeight: 900, marginBottom: 16 }}>[ ? ]</div>
                    <h3>No pets yet</h3>
                    <p style={{ color: '#8890b8', margin: '8px 0 24px' }}>Start by adding your first pet to the system.</p>
                    {isOwner && (
                        <button className="btn btn-primary" onClick={() => { setEditingPetId(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); }}>
                            Add Your First Pet
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid-3">
                    {pets.map((pet) => {
                        const color = SPECIES_COLORS[pet.species] || '#7c6af5';
                        return (
                            <div key={pet.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}80)` }} />
                                <div style={{ padding: 22 }}>
                                    <div style={styles.petCardHeader}>
                                        <SpeciesBadge species={pet.species} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{ marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pet.name}</h3>
                                            <span className="badge badge-purple">{pet.species}</span>
                                        </div>
                                        {isOwner && (
                                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                <button onClick={() => openEdit(pet)} style={styles.editBtn} title="Edit">Edit</button>
                                                <button onClick={() => handleDelete(pet.id, pet.name)} style={styles.deleteBtn} title="Delete">Del</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="divider" />

                                    <div style={styles.petDetails}>
                                        {[
                                            { label: 'Breed', value: pet.breed || '—' },
                                            { label: 'Age', value: `${pet.age} year${pet.age !== 1 ? 's' : ''}` },
                                            { label: 'Weight', value: pet.weight ? `${pet.weight} kg` : '—' },
                                        ].map(({ label, value }) => (
                                            <div key={label} style={styles.detailRow}>
                                                <span style={styles.detailLabel}>{label}</span>
                                                <span style={{ fontWeight: 500, color: '#e0e4ff' }}>{value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {pet.medicalHistory && (
                                        <div style={styles.medHistory}>
                                            <div style={{ ...styles.detailLabel, marginBottom: 5 }}>Medical Notes</div>
                                            <p style={{ fontSize: '0.85rem', color: '#c5c8e8', lineHeight: 1.55 }}>{pet.medicalHistory}</p>
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
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingPetId ? 'Edit Pet' : 'Add New Pet'}</h3>
                            <button className="btn btn-icon btn-secondary" onClick={closeModal}>✕</button>
                        </div>
                        {error && <div className="alert alert-error">{error}</div>}
                        <form onSubmit={editingPetId ? handleUpdate : handleAdd}>
                            <div className="grid-2" style={{ gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">Pet Name *</label>
                                    <input id="pet-name" name="name" className="form-input" placeholder="e.g. Buddy"
                                        value={form.name} onChange={handleChange} required autoFocus />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Species *</label>
                                    <select id="pet-species" name="species" className="form-select" value={form.species} onChange={handleChange}>
                                        {SPECIES.map((s) => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Breed</label>
                                    <input id="pet-breed" name="breed" className="form-input" placeholder="e.g. Golden Retriever"
                                        value={form.breed} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Age (years) *</label>
                                    <input id="pet-age" name="age" type="number" min="0" max="50" className="form-input"
                                        placeholder="3" value={form.age} onChange={handleChange} required />
                                </div>
                                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                    <label className="form-label">Weight (kg)</label>
                                    <input id="pet-weight" name="weight" type="number" step="0.1" min="0" className="form-input"
                                        placeholder="25.5" value={form.weight} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Medical History / Notes</label>
                                <textarea id="pet-medical" name="medicalHistory" className="form-textarea"
                                    placeholder="Any conditions, allergies, vaccinations, previous treatments…"
                                    value={form.medicalHistory} onChange={handleChange} rows={3} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                                <button id="pet-save-btn" type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving
                                        ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving…</>
                                        : editingPetId ? 'Update Pet' : 'Save Pet'}
                                </button>
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
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 32, flexWrap: 'wrap', gap: 16,
    },
    emptyState: {
        textAlign: 'center', padding: '80px 40px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24,
    },
    petCardHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 },
    petDetails: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 },
    detailRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center' },
    detailLabel: { color: '#8890b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.72rem' },
    medHistory: { background: 'rgba(124,106,245,0.06)', border: '1px solid rgba(124,106,245,0.15)', borderRadius: 10, padding: 14 },
    editBtn: {
        background: 'rgba(124,106,245,0.1)', border: '1px solid rgba(124,106,245,0.2)',
        borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem',
        color: '#a89cf5', fontFamily: 'inherit', fontWeight: 700,
    },
    deleteBtn: {
        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
        borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem',
        color: '#f87171', fontFamily: 'inherit', fontWeight: 700,
    },
};

export default PetsPage;
