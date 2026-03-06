import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(form.email, form.password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.root}>
            <div style={styles.card} className="glass anim-fade-up">
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logoIcon}><span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>PC</span></div>
                    <h2 style={{ marginBottom: 6 }}>Welcome back</h2>
                    <p style={{ color: '#8890b8', fontSize: '0.9rem' }}>Sign in to your PetCare account</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email address</label>
                        <input id="login-email" name="email" type="email" className="form-input"
                            placeholder="you@example.com" value={form.email}
                            onChange={handleChange} required autoFocus />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input id="login-password" name="password" type="password" className="form-input"
                            placeholder="••••••••" value={form.password}
                            onChange={handleChange} required />
                    </div>

                    <button id="login-submit" type="submit" className="btn btn-primary"
                        disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                        {loading ? <><span className="spinner" />Signing in…</> : 'Sign In →'}
                    </button>
                </form>

                <div style={styles.footer}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#7c6af5', fontWeight: 600 }}>Create one free</Link>
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
        width: '100%', maxWidth: 440,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 28, padding: 40,
        position: 'relative', zIndex: 1,
    },
    header: { textAlign: 'center', marginBottom: 32 },
    logoIcon: {
        width: 60, height: 60, borderRadius: 18,
        background: 'linear-gradient(135deg, #7c6af5, #4eb8ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
    },
    footer: { textAlign: 'center', marginTop: 24, color: '#8890b8', fontSize: '0.9rem' },
};

export default LoginPage;
