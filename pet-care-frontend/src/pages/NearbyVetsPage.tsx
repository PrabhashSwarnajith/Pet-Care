import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path (broken in Webpack builds)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';

L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl: iconShadowUrl,
});

interface Clinic {
    id: number;
    name: string;
    lat: number;
    lon: number;
    address?: string;
    phone?: string;
    website?: string;
    openingHours?: string;
    distanceKm?: number;
}

interface Coords { lat: number; lon: number; }

async function fetchNearbyVets(lat: number, lon: number, radiusKm = 10): Promise<Clinic[]> {
    const radius = radiusKm * 1000; // convert to metres
    const query = `
        [out:json][timeout:25];
        (
          node["amenity"="veterinary"](around:${radius},${lat},${lon});
          way["amenity"="veterinary"](around:${radius},${lat},${lon});
          node["amenity"="animal_hospital"](around:${radius},${lat},${lon});
        );
        out center;
    `;
    const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
    });
    if (!res.ok) throw new Error('Failed to fetch nearby clinics');
    const data = await res.json();

    return (data.elements as any[])
        .map((el: any, i: number) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLon = el.lon ?? el.center?.lon;
            if (!elLat || !elLon) return null;
            const distKm = haversine(lat, lon, elLat, elLon);
            const addr = [
                el.tags?.['addr:housenumber'],
                el.tags?.['addr:street'],
                el.tags?.['addr:city'],
            ].filter(Boolean).join(', ');
            return {
                id: el.id ?? i,
                name: el.tags?.name ?? 'Veterinary Clinic',
                lat: elLat, lon: elLon,
                address: addr || el.tags?.['addr:full'] || undefined,
                phone: el.tags?.phone || el.tags?.['contact:phone'],
                website: el.tags?.website || el.tags?.['contact:website'],
                openingHours: el.tags?.opening_hours,
                distanceKm: distKm,
            } as Clinic;
        })
        .filter(Boolean)
        .sort((a, b) => (a!.distanceKm ?? 99) - (b!.distanceKm ?? 99)) as Clinic[];
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
const toRad = (deg: number) => (deg * Math.PI) / 180;

