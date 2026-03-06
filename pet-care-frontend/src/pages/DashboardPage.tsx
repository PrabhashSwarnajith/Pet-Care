import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SPECIES_COLORS: Record<string, string> = {
    Dog: '#7c6af5', Cat: '#4eb8ff', Bird: '#34d399', Rabbit: '#fbbf24', Fish: '#f87171',
};

function buildHealthTrend(appointments: any[], consultations: any[]) {
    const now = new Date();
    const months: { month: string; consultations: number; appointments: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = MONTH_LABELS[d.getMonth()];
        const m = d.getMonth(), y = d.getFullYear();
        const aC = appointments.filter((a: any) => {
            const t = new Date(a.appointmentTime);
            return t.getMonth() === m && t.getFullYear() === y;
        }).length;
        const cC = consultations.filter((c: any) => {
            const t = new Date(c.createdAt);
            return t.getMonth() === m && t.getFullYear() === y;
        }).length;
        months.push({ month: label, consultations: cC, appointments: aC });
    }
    return months;
}

function buildWeeklyBar(appointments: any[]) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    const counts = [0, 0, 0, 0, 0, 0, 0];
    appointments.forEach((a: any) => {
        const t = new Date(a.appointmentTime);
        if (t >= startOfWeek && t < endOfWeek) counts[t.getDay()]++;
    });
    return DAY_LABELS.map((day, i) => ({ day, count: counts[i] }));
}

function buildSpeciesPie(pets: any[]) {
    const map: Record<string, number> = {};
    pets.forEach((p: any) => {
        const sp = p.species || 'Other';
        map[sp] = (map[sp] || 0) + 1;
    });
    const total = pets.length || 1;
    return Object.entries(map)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
            name: name + 's',
            value: Math.round((count / total) * 100),
            color: SPECIES_COLORS[name] || '#f87171',
        }));
}

