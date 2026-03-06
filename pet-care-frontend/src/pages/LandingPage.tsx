import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
    {
        icon: 'HLT',
        title: 'Health Assessments',
        desc: 'Describe your pet\'s symptoms and receive preliminary guidance to help you make informed decisions before visiting a clinic.',
        color: '#7c6af5',
    },
    {
        icon: 'APT',
        title: 'Appointment Booking',
        desc: 'Schedule in-clinic visits, video consultations, or emergency services with licensed veterinarians — all from one place.',
        color: '#4eb8ff',
    },
    {
        icon: 'MED',
        title: 'Medication Tracking',
        desc: 'Keep an organized log of prescriptions, dosages, and refill schedules so nothing falls through the cracks.',
        color: '#ff6b8b',
    },
    {
        icon: 'PET',
        title: 'Pet Health Records',
        desc: 'Maintain a complete profile for each pet — species, breed, weight, vaccination history, and surgical records in one dashboard.',
        color: '#34d399',
    },
    {
        icon: 'SRG',
        title: 'Surgical Management',
        desc: 'Track pre-op, post-op, and recovery stages for surgeries with real-time status updates from your veterinary team.',
        color: '#fbbf24',
    },
    {
        icon: 'ADT',
        title: 'Pet Adoption',
        desc: 'Browse or list pets available for adoption. Connect with pet owners and find a loving home for animals in need.',
        color: '#f472b6',
    },
];

