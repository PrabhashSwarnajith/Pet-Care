import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Clean text-based nav icons
const NAV_ALL = [
    { path: '/dashboard', label: 'Dashboard', icon: 'DB', roles: ['USER', 'VET', 'ADMIN'] },
    { path: '/pets', label: 'My Pets', icon: 'PT', roles: ['USER'], altLabel: { VET: 'Patients', ADMIN: 'All Pets' } },
    { path: '/medications', label: 'Medications', icon: 'Rx', roles: ['USER', 'VET', 'ADMIN'] },
    { path: '/chat', label: 'Chat', icon: 'CH', roles: ['USER'] },
    { path: '/consultations', label: 'Health Check', icon: 'HC', roles: ['USER'], altLabel: { VET: 'Vet Reviews', ADMIN: 'Consultations' } },
    { path: '/appointments', label: 'Appointments', icon: 'AP', roles: ['USER', 'VET', 'ADMIN'] },
    { path: '/surgeries', label: 'Surgical', icon: 'SG', roles: ['USER', 'VET', 'ADMIN'] },
    { path: '/adoption', label: 'Adoption', icon: 'AD', roles: ['USER', 'VET', 'ADMIN'] },
    { path: '/nearby-vets', label: 'Nearby Clinics', icon: 'NC', roles: ['USER', 'VET', 'ADMIN'] },
    { path: '/education', label: 'Education Hub', icon: 'ED', roles: ['USER', 'VET', 'ADMIN'] },
    { path: '/notifications', label: 'Notifications', icon: 'NF', roles: ['VET', 'ADMIN'] },
];

const ADMIN_NAV = [
    { path: '/admin/users', label: 'User Management', icon: 'UM' },
];

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => { logout(); navigate('/'); };
    const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '';
    const role = (user?.role || 'USER') as string;
    const NAV = NAV_ALL
        .filter(item => item.roles.includes(role) || (item as any).altLabel?.[role])
        .map(item => ({
            ...item,
            label: (item as any).altLabel?.[role] || item.label,
        }));

    return (
        <aside style={{ ...styles.sidebar, width: collapsed ? 68 : 240 }}>
            {/* Logo */}
            <div style={styles.logoRow}>
                <div style={styles.logoIcon}>
                    <span style={styles.logoLetters}>PC</span>
                </div>
                {!collapsed && <span style={styles.logoText}>PetCare</span>}
                <button onClick={() => setCollapsed(!collapsed)} style={styles.collapseBtn} title="Toggle sidebar">
                    {collapsed ? '›' : '‹'}
                </button>
            </div>

            <div className="divider" style={{ margin: '8px 0' }} />

            {/* Navigation */}
            <nav style={styles.nav}>
                {NAV.map(({ path, label, icon }) => {
                    const active = location.pathname === path;
                    return (
                        <Link key={path} to={path} style={{
                            ...styles.navItem,
                            ...(active ? styles.navItemActive : {}),
                            justifyContent: collapsed ? 'center' : 'flex-start',
                        }} title={collapsed ? label : undefined}>
                            <span style={{ ...styles.navIcon, color: active ? '#c5b8ff' : '#6b7490' }}>{icon}</span>
                            {!collapsed && <span style={styles.navLabel}>{label}</span>}
                            {!collapsed && active && <span style={styles.activeDot} />}
                        </Link>
                    );
                })}

                {user?.role === 'ADMIN' && (
                    <>
                        <div className="divider" style={{ margin: '8px 0' }} />
                        <div style={styles.sectionLabel}>{!collapsed && 'Admin'}</div>
                        {ADMIN_NAV.map(({ path, label, icon }) => {
                            const active = location.pathname === path;
                            return (
                                <Link key={path} to={path} style={{
                                    ...styles.navItem,
                                    ...(active ? styles.navItemActiveAdmin : {}),
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                }} title={collapsed ? label : undefined}>
                                    <span style={{ ...styles.navIcon, color: active ? '#ffb8b8' : '#6b7490' }}>{icon}</span>
                                    {!collapsed && <span style={styles.navLabel}>{label}</span>}
                                    {!collapsed && active && <span style={{ ...styles.activeDot, background: '#f87171' }} />}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            <div style={{ flex: 1 }} />

            {/* User info + logout */}
            <div style={styles.bottomSection}>
                <div className="divider" style={{ margin: '8px 0' }} />
                {!collapsed ? (
                    <div style={styles.userRow}>
                        <div style={styles.userAvatar}>{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={styles.userName}>{user?.firstName} {user?.lastName}</div>
                            <div style={styles.userRole}>{user?.role}</div>
                        </div>
                        <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
                            Out
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                        <button onClick={handleLogout} style={styles.logoutBtnCollapsed} title="Sign Out">
                            ←
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};

const styles: Record<string, React.CSSProperties> = {
    sidebar: {
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
        background: '#080a14',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        padding: '16px 0',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
    },
    logoRow: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 14px', marginBottom: 4, height: 44,
    },
    logoIcon: {
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #7c6af5, #4eb8ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    logoLetters: {
        fontSize: '0.78rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em',
    },
    logoText: {
        fontSize: '1.05rem', fontWeight: 800, flex: 1,
        color: '#f0f2ff', whiteSpace: 'nowrap', letterSpacing: '-0.02em',
    },
    collapseBtn: {
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
        color: '#6b7490', width: 26, height: 26, borderRadius: 6,
        cursor: 'pointer', fontSize: '1rem', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontFamily: 'inherit',
        transition: 'background 0.2s',
    },
    sectionLabel: {
        fontSize: '0.65rem', fontWeight: 700, color: '#3a4060',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        padding: '0 22px', marginBottom: 4,
    },
    nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 10px' },
    navItem: {
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', borderRadius: 10,
        textDecoration: 'none', color: '#8890b8',
        transition: 'all 0.18s', position: 'relative',
    },
    navItemActive: {
        background: 'rgba(124,106,245,0.12)',
        color: '#c5b8ff',
    },
    navItemActiveAdmin: {
        background: 'rgba(248,113,113,0.12)',
        color: '#ffb8b8',
    },
    navIcon: { fontSize: '0.7rem', flexShrink: 0, width: 22, textAlign: 'center', fontWeight: 800, letterSpacing: '-0.02em' },
    navLabel: { fontSize: '0.88rem', fontWeight: 500, whiteSpace: 'nowrap', color: 'inherit' },
    activeDot: {
        width: 5, height: 5, borderRadius: '50%', background: '#7c6af5',
        marginLeft: 'auto', flexShrink: 0,
    },
    bottomSection: { padding: '0 10px' },
    userRow: {
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.03)', borderRadius: 12,
        padding: '10px 12px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    userAvatar: {
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #7c6af5, #4eb8ff)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.72rem', fontWeight: 800, color: '#fff',
    },
    userName: { fontSize: '0.83rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#e0e4ff' },
    userRole: { fontSize: '0.68rem', color: '#7c6af5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' },
    logoutBtn: {
        background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
        borderRadius: 6, color: '#f87171', fontSize: '0.68rem', fontWeight: 700,
        cursor: 'pointer', padding: '4px 8px', flexShrink: 0, fontFamily: 'inherit',
        transition: 'background 0.2s', letterSpacing: '0.03em', textTransform: 'uppercase',
    },
    logoutBtnCollapsed: {
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#6b7490', cursor: 'pointer', fontSize: '1rem', width: 36, height: 36,
        borderRadius: 8, fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
};

export default Sidebar;
