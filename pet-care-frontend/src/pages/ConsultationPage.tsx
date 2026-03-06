import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axiosConfig';
import ReactMarkdown from 'react-markdown';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface Pet { id: number; name: string; species: string; }
interface Consultation {
    id: number; userDescription: string; aiPreliminaryDiagnosis: string;
    vetFinalDiagnosis?: string; treatmentRecommendation?: string;
    status: string; createdAt: string; pet: Pet;
}

// Species badge — no emoji
const SpeciesBadge = ({ species, size = 36 }: { species?: string; size?: number }) => {
    const colors: Record<string, string> = { Dog: '#7c6af5', Cat: '#4eb8ff', Bird: '#34d399', Rabbit: '#fbbf24', Fish: '#f87171' };
    const color = colors[species || ''] || '#8890b8';
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', flexShrink: 0,
            background: `${color}20`, border: `1px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: `${size * 0.36}px`, fontWeight: 800, color,
        }}>
            {species?.[0] || 'P'}
        </div>
    );
};

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const STATUS_META: Record<string, { label: string; badge: string; color: string; indicator: string }> = {
    PENDING: { label: 'Pending', badge: 'badge-warning', color: '#fbbf24', indicator: 'Pending' },
    AI_REVIEWED: { label: 'Reviewed', badge: 'badge-blue', color: '#4eb8ff', indicator: 'Analyzed' },
    VET_REVIEWED: { label: 'Vet Reviewed', badge: 'badge-success', color: '#34d399', indicator: 'Reviewed' },
    RESOLVED: { label: 'Resolved', badge: 'badge-success', color: '#34d399', indicator: 'Resolved' },
};

const statusBadge = (status: string): string => STATUS_META[status]?.badge || 'badge-purple';

const SYMPTOM_CHIPS = [
    'Lethargy / low energy', 'Not eating / loss of appetite', 'Vomiting', 'Diarrhea',
    'Excessive scratching', 'Limping / difficulty walking', 'Coughing / sneezing', 'Swollen area',
];

/* Expandable History Card */
const HistoryCard = ({ c, onDelete, onReview, isVet, isAdmin }: {
    c: Consultation; onDelete: (id: number) => void;
    onReview?: (c: Consultation) => void; isVet?: boolean; isAdmin?: boolean;
}) => {
    const [expanded, setExpanded] = useState(false);
    const meta = STATUS_META[c.status] ?? STATUS_META.PENDING;
    return (
        <div style={{ ...hCard.root, borderLeft: `3px solid ${meta.color}` }}>
            {/* Header row */}
            <div style={hCard.header} onClick={() => setExpanded(v => !v)}>
                <div style={hCard.petInfo}>
                    <SpeciesBadge species={c.pet?.species} size={36} />
                    <div>
                        <div style={hCard.petName}>{c.pet?.name || 'Unknown'}</div>
                        <div style={hCard.dateText}>{c.createdAt ? fmtDate(c.createdAt) : ''}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ ...hCard.statusPill, background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}40` }}>
                        {meta.indicator}
                    </span>
                    <span style={{ color: '#4a5080', fontSize: '0.8rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▾</span>
                </div>
            </div>

            {/* Symptoms preview */}
            {!expanded && (
                <div style={hCard.symptomPreview}>
                    <strong style={{ color: '#8890b8' }}>Symptoms: </strong>
                    <span style={{ color: '#6b7280' }}>{c.userDescription?.slice(0, 100)}{c.userDescription?.length > 100 ? '...' : ''}</span>
                </div>
            )}

            {/* Expanded content */}
            {expanded && (
                <div style={{ marginTop: 16 }}>
                    <div style={hCard.section}>
                        <div style={hCard.sectionLabel}>Reported Symptoms</div>
                        <p style={hCard.sectionText}>{c.userDescription}</p>
                    </div>

                    {c.aiPreliminaryDiagnosis && (
                        <div style={{ ...hCard.section, background: 'rgba(78,184,255,0.05)', border: '1px solid rgba(78,184,255,0.15)', borderRadius: 12 }}>
                            <div style={{ ...hCard.sectionLabel, color: '#4eb8ff' }}>Preliminary Analysis</div>
                            <div style={{ fontSize: '0.88rem', lineHeight: 1.75, color: '#c5c8e8' }}>
                                <ReactMarkdown>{c.aiPreliminaryDiagnosis}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {c.vetFinalDiagnosis && (
                        <div style={{ ...hCard.section, background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 12 }}>
                            <div style={{ ...hCard.sectionLabel, color: '#34d399' }}>Vet Final Diagnosis</div>
                            <p style={hCard.sectionText}>{c.vetFinalDiagnosis}</p>
                        </div>
                    )}

                    {c.treatmentRecommendation && (
                        <div style={{ ...hCard.section, background: 'rgba(124,106,245,0.06)', border: '1px solid rgba(124,106,245,0.2)', borderRadius: 12 }}>
                            <div style={{ ...hCard.sectionLabel, color: '#a89cf5' }}>Treatment Recommendation</div>
                            <p style={hCard.sectionText}>{c.treatmentRecommendation}</p>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                        {(isVet || isAdmin) && c.status === 'AI_REVIEWED' && onReview && (
                            <button className="btn btn-primary btn-sm" onClick={() => onReview(c)}>+ Add Vet Review</button>
                        )}
                        {(isVet || isAdmin) && c.status === 'VET_REVIEWED' && onReview && (
                            <button className="btn btn-secondary btn-sm" onClick={() => onReview(c)}>Edit Review</button>
                        )}
                        {/* Only show delete once — for owner (non-vet) OR for admin */}
                        {(!isVet || isAdmin) && (
                            <button style={S.deleteBtnSm} onClick={() => onDelete(c.id)}>Delete</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const hCard: Record<string, React.CSSProperties> = {
    root: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', marginBottom: 2 },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 },
    petInfo: { display: 'flex', alignItems: 'center', gap: 12 },
    petName: { fontWeight: 700, fontSize: '0.95rem', color: '#e0e4ff' },
    dateText: { fontSize: '0.75rem', color: '#4a5080', marginTop: 2 },
    statusPill: { fontSize: '0.72rem', fontWeight: 700, borderRadius: 100, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: '0.04em' },
    symptomPreview: { marginTop: 10, fontSize: '0.85rem', lineHeight: 1.5 },
    section: { marginBottom: 12, padding: '10px 12px' },
    sectionLabel: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8890b8', marginBottom: 6 },
    sectionText: { fontSize: '0.88rem', color: '#c5c8e8', lineHeight: 1.6 },
};

const ConsultationPage = () => {
    const { user } = useAuth();
    const isVet = user?.role === 'VET';
    const isAdmin = user?.role === 'ADMIN';

    const [pets, setPets] = useState<Pet[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [selectedPetId, setSelectedPetId] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [result, setResult] = useState<string>('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Vet review modal
    const [reviewModal, setReviewModal] = useState<Consultation | null>(null);
    const [vetDiagnosis, setVetDiagnosis] = useState('');
    const [vetTreatment, setVetTreatment] = useState('');
    const [reviewSaving, setReviewSaving] = useState(false);

    const fetchData = async () => {
        const [petsRes, consultRes] = await Promise.allSettled([
            api.get('/api/pets'),
            api.get('/api/consultations'),
        ]);
        const p = petsRes.status === 'fulfilled' ? petsRes.value.data : [];
        setPets(p);
        if (p.length > 0) setSelectedPetId(String(p[0].id));
        setConsultations(consultRes.status === 'fulfilled' ? consultRes.value.data : []);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleImageSelect = (file: File) => {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) handleImageSelect(file);
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setResult('');
        if (!imageFile) { setError('Please upload a photo of your pet.'); return; }
        if (!symptoms.trim()) { setError('Please describe the symptoms.'); return; }
        setAnalyzing(true);
        try {
            const base64 = imagePreview.split(',')[1];
            const res = await api.post('/api/consultations/analyze', {
                petId: Number(selectedPetId),
                base64Image: base64,
                mimeType: imageFile.type,
                symptoms,
            });
            setResult(res.data.aiPreliminaryDiagnosis);
            setConsultations((prev) => [res.data, ...prev]);
            setImageFile(null); setImagePreview(''); setSymptoms('');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Analysis failed. Please check your connection and try again.');
        }
        setAnalyzing(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this consultation record?')) return;
        try {
            await api.delete(`/api/consultations/${id}`);
            setConsultations(prev => prev.filter(c => c.id !== id));
        } catch { alert('Failed to delete consultation.'); }
    };

    const openReview = (c: Consultation) => {
        setReviewModal(c);
        setVetDiagnosis(c.vetFinalDiagnosis || '');
        setVetTreatment(c.treatmentRecommendation || '');
    };

    const handleVetReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewModal) return;
        setReviewSaving(true);
        try {
            const res = await api.put(`/api/consultations/${reviewModal.id}/vet-review`, {
                vetDiagnosis, treatment: vetTreatment,
            });
            setConsultations(prev => prev.map(c => c.id === reviewModal.id ? res.data : c));
            setReviewModal(null);
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Failed to save review.');
        }
        setReviewSaving(false);
    };

    // VET / ADMIN VIEW
    if (isVet || isAdmin) {
        return (
            <div>
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>
                        {isVet ? 'Vet Review Queue' : 'All Consultations'}
                    </h2>
                    <p style={{ color: '#8890b8', marginTop: 4 }}>
                        {isVet
                            ? 'Review diagnosed cases and add your professional assessment'
                            : 'All consultation records across the platform'}
                    </p>
                </div>

                {loading ? <LoadingSpinner size={44} /> : consultations.length === 0 ? (
                    <div style={styles.emptyCard}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f0f2ff', marginBottom: 8 }}>No consultations yet</div>
                        <p style={{ color: '#8890b8', marginTop: 6 }}>Pet owners will appear here after requesting a health assessment.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {consultations.map((c) => (
                            <div key={c.id} className="card" style={{ padding: 22, borderLeft: `4px solid ${c.status === 'VET_REVIEWED' ? '#34d399' : '#4eb8ff'}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                            <SpeciesBadge species={c.pet?.species} size={32} />
                                            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f0f2ff' }}>{c.pet?.name || 'Unknown'}</span>
                                            <span className={`badge ${statusBadge(c.status)}`}>{STATUS_META[c.status]?.label || c.status.replace('_', ' ')}</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#8890b8', marginBottom: 8, lineHeight: 1.5 }}>
                                            <strong style={{ color: '#c5c8e8' }}>Symptoms: </strong>{c.userDescription}
                                        </p>
                                        {c.aiPreliminaryDiagnosis && (
                                            <div style={{ ...styles.previewText, marginBottom: 8 }}>
                                                <strong style={{ color: '#4eb8ff', fontSize: '0.78rem' }}>Preliminary Analysis: </strong>
                                                <span style={{ color: '#8890b8', fontSize: '0.82rem' }}>
                                                    {c.aiPreliminaryDiagnosis.replace(/\*\*/g, '').slice(0, 200)}...
                                                </span>
                                            </div>
                                        )}
                                        {c.vetFinalDiagnosis && (
                                            <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 8, padding: '8px 12px' }}>
                                                <strong style={{ color: '#34d399', fontSize: '0.78rem' }}>Vet Diagnosis: </strong>
                                                <span style={{ color: '#c5c8e8', fontSize: '0.82rem' }}>{c.vetFinalDiagnosis}</span>
                                            </div>
                                        )}
                                        {c.createdAt && (
                                            <div style={{ fontSize: '0.72rem', color: '#4a5080', marginTop: 8 }}>
                                                {fmtDate(c.createdAt)}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {c.status === 'AI_REVIEWED' && (
                                            <button className="btn btn-primary btn-sm" onClick={() => openReview(c)}>
                                                + Add Vet Review
                                            </button>
                                        )}
                                        {c.status === 'VET_REVIEWED' && (
                                            <button className="btn btn-secondary btn-sm" onClick={() => openReview(c)}>
                                                Edit Review
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button style={styles.deleteBtn} onClick={() => handleDelete(c.id)}>Delete</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Vet Review Modal */}
                {reviewModal && (
                    <div className="modal-overlay" onClick={() => setReviewModal(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                            <div className="modal-header">
                                <h3>Vet Review — {reviewModal.pet?.name}</h3>
                                <button className="btn btn-icon btn-secondary" onClick={() => setReviewModal(null)}>✕</button>
                            </div>
                            <div style={{ ...styles.previewText, marginBottom: 16, fontSize: '0.85rem' }}>
                                <strong style={{ color: '#4eb8ff' }}>Analysis: </strong>
                                <span style={{ color: '#8890b8' }}>{reviewModal.aiPreliminaryDiagnosis?.replace(/\*\*/g, '').slice(0, 300)}...</span>
                            </div>
                            <form onSubmit={handleVetReview}>
                                <div className="form-group">
                                    <label className="form-label">Final Diagnosis *</label>
                                    <textarea className="form-textarea" rows={3}
                                        placeholder="Your professional diagnosis..."
                                        value={vetDiagnosis} onChange={e => setVetDiagnosis(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Treatment Recommendation *</label>
                                    <textarea className="form-textarea" rows={3}
                                        placeholder="Recommended treatment plan, medications, follow-up instructions..."
                                        value={vetTreatment} onChange={e => setVetTreatment(e.target.value)} required />
                                </div>
                                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={reviewSaving}>
                                        {reviewSaving ? 'Saving...' : 'Save Review'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // PET OWNER VIEW
    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>Health Assessment</h2>
                <p style={{ color: '#8890b8', marginTop: 4 }}>
                    Upload a photo and describe symptoms for a preliminary analysis
                </p>
            </div>

            <div className="grid-2" style={{ alignItems: 'flex-start', gap: 28 }}>
                {/* Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div style={styles.iconBox}>Hlth</div>
                            <div>
                                <h3 style={{ marginBottom: 2 }}>New Consultation</h3>
                                <p style={{ color: '#8890b8', fontSize: '0.85rem' }}>Preliminary health analysis</p>
                            </div>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}
                        {!loading && pets.length === 0 && (
                            <div className="alert alert-info">Add a pet first from the My Pets page before running a diagnosis.</div>
                        )}

                        <form onSubmit={handleAnalyze}>
                            <div className="form-group">
                                <label className="form-label">Pet Photo *</label>
                                <div
                                    style={{ ...styles.dropzone, ...(dragOver ? styles.dropzoneActive : {}) }}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <div style={{ position: 'relative', width: '100%' }}>
                                            <img src={imagePreview} alt="preview" style={styles.previewImg} />
                                            <div style={styles.changeOverlay}>Click to change photo</div>
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', pointerEvents: 'none' }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#6b7490', marginBottom: 8 }}>Upload Photo</div>
                                            <div style={{ fontWeight: 600, marginBottom: 4, color: '#c5c8e8' }}>Drag and drop or click to upload</div>
                                            <div style={{ color: '#4a5080', fontSize: '0.82rem' }}>Supports JPG, PNG, WEBP</div>
                                        </div>
                                    )}
                                    <input ref={fileInputRef} id="consult-image" type="file" accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => { if (e.target.files?.[0]) handleImageSelect(e.target.files[0]); }} />
                                </div>
                            </div>

                            {/* Quick symptom chips */}
                            <div className="form-group">
                                <label className="form-label">Common Symptoms</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                    {SYMPTOM_CHIPS.map(chip => (
                                        <button key={chip} type="button"
                                            style={{
                                                padding: '5px 12px', borderRadius: 100, fontSize: '0.8rem',
                                                background: symptoms.includes(chip) ? 'rgba(124,106,245,0.15)' : 'rgba(255,255,255,0.05)',
                                                border: symptoms.includes(chip) ? '1px solid rgba(124,106,245,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                                color: symptoms.includes(chip) ? '#a89cf5' : '#8890b8',
                                                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                                                transition: 'all 0.2s',
                                            }}
                                            onClick={() => setSymptoms(s => s ? `${s}, ${chip}` : chip)}
                                        >
                                            {chip}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Pet *</label>
                                <select id="consult-pet" className="form-select" value={selectedPetId}
                                    onChange={(e) => setSelectedPetId(e.target.value)} required>
                                    {pets.map((p) => (
                                        <option key={p.id} value={p.id}>{p.species} — {p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Describe Symptoms *</label>
                                <textarea id="consult-symptoms" className="form-textarea" rows={4}
                                    placeholder="e.g. Scratching ears, red patches on skin, lethargy for 2 days, not eating well..."
                                    value={symptoms} onChange={(e) => setSymptoms(e.target.value)} required />
                            </div>

                            <button id="consult-analyze-btn" type="submit" className="btn btn-primary"
                                disabled={analyzing || pets.length === 0 || loading}
                                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
                                {analyzing
                                    ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Analyzing...</>
                                    : 'Start Analysis'}
                            </button>
                        </form>
                    </div>

                    {result && (
                        <div className="card" style={{ border: '1px solid rgba(78,184,255,0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div style={{ ...styles.iconBox, background: 'rgba(78,184,255,0.12)', color: '#4eb8ff' }}>Anls</div>
                                <h4>Preliminary Analysis</h4>
                                <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>Complete</span>
                            </div>
                            <div style={styles.resultBox}>
                                <ReactMarkdown>{result}</ReactMarkdown>
                            </div>
                            <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0, fontSize: '0.85rem' }}>
                                This is a preliminary analysis. Always consult a licensed veterinarian.
                            </div>
                        </div>
                    )}
                </div>

                {/* History */}
                <div>
                    <h3 style={{ marginBottom: 16 }}>Consultation History</h3>
                    {loading ? (
                        <LoadingSpinner size={36} />
                    ) : consultations.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                            <div style={{ fontWeight: 700, color: '#6b7490', marginBottom: 8 }}>No consultations yet</div>
                            <p>Analyze your first case using the form.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {consultations.map((c) => (
                                <HistoryCard
                                    key={c.id} c={c}
                                    onDelete={handleDelete}
                                    onReview={openReview}
                                    isVet={isVet} isAdmin={isAdmin}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Vet Review Modal */}
            {reviewModal && (
                <div className="modal-overlay" onClick={() => setReviewModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <div className="modal-header">
                            <h3>Vet Review — {reviewModal.pet?.name}</h3>
                            <button className="btn btn-icon btn-secondary" onClick={() => setReviewModal(null)}>✕</button>
                        </div>
                        <div style={{ ...styles.previewText, marginBottom: 16, fontSize: '0.85rem' }}>
                            <strong style={{ color: '#4eb8ff' }}>Analysis: </strong>
                            <span style={{ color: '#8890b8' }}>{reviewModal.aiPreliminaryDiagnosis?.replace(/\*\*/g, '').slice(0, 300)}...</span>
                        </div>
                        <form onSubmit={handleVetReview}>
                            <div className="form-group">
                                <label className="form-label">Final Diagnosis *</label>
                                <textarea className="form-textarea" rows={3}
                                    placeholder="Your professional diagnosis after reviewing the analysis and symptoms..."
                                    value={vetDiagnosis} onChange={e => setVetDiagnosis(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Treatment Recommendation *</label>
                                <textarea className="form-textarea" rows={3}
                                    placeholder="Recommended treatment plan, medications, follow-up instructions..."
                                    value={vetTreatment} onChange={e => setVetTreatment(e.target.value)} required />
                            </div>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setReviewModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={reviewSaving}>
                                    {reviewSaving ? 'Saving...' : 'Save Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const S: Record<string, React.CSSProperties> = {
    deleteBtnSm: {
        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
        borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem',
        color: '#f87171', fontFamily: 'inherit', fontWeight: 600,
    },
};

const styles: Record<string, React.CSSProperties> = {
    iconBox: {
        width: 48, height: 48, borderRadius: 14,
        background: 'rgba(255,107,139,0.12)', color: '#ff6b8b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.02em', flexShrink: 0,
        fontFamily: 'monospace',
    },
    dropzone: {
        border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 14,
        padding: '28px 24px', cursor: 'pointer', textAlign: 'center',
        transition: 'all 0.2s', minHeight: 160, display: 'flex',
        alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
    },
    dropzoneActive: { borderColor: '#7c6af5', background: 'rgba(124,106,245,0.05)' },
    previewImg: { width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, display: 'block' },
    changeOverlay: {
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: '0.9rem',
    },
    resultBox: {
        background: 'rgba(78,184,255,0.05)', border: '1px solid rgba(78,184,255,0.15)',
        borderRadius: 12, padding: '16px 18px', fontSize: '0.9rem', lineHeight: 1.75, color: '#c5c8e8',
    },
    previewText: { background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px' },
    emptyCard: {
        textAlign: 'center', padding: '80px 40px',
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24,
    },
    deleteBtn: {
        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
        borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem',
        color: '#f87171', fontFamily: 'inherit', fontWeight: 600,
    },
};

export default ConsultationPage;
