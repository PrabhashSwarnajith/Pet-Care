import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Toast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface AdoptionListing {
    id: number; petName: string; species: string; breed: string;
    ageYears: number; gender: string; description: string;
    imageUrl: string; location: string;
    status: 'AVAILABLE' | 'PENDING' | 'ADOPTED';
    listedBy: { id: number; firstName: string; lastName: string; };
    adoptedBy: { id: number; firstName: string; lastName: string; } | null;
}

const SPECIES_OPTS = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Fish', 'Hamster', 'Other'];
const GENDER_OPTS = ['Male', 'Female'];

const speciesInitial = (s?: string) => (s || 'P')[0].toUpperCase();

const speciesColor = (s?: string) =>
    ({ Dog: '#7c6af5', Cat: '#ff6b8b', Bird: '#4eb8ff', Rabbit: '#34d399', Fish: '#fbbf24', Hamster: '#f87171' }[s || ''] ?? '#7c6af5');


const STATUS_INFO: Record<string, { label: string; color: string }> = {
    AVAILABLE: { label: 'Available', color: '#34d399' },
    PENDING: { label: 'Pending', color: '#fbbf24' },
    ADOPTED: { label: 'Adopted', color: '#a89cf5' },
};

const EMPTY_FORM = { petName: '', species: 'Dog', breed: '', ageYears: '', gender: 'Male', description: '', imageUrl: '', location: '' };