const NearbyVetsPage = () => {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markersRef = useRef<L.Marker[]>([]);

    const [coords, setCoords] = useState<Coords | null>(null);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState<Clinic | null>(null);
    const [radius, setRadius] = useState(10); // km

    // Initialise map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        const map = L.map(mapContainerRef.current, {
            center: [7.8731, 80.7718], // Sri Lanka default
            zoom: 8,
            zoomControl: true,
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);
        mapRef.current = map;
    }, []);

    // Update markers when clinics change
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // Clear old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        // Add user location marker
        if (coords) {
            const userMarker = L.marker([coords.lat, coords.lon], {
                icon: L.divIcon({
                    className: '',
                    html: `<div style="
                        width:18px; height:18px; border-radius:50%;
                        background:#7c6af5; border:3px solid #fff;
                        box-shadow:0 0 10px rgba(124,106,245,0.8);
                    "></div>`,
                    iconSize: [18, 18],
                    iconAnchor: [9, 9],
                }),
            }).addTo(map)
                .bindPopup('<b>Your Location</b>');
            markersRef.current.push(userMarker);
        }

        // Add clinic markers
        clinics.forEach((clinic, i) => {
            const marker = L.marker([clinic.lat, clinic.lon])
                .addTo(map)
                .bindPopup(`
                    <div style="min-width:180px; font-family: sans-serif;">
                        <b style="font-size:14px">${clinic.name}</b><br/>
                        ${clinic.address ? `<span style="color:#666">${clinic.address}</span><br/>` : ''}
                        ${clinic.phone ? `<span>${clinic.phone}</span><br/>` : ''}
                        ${clinic.distanceKm != null ? `<span style="color:#7c6af5">${clinic.distanceKm.toFixed(1)} km away</span>` : ''}
                        ${clinic.website ? `<br/><a href="${clinic.website}" target="_blank" rel="noreferrer">Website</a>` : ''}
                    </div>
                `);
            marker.on('click', () => setSelected(clinic));
            markersRef.current.push(marker);
        });
    }, [clinics, coords]);

    const locateMe = () => {
        if (!navigator.geolocation) {
            setError("Your browser doesn't support location access.");
            return;
        }
        setLoading(true); setError('');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const userCoords = { lat: latitude, lon: longitude };
                setCoords(userCoords);
                mapRef.current?.setView([latitude, longitude], 13);
                try {
                    const results = await fetchNearbyVets(latitude, longitude, radius);
                    setClinics(results);
                    if (results.length === 0) {
                        setError(`No veterinary clinics found within ${radius}km. Try increasing the search radius.`);
                    }
                } catch {
                    setError('Could not load nearby clinics. Please try again.');
                }
                setLoading(false);
            },
            (err) => {
                setLoading(false);
                if (err.code === 1) setError('Location access denied. Please allow location access in your browser and try again.');
                else setError('Could not get your location. Please try again.');
            },
            { timeout: 10000 }
        );
    };

    const handleSearch = async () => {
        if (!coords) { locateMe(); return; }
        setLoading(true); setError('');
        try {
            const results = await fetchNearbyVets(coords.lat, coords.lon, radius);
            setClinics(results);
            if (results.length === 0) setError(`No clinics found within ${radius}km.`);
        } catch {
            setError('Could not load nearby clinics. Try again.');
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', gap: 0 }}>
            {/* Header */}
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>Find Nearby Clinics</h2>
                <p style={{ color: '#8890b8', marginTop: 4 }}>
                    Discover veterinary clinics and animal hospitals near you using OpenStreetMap
                </p>
            </div>

            {/* Controls */}
            <div style={styles.controls}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={{ color: '#c5c8e8', fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Radius:
                    </label>
                    {[5, 10, 20, 50].map(r => (
                        <button
                            key={r}
                            style={{ ...styles.radiusBtn, ...(radius === r ? styles.radiusBtnActive : {}) }}
                            onClick={() => setRadius(r)}
                        >
                            {r}km
                        </button>
                    ))}
                </div>
                <button
                    className="btn btn-primary"
                    onClick={locateMe}
                    disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                    {loading ? (
                        <><span className="spinner" style={{ width: 16, height: 16 }} /> Searching…</>
                    ) : (
                        'Use My Location'
                    )}
                </button>
                {coords && (
                    <button className="btn btn-secondary" onClick={handleSearch} disabled={loading}>
                        Re-search Area
                    </button>
                )}
            </div>

            {/* Error */}
            {error && (
                <div style={styles.errorBanner}>{error}</div>
            )}

            {/* Map + Sidebar */}
            <div style={{ display: 'flex', flex: 1, gap: 16, minHeight: 0, marginTop: 12 }}>
                {/* Clinic list sidebar */}
                <div style={styles.sidebar}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ color: '#8890b8', fontSize: '0.85rem', fontWeight: 600 }}>
                            {clinics.length > 0
                                ? `${clinics.length} clinic${clinics.length !== 1 ? 's' : ''} found nearby`
                                : 'Click "Use My Location" to find clinics'}
                        </p>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {clinics.map(clinic => (
                            <div
                                key={clinic.id}
                                style={{
                                    ...styles.clinicItem,
                                    ...(selected?.id === clinic.id ? styles.clinicItemActive : {}),
                                }}
                                onClick={() => {
                                    setSelected(clinic);
                                    mapRef.current?.setView([clinic.lat, clinic.lon], 16);
                                    markersRef.current.find((_, i) => {
                                        const c = clinics[i - 1]; // offset by user marker
                                        return c?.id === clinic.id;
                                    })?.openPopup();
                                }}
                            >
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <div style={styles.clinicIcon}><span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#a89cf5' }}>Vet</span></div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f0f2ff', marginBottom: 2 }}>
                                            {clinic.name}
                                        </p>
                                        {clinic.address && (
                                            <p style={{ fontSize: '0.78rem', color: '#8890b8', lineHeight: 1.4 }}>
                                                {clinic.address}
                                            </p>
                                        )}
                                        {clinic.phone && (
                                            <p style={{ fontSize: '0.78rem', color: '#4eb8ff', marginTop: 2 }}>
                                                {clinic.phone}
                                            </p>
                                        )}
                                        {clinic.openingHours && (
                                            <p style={{ fontSize: '0.75rem', color: '#34d399', marginTop: 2 }}>
                                                {clinic.openingHours}
                                            </p>
                                        )}
                                    </div>
                                    {clinic.distanceKm != null && (
                                        <span style={styles.distBadge}>
                                            {clinic.distanceKm.toFixed(1)} km
                                        </span>
                                    )}
                                </div>
                                {clinic.website && (
                                    <a href={clinic.website} target="_blank" rel="noreferrer"
                                        style={{ display: 'inline-block', marginTop: 6, fontSize: '0.78rem', color: '#7c6af5' }}
                                        onClick={e => e.stopPropagation()}>
                                        Visit website
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Map container */}
                <div
                    ref={mapContainerRef}
                    style={{
                        flex: 1, borderRadius: 16, overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)',
                        minHeight: 400,
                    }}
                />
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    controls: {
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.07)',
    },
    radiusBtn: {
        padding: '5px 14px', borderRadius: 100, fontSize: '0.82rem', fontWeight: 600,
        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
        color: '#8890b8', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
    },
    radiusBtnActive: {
        background: 'rgba(124,106,245,0.2)', border: '1px solid rgba(124,106,245,0.5)',
        color: '#a89cf5',
    },
    errorBanner: {
        padding: '10px 16px', borderRadius: 10, marginTop: 8,
        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
        color: '#f87171', fontSize: '0.88rem',
    },
    sidebar: {
        width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.03)', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
    },
    clinicItem: {
        padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer', transition: 'background 0.15s',
    },
    clinicItemActive: {
        background: 'rgba(124,106,245,0.1)',
    },
    clinicIcon: {
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: 'rgba(124,106,245,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem',
    },
    distBadge: {
        fontSize: '0.72rem', fontWeight: 700, color: '#7c6af5',
        background: 'rgba(124,106,245,0.12)', borderRadius: 100,
        padding: '2px 8px', height: 'fit-content', whiteSpace: 'nowrap',
    },
};

export default NearbyVetsPage;
