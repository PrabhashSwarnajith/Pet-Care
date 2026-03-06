import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
    { value: 'USER', label: 'Pet Owner', desc: 'Manage your pets and book consultations', icon: 'PO' },
    { value: 'VET', label: 'Veterinarian', desc: 'Review cases and consult with pet owners', icon: 'VT' },
];

const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', password: '', role: 'USER',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form.firstName, form.lastName, form.email, form.password, form.role);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.root}>
            <div style={styles.card} className="glass anim-fade-up">
                <div style={styles.header}>
                    <div style={styles.logoIcon}><span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>PC</span></div>
                    <h2 style={{ marginBottom: 6 }}>Create your account</h2>
                    <p style={{ color: '#8890b8', fontSize: '0.9rem' }}>Join PetCare Connect today — it's free!</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="grid-2" style={{ gap: 14, marginBottom: 0 }}>
                        <div className="form-group">
                            <label className="form-label">First name</label>
                            <input id="reg-firstname" name="firstName" type="text" className="form-input"
                                placeholder="John" value={form.firstName} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last name</label>
                            <input id="reg-lastname" name="lastName" type="text" className="form-input"
                                placeholder="Doe" value={form.lastName} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <input id="reg-email" name="email" type="email" className="form-input"
                            placeholder="you@example.com" value={form.email} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input id="reg-password" name="password" type="password" className="form-input"
                            placeholder="Min 8 characters" value={form.password} onChange={handleChange} required minLength={8} />
                    </div>

                    {/* Role selection */}
                    <div className="form-group">
                        <label className="form-label">I am a…</label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            {ROLES.map((r) => (
                                <label key={r.value} style={{
                                    ...styles.roleCard,
                                    ...(form.role === r.value ? styles.roleCardActive : {}),
                                }}>
                                    <input type="radio" name="role" value={r.value}
                                        checked={form.role === r.value} onChange={handleChange}
                                        style={{ display: 'none' }} />
                                    <div style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: 4, color: form.role === r.value ? '#a89cf5' : '#8890b8', letterSpacing: '-0.02em' }}>{r.icon}</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.label}</div>
                                    <div style={{ color: '#8890b8', fontSize: '0.75rem', marginTop: 4 }}>{r.desc}</div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <button id="reg-submit" type="submit" className="btn btn-primary"
                        disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                        {loading ? <><span className="spinner" />Creating account…</> : 'Create Account →'}
                    </button>
                </form>

                <div style={styles.footer}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#7c6af5', fontWeight: 600 }}>Sign in</Link>
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    root: {
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '100px 24px 60px',
        position: 'relative', overflow: 'hidden',
    },
    card: {
        width: '100%', maxWidth: 500,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 28, padding: 40,
        position: 'relative', zIndex: 1,
    },
    header: { textAlign: 'center', marginBottom: 28 },
    logoIcon: {
        width: 60, height: 60, borderRadius: 18,
        background: 'linear-gradient(135deg, #7c6af5, #4eb8ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
    },
    roleCard: {
        flex: 1, padding: '14px 12px', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)', cursor: 'pointer',
        textAlign: 'center', transition: 'all 0.2s ease',
        display: 'block',
    },
    roleCardActive: {
        border: '1px solid rgba(124,106,245,0.5)',
        background: 'rgba(124,106,245,0.12)',
    },
    footer: { textAlign: 'center', marginTop: 24, color: '#8890b8', fontSize: '0.9rem' },
};

export default RegisterPage;