const AdoptionPage = () => {
    const { user } = useAuth();
    const isOwner = user?.role === 'USER';
    const [tab, setTab] = useState<'browse' | 'mine'>('browse');
    const [listings, setListings] = useState<AdoptionListing[]>([]);
    const [myListings, setMyListings] = useState<AdoptionListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [toast, setToast] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState('ALL');

    const fetchAll = async () => {
        setLoading(true);
        const [all, mine] = await Promise.allSettled([
            api.get('/api/adoptions'),
            api.get('/api/adoptions/mine'),
        ]);
        if (all.status === 'fulfilled') setListings(all.value.data);
        if (mine.status === 'fulfilled') setMyListings(mine.value.data);
        setLoading(false);
    };

    useEffect(() => { fetchAll(); }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.petName.trim()) { setError('Pet name is required.'); return; }
        setError(''); setSaving(true);
        try {
            await api.post('/api/adoptions', {
                petName: form.petName.trim(), species: form.species, breed: form.breed,
                ageYears: form.ageYears ? Number(form.ageYears) : null,
                gender: form.gender, description: form.description,
                imageUrl: form.imageUrl, location: form.location,
            });
            setShowModal(false); setForm(EMPTY_FORM);
            fetchAll();
            showToast('Listing created! Your pet is now visible to adopters.');
            setTab('mine');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to create listing. Please try again.');
        }
        setSaving(false);
    };

    const handleRequest = async (listing: AdoptionListing) => {
        if (!window.confirm(`Request to adopt ${listing.petName}? The owner will be notified.`)) return;
        try {
            await api.put(`/api/adoptions/${listing.id}/request`);
            fetchAll();
            showToast(`Adoption request sent for ${listing.petName}!`);
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Request failed.');
        }
    };

    const handleApprove = async (listing: AdoptionListing) => {
        if (!window.confirm(`Approve adoption of ${listing.petName}? This cannot be undone.`)) return;
        try {
            await api.put(`/api/adoptions/${listing.id}/approve`);
            fetchAll();
            showToast(`${listing.petName} has found a new home!`);
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to approve adoption.');
        }
    };

    const handleDelete = async (listing: AdoptionListing) => {
        if (!window.confirm(`Remove listing for ${listing.petName}?`)) return;
        try {
            await api.delete(`/api/adoptions/${listing.id}`);
            fetchAll();
            showToast('Listing removed.');
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to delete listing.');
        }
    };

    // Filtered browse listings
    const browseable = listings
        .filter(l => speciesFilter === 'ALL' || l.species === speciesFilter)
        .filter(l => !searchQuery || l.petName.toLowerCase().includes(searchQuery.toLowerCase())
            || l.breed?.toLowerCase().includes(searchQuery.toLowerCase())
            || l.location?.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading) return <LoadingSpinner />;

    return (
        <div>
            <Toast message={toast} />

            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>Pet Adoption</h2>
                    <p style={{ color: '#8890b8', marginTop: 4 }}>
                        Give a rescue pet a loving home, or list a pet in need of rehoming
                    </p>
                </div>
                {isOwner && (
                    <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }}>
                        + List a Pet
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div style={styles.tabRow}>
                <button style={{ ...styles.tab, ...(tab === 'browse' ? styles.tabActive : {}) }}
                    onClick={() => setTab('browse')}>
                    Browse ({listings.length})
                </button>
                <button style={{ ...styles.tab, ...(tab === 'mine' ? styles.tabActive : {}) }}
                    onClick={() => setTab('mine')}>
                    My Listings ({myListings.length})
                </button>
            </div>

            {/* ── Browse Tab ── */}
            {tab === 'browse' && (
                <>
                    {/* Search + species filter */}
                    <div style={styles.filterBar}>
                        <input
                            placeholder="Search by name, breed, or location…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ ...styles.searchInput, flex: 1 }}
                        />
                        <div style={styles.speciesChips}>
                            {['ALL', ...SPECIES_OPTS].map(s => (
                                <button
                                    key={s}
                                    style={{ ...styles.chip, ...(speciesFilter === s ? styles.chipActive : {}) }}
                                    onClick={() => setSpeciesFilter(s)}
                                >
                                    {s === 'ALL' ? 'All' : s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {browseable.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: '0.85rem', marginBottom: 16, color: '#7c6af5', fontWeight: 800 }}>No pets</div>
                            <h3 style={{ color: '#f0f2ff', marginBottom: 8 }}>No pets found</h3>
                            <p style={{ color: '#8890b8' }}>
                                Try adjusting your search or be the first to list a pet for adoption.
                            </p>
                        </div>
                    ) : (
                        <div className="grid-3" style={{ gap: 20 }}>
                            {browseable.map(listing => (
                                <ListingCard
                                    key={listing.id}
                                    listing={listing}
                                    currentUserId={user?.id}
                                    onRequest={handleRequest}
                                    onApprove={handleApprove}
                                    onDelete={handleDelete}
                                    showOwnerActions={false}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── My Listings Tab ── */}
            {tab === 'mine' && (
                myListings.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={{ fontSize: '0.85rem', marginBottom: 16, color: '#7c6af5', fontWeight: 800 }}>No listings</div>
                        <h3 style={{ color: '#f0f2ff', marginBottom: 8 }}>You haven't listed any pets yet</h3>
                        <p style={{ color: '#8890b8' }}>
                            Click "List a Pet" to help a pet find a new home.
                        </p>
                    </div>
                ) : (
                    <div className="grid-3" style={{ gap: 20 }}>
                        {myListings.map(listing => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                currentUserId={user?.id}
                                onRequest={handleRequest}
                                onApprove={handleApprove}
                                onDelete={handleDelete}
                                showOwnerActions
                            />
                        ))}
                    </div>
                )
            )}

            {/* ── Add Listing Modal ── */}
            {showModal && (
                <div style={styles.overlay} onClick={() => setShowModal(false)}>
                    <div style={styles.modal} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ fontWeight: 700, fontSize: '1.15rem' }}>List a Pet for Adoption</h3>
                            <button style={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div style={styles.row}>
                                <label style={{ ...styles.label, flex: 1 }}>
                                    Pet Name *
                                    <input name="petName" value={form.petName} onChange={handleChange} placeholder="e.g., Buddy" style={styles.input} required />
                                </label>
                                <label style={{ ...styles.label, flex: 1 }}>
                                    Species *
                                    <select name="species" value={form.species} onChange={handleChange} style={styles.input}>
                                        {SPECIES_OPTS.map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </label>
                            </div>
                            <div style={styles.row}>
                                <label style={{ ...styles.label, flex: 2 }}>
                                    Breed <span style={{ color: '#8890b8', fontWeight: 400 }}>(optional)</span>
                                    <input name="breed" value={form.breed} onChange={handleChange} placeholder="e.g., Golden Retriever" style={styles.input} />
                                </label>
                                <label style={{ ...styles.label, flex: 1 }}>
                                    Age (years)
                                    <input name="ageYears" type="number" min="0" value={form.ageYears} onChange={handleChange} placeholder="0" style={styles.input} />
                                </label>
                                <label style={{ ...styles.label, flex: 1 }}>
                                    Gender
                                    <select name="gender" value={form.gender} onChange={handleChange} style={styles.input}>
                                        {GENDER_OPTS.map(g => <option key={g}>{g}</option>)}
                                    </select>
                                </label>
                            </div>
                            <label style={styles.label}>
                                Location <span style={{ color: '#8890b8', fontWeight: 400 }}>(city / area)</span>
                                <input name="location" value={form.location} onChange={handleChange} placeholder="e.g., Colombo, Sri Lanka" style={styles.input} />
                            </label>
                            <label style={styles.label}>
                                Description
                                <textarea name="description" value={form.description} onChange={handleChange}
                                    placeholder="Describe the pet's personality, health, reason for rehoming…"
                                    style={{ ...styles.input, resize: 'vertical', minHeight: 90 }} />
                            </label>
                            <label style={styles.label}>
                                Photo URL <span style={{ color: '#8890b8', fontWeight: 400 }}>(optional)</span>
                                <input name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://…" style={styles.input} />
                            </label>
                            {error && <p style={{ color: '#f87171', fontSize: '0.88rem' }}>{error}</p>}
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Posting…' : 'Post Listing'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ListingCard = ({
    listing, currentUserId, onRequest, onApprove, onDelete, showOwnerActions,
}: {
    listing: AdoptionListing; currentUserId?: number;
    onRequest: (l: AdoptionListing) => void;
    onApprove: (l: AdoptionListing) => void;
    onDelete: (l: AdoptionListing) => void;
    showOwnerActions: boolean;
}) => {
    const color = speciesColor(listing.species);
    const status = STATUS_INFO[listing.status];
    const isOwn = listing.listedBy?.id === currentUserId;
    const canRequest = listing.status === 'AVAILABLE' && !isOwn;

    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Pet photo or text placeholder */}
            <div style={{
                borderRadius: 12, overflow: 'hidden', height: 140,
                background: `${color}12`, border: `1px solid ${color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3.5rem', position: 'relative',
            }}>
                {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.petName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : <span style={{ fontSize: '2.5rem', fontWeight: 800, color: `${color}80` }}>{speciesInitial(listing.species)}</span>}
                <span style={{
                    position: 'absolute', top: 8, right: 8, borderRadius: 100,
                    padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700,
                    color: status.color, background: `${status.color}18`, backdropFilter: 'blur(8px)',
                    border: `1px solid ${status.color}40`,
                }}>
                    {status.label}
                </span>
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f0f2ff', marginBottom: 4 }}>
                    {listing.petName}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#8890b8', display: 'flex', flexWrap: 'wrap', gap: '3px 12px', marginBottom: 8 }}>
                    {listing.species && <span>{listing.species}</span>}
                    {listing.breed && <span>• {listing.breed}</span>}
                    {listing.ageYears != null && <span>• {listing.ageYears} yr{listing.ageYears !== 1 ? 's' : ''}</span>}
                    {listing.gender && <span>• {listing.gender}</span>}
                    {listing.location && <span>Location: {listing.location}</span>}
                </div>
                {listing.description && (
                    <p style={{
                        fontSize: '0.85rem', color: '#a0a8c8', lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                        {listing.description}
                    </p>
                )}
                {listing.status === 'PENDING' && listing.adoptedBy && (
                    <p style={{ fontSize: '0.82rem', color: '#fbbf24', marginTop: 6 }}>
                        Requested by {listing.adoptedBy.firstName} {listing.adoptedBy.lastName}
                    </p>
                )}
                {listing.status === 'ADOPTED' && listing.adoptedBy && (
                    <p style={{ fontSize: '0.82rem', color: '#a89cf5', marginTop: 6 }}>
                        Adopted by {listing.adoptedBy.firstName} {listing.adoptedBy.lastName}
                    </p>
                )}
                <p style={{ fontSize: '0.78rem', color: '#5a6080', marginTop: 6 }}>
                    Listed by {listing.listedBy?.firstName} {listing.listedBy?.lastName}
                </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {/* Browse: adopt button for other users */}
                {!showOwnerActions && canRequest && (
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onRequest(listing)}>
                        Adopt
                    </button>
                )}
                {/* Owner actions */}
                {showOwnerActions && listing.status === 'PENDING' && (
                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onApprove(listing)}>
                        Approve Adoption
                    </button>
                )}
                {showOwnerActions && listing.status !== 'ADOPTED' && (
                    <button
                        style={{
                            padding: '7px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600,
                            border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.08)',
                            color: '#f87171', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                        onClick={() => onDelete(listing)}
                    >
                        Remove
                    </button>
                )}
            </div>
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
    filterBar: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
    searchInput: {
        padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.06)', color: '#f0f2ff', fontSize: '0.95rem',
        fontFamily: 'inherit', outline: 'none',
    },
    speciesChips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    chip: {
        padding: '5px 14px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 600,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#8890b8', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    },
    chipActive: {
        background: 'rgba(124,106,245,0.15)', border: '1px solid rgba(124,106,245,0.4)',
        color: '#a89cf5',
    },
    emptyState: {
        textAlign: 'center', padding: '80px 24px',
        background: 'rgba(255,255,255,0.02)', borderRadius: 16,
        border: '1px dashed rgba(255,255,255,0.08)',
    },
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 500, backdropFilter: 'blur(4px)', padding: 16,
    },
    modal: {
        background: '#1a1c2e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 580,
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
    row: { display: 'flex', gap: 12 },
};

export default AdoptionPage;
