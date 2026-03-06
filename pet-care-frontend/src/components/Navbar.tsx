import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PUBLIC_LINKS = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
];

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = () => { logout(); navigate('/'); };

    const initials = user
        ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
        : '';

    const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <nav style={{
            ...styles.nav,
            background: scrolled ? 'rgba(8,10,20,0.97)' : 'rgba(8,10,20,0.80)',
            boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.5)' : 'none',
        }}>
            <div className="container" style={styles.inner}>

                {/* Logo */}
                <Link to="/" style={styles.logo}>
                    <div style={styles.logoIconBox}>
                        <span style={styles.logoLetters}>PC</span>
                    </div>
                    <span style={styles.logoText}>PetCare</span>
                    <span style={styles.logoSub}>Connect</span>
                </Link>

                {/* Center: anchor links (guests only) */}
                {!user && (
                    <div style={styles.centerLinks}>
                        {PUBLIC_LINKS.map(({ href, label }) => (
                            <a
                                key={href}
                                href={href}
                                style={styles.anchorLink}
                                onClick={(e) => handleAnchor(e, href)}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLAnchorElement).style.color = '#e0e4ff';
                                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLAnchorElement).style.color = '#8890b8';
                                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                                }}
                            >
                                {label}
                            </a>
                        ))}
                    </div>
                )}

                {/* Right section — only show when logged in */}
                {user && (
                    <div style={styles.right}>
                        <div style={styles.userChip}>
                            <div style={styles.avatar}>{initials}</div>
                            <span style={styles.userName}>
                                {user.firstName} {user.lastName}
                            </span>
                            <span style={styles.roleTag}>{user.role}</span>
                        </div>
                        <Link to="/dashboard" className="btn btn-primary btn-sm">
                            Dashboard
                        </Link>
                        <button
                            onClick={handleLogout}
                            style={styles.logoutBtn}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#e0e4ff')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#8890b8')}
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

const styles: Record<string, React.CSSProperties> = {
    nav: {
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: 68,
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
    },
    inner: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%', gap: 16,
    },
    logo: {
        display: 'flex', alignItems: 'center', gap: 8,
        textDecoration: 'none', flexShrink: 0,
    },
    logoIconBox: {
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #7c6af5, #4eb8ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    logoLetters: {
        fontSize: '0.78rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em',
    },
    logoText: {
        fontSize: '1.1rem', fontWeight: 800,
        color: '#f0f2ff', letterSpacing: '-0.02em',
    },
    logoSub: {
        fontSize: '1.1rem', fontWeight: 300, color: '#6b7490',
        letterSpacing: '-0.01em',
    },
    centerLinks: {
        display: 'flex', alignItems: 'center', gap: 4,
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
    },
    anchorLink: {
        padding: '7px 16px', borderRadius: 100, fontSize: '0.88rem',
        fontWeight: 500, color: '#8890b8', textDecoration: 'none',
        transition: 'color 0.2s, background 0.2s', cursor: 'pointer',
        display: 'inline-block',
    },
    right: {
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
    },
    loginLink: {
        padding: '8px 16px', color: '#c5c8e8', fontWeight: 500,
        fontSize: '0.88rem', textDecoration: 'none',
        transition: 'color 0.2s',
    },
    userChip: {
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 100, padding: '5px 14px 5px 5px',
    },
    avatar: {
        width: 28, height: 28, borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af5, #4eb8ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.72rem', fontWeight: 800, color: '#fff', flexShrink: 0,
    },
    userName: {
        fontSize: '0.85rem', fontWeight: 600, color: '#e0e4ff',
        whiteSpace: 'nowrap',
    },
    roleTag: {
        fontSize: '0.65rem', fontWeight: 700, color: '#7c6af5',
        textTransform: 'uppercase' as const, letterSpacing: '0.07em',
        background: 'rgba(124,106,245,0.15)',
        borderRadius: 100, padding: '2px 8px',
    },
    logoutBtn: {
        background: 'none', border: 'none', color: '#8890b8',
        fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
        fontFamily: 'inherit', padding: '8px 10px',
        borderRadius: 8, transition: 'color 0.2s',
    },
};

export default Navbar;
