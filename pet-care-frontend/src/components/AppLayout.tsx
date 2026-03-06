import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import api from '../api/axiosConfig';

interface Props { children: React.ReactNode; }

interface SearchResult {
    type: 'pet' | 'appointment' | 'consultation' | 'medication' | 'adoption';
    label: string;
    sub: string;
    typeLabel: string;
    link: string;
}

const formatNotifTime = (iso: string): string => {
    try {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 7) return `${diffDay}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
};
const AppLayout = ({ children }: Props) => {
    const navigate = useNavigate();
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [searching, setSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Notifications
    const [notifications, setNotifications] = useState<{ id: number; title: string; text: string; time: string; read: boolean }[]>([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Listen for sidebar collapse
    useEffect(() => {
        const observe = () => {
            const aside = document.querySelector('aside');
            if (aside) {
                const w = aside.getBoundingClientRect().width;
                setSidebarWidth(w);
            }
        };
        const ro = new ResizeObserver(observe);
        const aside = document.querySelector('aside');
        if (aside) ro.observe(aside);
        observe();
        return () => ro.disconnect();
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifPanel(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Load notifications from API
    const loadNotifications = async () => {
        try {
            const res = await api.get('/api/notifications');
            const notifs = (res.data || []).map((n: any) => ({
                id: n.id,
                title: n.title || '',
                text: n.message || n.title || '',
                time: n.createdAt ? formatNotifTime(n.createdAt) : '',
                read: n.read,
            }));
            setNotifications(notifs);
        } catch {
            // silently fail
        }
    };
    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Search logic
    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            const q = searchQuery.toLowerCase();
            const results: SearchResult[] = [];

            try {
                const [petsRes, apptRes, consRes, medRes, adoptRes] = await Promise.allSettled([
                    api.get('/api/pets'),
                    api.get('/api/appointments'),
                    api.get('/api/consultations'),
                    api.get('/api/medications'),
                    api.get('/api/adoption'),
                ]);

                if (petsRes.status === 'fulfilled') {
                    petsRes.value.data.filter((p: any) =>
                        p.name?.toLowerCase().includes(q) || p.species?.toLowerCase().includes(q) || p.breed?.toLowerCase().includes(q)
                    ).slice(0, 3).forEach((p: any) => results.push({
                        type: 'pet', label: p.name, sub: `${p.species} · ${p.breed || ''}`, typeLabel: 'Pet', link: '/pets',
                    }));
                }
                if (apptRes.status === 'fulfilled') {
                    apptRes.value.data.filter((a: any) =>
                        a.pet?.name?.toLowerCase().includes(q) || a.reason?.toLowerCase().includes(q) ||
                        a.vet?.firstName?.toLowerCase().includes(q) || a.vet?.lastName?.toLowerCase().includes(q)
                    ).slice(0, 3).forEach((a: any) => results.push({
                        type: 'appointment', label: `${a.pet?.name || 'Appointment'} — ${a.reason || a.serviceType}`,
                        sub: `Dr. ${a.vet?.firstName || ''} ${a.vet?.lastName || ''} · ${a.status}`, typeLabel: 'Appointment', link: '/appointments',
                    }));
                }
                if (consRes.status === 'fulfilled') {
                    consRes.value.data.filter((c: any) =>
                        c.pet?.name?.toLowerCase().includes(q) || c.symptoms?.toLowerCase().includes(q) || c.diagnosis?.toLowerCase().includes(q)
                    ).slice(0, 3).forEach((c: any) => results.push({
                        type: 'consultation', label: `${c.pet?.name || 'Consultation'} — ${c.symptoms || ''}`,
                        sub: c.diagnosis || c.status || '', typeLabel: 'Health Check', link: '/consultations',
                    }));
                }
                if (medRes.status === 'fulfilled') {
                    medRes.value.data.filter((m: any) =>
                        m.name?.toLowerCase().includes(q) || m.pet?.name?.toLowerCase().includes(q)
                    ).slice(0, 3).forEach((m: any) => results.push({
                        type: 'medication', label: m.name, sub: `${m.pet?.name || ''} · ${m.dosage || ''}`, typeLabel: 'Medication', link: '/medications',
                    }));
                }
                if (adoptRes.status === 'fulfilled') {
                    adoptRes.value.data.filter((a: any) =>
                        a.petName?.toLowerCase().includes(q) || a.breed?.toLowerCase().includes(q) || a.location?.toLowerCase().includes(q)
                    ).slice(0, 3).forEach((a: any) => results.push({
                        type: 'adoption', label: a.petName, sub: `${a.breed || ''} · ${a.location || ''}`, typeLabel: 'Adoption', link: '/adoption',
                    }));
                }
            } catch { /* ignore */ }

            setSearchResults(results);
            setShowResults(true);
            setSearching(false);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const unreadCount = notifications.filter(n => !n.read).length;
    const markAllRead = async () => {
        try {
            await api.put('/api/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch { /* ignore */ }
    };
    const markOneRead = async (id: number) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch { /* ignore */ }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0d0f18' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: sidebarWidth,
                transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',
                minWidth: 0,
                background: '#0d0f18',
            }}>
                {/* Top bar */}
                <div style={topBarStyle}>
                    <div ref={searchRef} style={{ ...searchBarStyle, position: 'relative' }}>
                        <span style={{ color: '#4a5080', fontSize: '0.85rem', fontWeight: 600, userSelect: 'none' }}>Search</span>
                        <input
                            placeholder="Pets, appointments, medications…"
                            style={searchInputStyle}
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
                            onFocus={() => searchQuery.trim() && setShowResults(true)}
                        />
                        {searching && <span style={{ color: '#7c6af5', fontSize: '0.75rem', fontWeight: 600 }}>...</span>}

                        {/* Search Results Dropdown */}
                        {showResults && searchQuery.trim() && (
                            <div style={dropdownStyle}>
                                {searchResults.length === 0 ? (
                                    <div style={{ padding: '16px 20px', color: '#4a5080', textAlign: 'center', fontSize: '0.85rem' }}>
                                        {searching ? 'Searching...' : 'No results found'}
                                    </div>
                                ) : (
                                    searchResults.map((r, i) => (
                                        <div key={i} style={resultItemStyle}
                                            onClick={() => { navigate(r.link); setShowResults(false); setSearchQuery(''); }}
                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,106,245,0.08)')}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ color: '#e0e4ff', fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                                                <div style={{ color: '#4a5080', fontSize: '0.75rem', marginTop: 2 }}>{r.sub}</div>
                                            </div>
                                            <span style={{ color: '#4a5080', fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 700, flexShrink: 0, letterSpacing: '0.05em' }}>{r.typeLabel}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div ref={notifRef} style={{ position: 'relative' }}>
                            <button style={iconBtnStyle} title="Notifications" onClick={() => setShowNotifPanel(!showNotifPanel)}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: showNotifPanel ? '#a89cf5' : '#6b7490' }}>Alerts</span>
                                {unreadCount > 0 && (
                                    <span style={badgeCountStyle}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </button>

                            {/* Notification Panel */}
                            {showNotifPanel && (
                                <div style={notifPanelStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        <span style={{ color: '#f0f2ff', fontWeight: 700, fontSize: '0.92rem' }}>Notifications</span>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#7c6af5', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#4a5080', fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: 700, marginBottom: 6, color: '#6b7490' }}>No notifications</div>
                                            <div style={{ fontSize: '0.78rem' }}>You're all caught up</div>
                                        </div>
                                    ) : (
                                        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                            {notifications.map(n => (
                                                <div key={n.id} style={{ ...notifItemStyle, opacity: n.read ? 0.5 : 1, cursor: n.read ? 'default' : 'pointer' }}
                                                    onClick={() => !n.read && markOneRead(n.id)}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        {n.title && <div style={{ color: '#f0f2ff', fontSize: '0.84rem', fontWeight: 700, marginBottom: 2 }}>{n.title}</div>}
                                                        <div style={{ color: '#c5c8e8', fontSize: '0.82rem', lineHeight: 1.4 }}>{n.text}</div>
                                                        <div style={{ color: '#4a5080', fontSize: '0.72rem', marginTop: 4 }}>{n.time}</div>
                                                    </div>
                                                    {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c6af5', flexShrink: 0 }} />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <div style={{ padding: '24px 32px 60px' }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

const topBarStyle: React.CSSProperties = {
    height: 64,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 32px',
    background: 'rgba(8,10,20,0.92)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    position: 'sticky', top: 0, zIndex: 100,
};

const searchBarStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: '8px 16px', flex: 1, maxWidth: 420,
};

const searchInputStyle: React.CSSProperties = {
    background: 'none', border: 'none', outline: 'none',
    color: '#c5c8e8', fontSize: '0.88rem', fontFamily: 'inherit',
    flex: 1,
};

const iconBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: '0 14px', height: 38,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit',
    position: 'relative',
};

const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
    background: '#12162a', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    zIndex: 200, overflow: 'hidden',
};

const resultItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 18px', cursor: 'pointer', transition: 'background 0.15s',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
};

const badgeCountStyle: React.CSSProperties = {
    position: 'absolute', top: -4, right: -4,
    background: '#f87171', color: '#fff',
    fontSize: '0.6rem', fontWeight: 800,
    width: 18, height: 18, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid #0d0f18',
};

const notifPanelStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
    width: 360, background: '#12162a',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    zIndex: 200, overflow: 'hidden',
};

const notifItemStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    transition: 'background 0.15s',
};

export default AppLayout;