// Species badge: colored circle with first letter
const SpeciesBadge = ({ species, size = 38 }: { species: string; size?: number }) => {
    const color = SPECIES_COLORS[species] || '#7c6af5';
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

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={tt.box}>
            <div style={tt.label}>{label}</div>
            {payload.map((p: any) => (
                <div key={p.name} style={{ color: p.color, fontSize: '0.85rem', fontWeight: 600 }}>
                    {p.name}: {p.value}
                </div>
            ))}
        </div>
    );
};
const tt: Record<string, React.CSSProperties> = {
    box: { background: '#12162a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px' },
    label: { color: '#8890b8', fontSize: '0.78rem', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase' },
};

const KpiCard = ({ label, value, delta, color, bg, to, icon }: any) => (
    <Link to={to} style={{ textDecoration: 'none' }}>
        <div style={{ ...kpi.card, background: bg, border: `1px solid ${color}22` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ ...kpi.iconBox, background: `${color}18`, color }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{icon}</span>
                </div>
                {delta !== undefined && (
                    <span style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(52,211,153,0.1)', padding: '3px 8px', borderRadius: 100 }}>
                        +{delta}%
                    </span>
                )}
            </div>
            <div style={kpi.value}>{value}</div>
            <div style={kpi.label}>{label}</div>
        </div>
    </Link>
);
const kpi: Record<string, React.CSSProperties> = {
    card: { borderRadius: 18, padding: '22px 20px', cursor: 'pointer', transition: 'transform 0.2s', height: '100%' },
    iconBox: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    value: { fontSize: '2.2rem', fontWeight: 800, lineHeight: 1, marginBottom: 6, color: '#f0f2ff' },
    label: { color: '#8890b8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' },
};

const SectionTitle = ({ title, action, to }: { title: string; action?: string; to?: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e0e4ff' }}>{title}</h3>
        {action && to && (
            <Link to={to} style={{ fontSize: '0.82rem', color: '#7c6af5', fontWeight: 600 }}>{action}</Link>
        )}
    </div>
);

const DashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ pets: 0, consultations: 0, appointments: 0, chats: 0 });
    const [pets, setPets] = useState<any[]>([]);
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [healthTrend, setHealthTrend] = useState<any[]>([]);
    const [weeklyBar, setWeeklyBar] = useState<any[]>([]);
    const [speciesPie, setSpeciesPie] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoadingData(true);
            const [p, c, a] = await Promise.allSettled([
                api.get('/api/pets'),
                api.get('/api/consultations'),
                api.get('/api/appointments'),
            ]);

            let allPets: any[] = [];
            let allConsultations: any[] = [];
            let allAppointments: any[] = [];

            if (p.status === 'fulfilled') {
                allPets = p.value.data;
                setPets(allPets.slice(0, 5));
                setStats(s => ({ ...s, pets: allPets.length }));
            }
            if (c.status === 'fulfilled') {
                allConsultations = c.value.data;
                setStats(s => ({ ...s, consultations: allConsultations.length }));
            }
            if (a.status === 'fulfilled') {
                allAppointments = a.value.data;
                setStats(s => ({ ...s, appointments: allAppointments.length }));
                const now = new Date();
                const upcomingList = allAppointments
                    .filter((ap: any) => ap.status === 'SCHEDULED' && new Date(ap.appointmentTime) >= now)
                    .sort((x: any, y: any) => new Date(x.appointmentTime).getTime() - new Date(y.appointmentTime).getTime())
                    .slice(0, 3);
                setUpcoming(upcomingList);
            }

            setHealthTrend(buildHealthTrend(allAppointments, allConsultations));
            setWeeklyBar(buildWeeklyBar(allAppointments));
            setSpeciesPie(buildSpeciesPie(allPets));
            setLoadingData(false);
        };
        load();
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const isVet = user?.role === 'VET';
    const isAdmin = user?.role === 'ADMIN';
    const petsLabel = isAdmin ? 'All Pets' : isVet ? 'Patients' : 'Total Pets';
    const consLabel = isVet ? 'Reviews' : 'Health Checks';
    const myPetsLabel = isAdmin ? 'All Pets' : isVet ? 'Your Patients' : 'My Pets';
    const subtitleText = isVet ? "Here's your clinic overview for today" : isAdmin ? "Platform-wide overview for today" : "Here's your pets' health overview for today";

    return (
        <div>
            {/* Header */}
            <div style={s.header}>
                <div>
                    <p style={s.greetSmall}>{greeting}</p>
                    <h1 style={s.greetName}>{user?.firstName} {user?.lastName}</h1>
                    <p style={{ color: '#8890b8', marginTop: 4, fontSize: '0.9rem' }}>
                        {subtitleText}
                    </p>
                </div>
                <div style={s.dateChip}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                <KpiCard icon="Pets" label={petsLabel} value={loadingData ? '...' : stats.pets} color="#7c6af5" bg="rgba(124,106,245,0.06)" to="/pets" />
                <KpiCard icon="Hlth" label={consLabel} value={loadingData ? '...' : stats.consultations} color="#ff6b8b" bg="rgba(255,107,139,0.06)" to="/consultations" />
                <KpiCard icon="Appt" label="Appointments" value={loadingData ? '...' : stats.appointments} color="#4eb8ff" bg="rgba(78,184,255,0.06)" to="/appointments" />
                <KpiCard icon="Chat" label="Chat Support" value={loadingData ? '...' : stats.chats || '--'} color="#34d399" bg="rgba(52,211,153,0.06)" to="/chat" />
            </div>

            {/* Charts Row */}
            <div className="grid-2" style={{ gap: 22, marginBottom: 22 }}>
                <div style={s.chartCard}>
                    <SectionTitle title="Health Activity (6 months)" />
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={healthTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gConsult" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#7c6af5" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#7c6af5" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gAppt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4eb8ff" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#4eb8ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: '#8890b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#8890b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem', color: '#8890b8', paddingTop: 8 }} />
                            <Area type="monotone" dataKey="consultations" name="Health Checks" stroke="#7c6af5" strokeWidth={2} fill="url(#gConsult)" dot={false} />
                            <Area type="monotone" dataKey="appointments" name="Appointments" stroke="#4eb8ff" strokeWidth={2} fill="url(#gAppt)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={s.chartCard}>
                    <SectionTitle title="Pet Species Distribution" />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <ResponsiveContainer width={180} height={180}>
                            <PieChart>
                                <Pie data={speciesPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                    paddingAngle={3} dataKey="value" strokeWidth={0}>
                                    {speciesPie.map((e) => <Cell key={e.name} fill={e.color} />)}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {speciesPie.map((item) => (
                                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.85rem', color: '#c5c8e8', flex: 1 }}>{item.name}</span>
                                    <span style={{ fontSize: '0.85rem', color: item.color, fontWeight: 700 }}>{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bar + Upcoming Row */}
            <div className="grid-2" style={{ gap: 22, marginBottom: 22 }}>
                <div style={s.chartCard}>
                    <SectionTitle title="Appointments This Week" />
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyBar} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: '#8890b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#8890b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" name="Appointments" radius={[6, 6, 0, 0]} maxBarSize={32}>
                                {weeklyBar.map((_, i) => (
                                    <Cell key={i} fill={i === new Date().getDay() ? '#7c6af5' : 'rgba(124,106,245,0.3)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Upcoming Appointments */}
                <div style={s.chartCard}>
                    <SectionTitle title="Upcoming Appointments" action="View all" to="/appointments" />
                    {loadingData ? (
                        <LoadingSpinner size={32} />
                    ) : upcoming.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#4a5080' }}>
                            <div style={{ fontWeight: 700, marginBottom: 10, color: '#6b7490' }}>No upcoming appointments</div>
                            <Link to="/appointments" style={{ color: '#7c6af5', fontSize: '0.85rem', fontWeight: 600 }}>Book one</Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {upcoming.map((appt: any) => {
                                const dt = new Date(appt.appointmentTime);
                                return (
                                    <div key={appt.id} style={s.apptRow}>
                                        <div style={s.apptDateChip}>
                                            <div style={{ fontSize: '0.68rem', color: '#7c6af5', fontWeight: 700, textTransform: 'uppercase' }}>
                                                {dt.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </div>
                                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f0f2ff', lineHeight: 1 }}>
                                                {dt.getDate()}
                                            </div>
                                            <div style={{ fontSize: '0.68rem', color: '#8890b8', fontWeight: 600 }}>
                                                {dt.toLocaleDateString('en-US', { month: 'short' })}
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e0e4ff', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <SpeciesBadge species={appt.pet?.species} size={24} />
                                                {appt.pet?.name}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#8890b8', marginTop: 2 }}>
                                                with Dr. {appt.vet?.firstName} {appt.vet?.lastName}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#4a5080', marginTop: 2 }}>{appt.reason}</div>
                                        </div>
                                        <span className="badge badge-blue" style={{ fontSize: '0.68rem', flexShrink: 0 }}>UPCOMING</span>
                                    </div>
                                );
                            })}
                            <Link to="/chat" style={s.chatCta}>
                                <span>Message a Vet</span>
                                <span style={{ marginLeft: 'auto' }}>→</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* My Pets */}
            <div style={s.chartCard}>
                <SectionTitle title={myPetsLabel} action="Manage all" to="/pets" />
                {loadingData ? (
                    <LoadingSpinner size={32} />
                ) : pets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#4a5080' }}>
                        <div style={{ fontWeight: 700, marginBottom: 10, color: '#6b7490' }}>No pets yet</div>
                        <Link to="/pets" style={{ color: '#7c6af5', fontSize: '0.85rem', fontWeight: 600 }}>Add your first pet</Link>
                    </div>
                ) : (
                    <div className="grid-3" style={{ gap: 12 }}>
                        {pets.map((pet: any) => (
                            <div key={pet.id} style={s.petRow}>
                                <SpeciesBadge species={pet.species} size={38} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.93rem', color: '#e0e4ff' }}>{pet.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#8890b8' }}>{pet.species} · {pet.breed}</div>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#4a5080' }}>{pet.age}y</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const s: Record<string, React.CSSProperties> = {
    header: {
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
    },
    greetSmall: { color: '#8890b8', fontSize: '0.88rem', marginBottom: 4 },
    greetName: { fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f0f2ff' },
    dateChip: {
        background: 'rgba(124,106,245,0.08)', border: '1px solid rgba(124,106,245,0.2)',
        borderRadius: 10, padding: '8px 16px', fontSize: '0.85rem', color: '#a89cf5', fontWeight: 600,
        alignSelf: 'flex-start',
    },
    chartCard: {
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 18, padding: '22px 24px', marginBottom: 4,
    },
    petRow: {
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    apptRow: {
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    apptDateChip: {
        width: 44, textAlign: 'center', flexShrink: 0,
        background: 'rgba(124,106,245,0.08)', borderRadius: 10, padding: '8px 4px',
        border: '1px solid rgba(124,106,245,0.18)',
    },
    chatCta: {
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(78,184,255,0.05)',
        border: '1px solid rgba(78,184,255,0.12)',
        borderRadius: 12, padding: '10px 16px', textDecoration: 'none',
        color: '#4eb8ff', fontSize: '0.85rem', fontWeight: 600,
        marginTop: 4, transition: 'all 0.2s',
    },
};

export default DashboardPage;