const LandingPage = () => {
    const { user } = useAuth();
    return (
        <div style={styles.root}>

            {/* Hero */}
            <section style={styles.hero} className="container">
                <div style={styles.heroBadge}>
                    <span style={styles.heroBadgeDot} />
                    Trusted Pet Healthcare Platform
                </div>

                <h1 style={styles.heroTitle}>
                    Complete care for your<br />
                    <span style={{ color: '#7c6af5' }}>companion's health</span>
                </h1>

                <p style={styles.heroDesc}>
                    Book appointments with certified veterinarians, track medications, manage
                    health records, and get symptom guidance — all in one secure platform
                    built for pet owners and clinics.
                </p>

                <div style={styles.heroActions}>
                    {user ? (
                        <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                            Go to Dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                                Create Free Account
                            </Link>
                            <Link to="/login" className="btn btn-secondary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
                                Sign In
                            </Link>
                        </>
                    )}
                </div>

                {/* Trust bar */}
                <div style={styles.trustBar}>
                    <TrustItem text="Free for pet owners" />
                    <TrustItem text="Licensed veterinarians" />
                    <TrustItem text="Secure and private" />
                    <TrustItem text="No credit card required" />
                </div>
            </section>

            {/* Features */}
            <section id="features" style={styles.features}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <p style={styles.sectionTag}>Features</p>
                        <h2 style={styles.sectionTitle}>
                            Everything you need to manage pet health
                        </h2>
                        <p style={{ color: '#8890b8', maxWidth: 520, margin: '12px auto 0', lineHeight: 1.7 }}>
                            A single platform for pet owners and veterinary professionals to collaborate on animal care.
                        </p>
                    </div>

                    <div className="grid-3" style={{ gap: 20 }}>
                        {FEATURES.map((feat) => (
                            <div key={feat.title} style={styles.featureCard}>
                                <div style={{ ...styles.featureIcon, background: `${feat.color}15`, color: feat.color }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.02em' }}>{feat.icon}</span>
                                </div>
                                <h4 style={{ marginBottom: 8, fontSize: '1.05rem', color: '#e0e4ff' }}>{feat.title}</h4>
                                <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: '#8890b8' }}>{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" style={styles.howItWorks}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <p style={styles.sectionTag}>Getting Started</p>
                        <h2 style={styles.sectionTitle}>Up and running in 3 simple steps</h2>
                        <p style={{ color: '#8890b8', maxWidth: 480, margin: '12px auto 0' }}>
                            Create your account today and start managing your pet's healthcare right away.
                        </p>
                    </div>

                    <div className="grid-3" style={{ gap: 32 }}>
                        {[
                            { step: '1', title: 'Create your account', desc: 'Sign up as a Pet Owner or Veterinarian. It takes less than a minute and is completely free.' },
                            { step: '2', title: 'Add your pets', desc: 'Build a health profile for each pet with breed, age, weight, and any existing medical history.' },
                            { step: '3', title: 'Start managing care', desc: 'Book vet appointments, log medications, track surgeries, or get symptom assessments — all from your dashboard.' },
                        ].map(({ step, title, desc }) => (
                            <div key={step} style={styles.stepCard}>
                                <div style={styles.stepNumber}>{step}</div>
                                <h4 style={{ marginBottom: 8, color: '#e0e4ff', fontSize: '1.05rem' }}>{title}</h4>
                                <p style={{ fontSize: '0.88rem', color: '#8890b8', lineHeight: 1.7 }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* For Vets */}
            <section style={styles.vetSection}>
                <div className="container">
                    <div style={styles.vetCard}>
                        <div style={{ flex: 1 }}>
                            <p style={{ ...styles.sectionTag, textAlign: 'left' }}>For Veterinarians</p>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: 12, color: '#f0f2ff' }}>Built for your practice, too</h3>
                            <p style={{ color: '#8890b8', lineHeight: 1.7, fontSize: '0.92rem', marginBottom: 20 }}>
                                Manage your appointment calendar, review patient cases, update surgical statuses,
                                and provide expert responses to consultations — all through a dedicated veterinary dashboard.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <VetFeature text="View and manage patient appointments" />
                                <VetFeature text="Review consultation cases and add vet notes" />
                                <VetFeature text="Track surgical procedures and recovery" />
                                <VetFeature text="Publish educational content for pet owners" />
                            </div>
                        </div>
                        <div style={styles.vetVisual}>
                            <div style={styles.vetStatsGrid}>
                                {[
                                    { label: 'Appointments', value: 'Managed' },
                                    { label: 'Patients', value: 'Tracked' },
                                    { label: 'Surgeries', value: 'Monitored' },
                                    { label: 'Records', value: 'Secured' },
                                ].map(item => (
                                    <div key={item.label} style={styles.vetStatBox}>
                                        <div style={{ fontSize: '0.7rem', color: '#4eb8ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.value}</div>
                                        <div style={{ fontSize: '0.78rem', color: '#8890b8' }}>{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={styles.cta}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <div style={styles.ctaCard}>
                        <h2 style={{ marginBottom: 12, fontSize: '1.8rem', color: '#f0f2ff' }}>
                            Start managing your pet's health today
                        </h2>
                        <p style={{ color: '#8890b8', marginBottom: 28, maxWidth: 460, margin: '0 auto 28px', lineHeight: 1.7 }}>
                            Join pet owners and veterinary professionals already using PetCare Connect
                            to simplify animal healthcare.
                        </p>
                        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/register" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 36px' }}>
                                Create Free Account
                            </Link>
                            <Link to="/login" className="btn btn-secondary" style={{ fontSize: '1rem', padding: '14px 36px' }}>
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={styles.footer}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <span style={{ color: '#3a4060', fontSize: '0.82rem' }}>© 2026 PetCare Connect. All rights reserved.</span>
                    <div style={{ display: 'flex', gap: 20 }}>
                        <span style={{ color: '#3a4060', fontSize: '0.82rem' }}>Privacy</span>
                        <span style={{ color: '#3a4060', fontSize: '0.82rem' }}>Terms</span>
                        <span style={{ color: '#3a4060', fontSize: '0.82rem' }}>Support</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const TrustItem = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>
        <span style={{ color: '#8890b8', fontSize: '0.82rem', fontWeight: 500 }}>{text}</span>
    </div>
);

const VetFeature = ({ text }: { text: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4eb8ff', flexShrink: 0 }} />
        <span style={{ color: '#c5c8e8', fontSize: '0.88rem' }}>{text}</span>
    </div>
);

const styles: Record<string, React.CSSProperties> = {
    root: { position: 'relative', overflow: 'hidden', paddingTop: 68 },
    hero: {
        paddingTop: 90, paddingBottom: 80,
        textAlign: 'center', position: 'relative',
    },
    heroBadge: {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)',
        borderRadius: 100, padding: '6px 16px', fontSize: '0.8rem',
        fontWeight: 600, color: '#34d399', marginBottom: 28,
    },
    heroBadgeDot: {
        width: 6, height: 6, borderRadius: '50%',
        background: '#34d399', display: 'inline-block',
    },
    heroTitle: {
        fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
        lineHeight: 1.15, marginBottom: 24,
        letterSpacing: '-0.03em', color: '#f0f2ff',
    },
    heroDesc: {
        fontSize: '1.05rem', color: '#8890b8',
        maxWidth: 560, margin: '0 auto 36px',
        lineHeight: 1.75,
    },
    heroActions: { display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 },
    trustBar: {
        display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap',
        padding: '20px 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
    },
    features: {
        padding: '80px 0',
        borderTop: '1px solid rgba(255,255,255,0.05)',
    },
    sectionTag: {
        fontSize: '0.75rem', fontWeight: 700, color: '#7c6af5',
        textTransform: 'uppercase' as const, letterSpacing: '0.12em',
        marginBottom: 10, textAlign: 'center' as const,
    },
    sectionTitle: { fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', letterSpacing: '-0.02em', color: '#f0f2ff' },
    featureCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '28px 24px',
        transition: 'background 0.2s, border-color 0.2s',
    },
    featureIcon: {
        width: 46, height: 46, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginBottom: 16,
        fontFamily: 'monospace',
    },
    howItWorks: {
        paddingTop: 80, paddingBottom: 80,
        borderTop: '1px solid rgba(255,255,255,0.05)',
    },
    stepCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '32px 24px',
        textAlign: 'center' as const,
    },
    stepNumber: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 10, marginBottom: 16,
        background: 'rgba(124,106,245,0.1)', border: '1px solid rgba(124,106,245,0.2)',
        fontSize: '0.9rem', fontWeight: 800, color: '#a89cf5',
    },
    vetSection: { padding: '0 0 80px' },
    vetCard: {
        display: 'flex', gap: 40, alignItems: 'center',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20, padding: '40px 36px',
        flexWrap: 'wrap' as const,
    },
    vetVisual: {
        width: 200, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    vetStatsGrid: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
    },
    vetStatBox: {
        background: 'rgba(78,184,255,0.05)',
        border: '1px solid rgba(78,184,255,0.1)',
        borderRadius: 12, padding: '16px 14px',
        textAlign: 'center' as const,
    },
    cta: { padding: '60px 0 60px' },
    ctaCard: {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, padding: '56px 40px',
    },
    footer: {
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '24px 0',
    },
};

export default LandingPage;
