import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';
import { Toast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

interface UserDto {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

const ROLES = ['USER', 'VET', 'ADMIN'];

const AdminUsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const isSelf = (userId: number) => userId === currentUser?.id;

    const handleRoleChange = async (userId: number, newRole: string) => {
        if (isSelf(userId)) { showToast('You cannot change your own role.'); return; }
        try {
            await api.put(`/api/admin/users/${userId}/role`, { role: newRole });
            showToast('Role updated successfully.');
            fetchUsers();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to update role.');
        }
    };

    const handleDelete = async (userId: number) => {
        if (isSelf(userId)) { showToast('You cannot delete your own account.'); return; }
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            await api.delete(`/api/admin/users/${userId}`);
            showToast('User deleted.');
            fetchUsers();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Failed to delete user.');
        }
    };

    return (
        <div>
            <Toast message={toast} />

            <div style={styles.header}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f0f2ff' }}>User Management</h2>
                    <p style={{ color: '#8890b8', marginTop: 4 }}>Manage roles and accounts across the platform</p>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <LoadingSpinner />
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#8890b8' }}>No users found.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Name</th>
                                    <th style={styles.th}>Email</th>
                                    <th style={styles.th}>Role</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => {
                                    const self = isSelf(u.id);
                                    return (
                                    <tr key={u.id} style={{ ...styles.tr, ...(self ? { background: 'rgba(99,102,241,0.06)' } : {}) }}>
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: 600, color: '#e0e4ff' }}>
                                                {u.firstName} {u.lastName}
                                                {self && <span style={{ marginLeft: 8, fontSize: '0.75rem', color: '#818cf8', background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 10 }}>You</span>}
                                            </div>
                                        </td>
                                        <td style={styles.td}>{u.email}</td>
                                        <td style={styles.td}>
                                            <select
                                                className="form-select"
                                                style={{ width: '120px', padding: '6px 12px', fontSize: '0.85rem', ...(self ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}
                                                value={u.role}
                                                disabled={self}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            >
                                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </td>
                                        <td style={styles.td}>
                                            {!self && (
                                                <button onClick={() => handleDelete(u.id)} style={styles.deleteBtn}>
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    header: {
        marginBottom: 24,
    },
    table: {
        width: '100%', borderCollapse: 'collapse',
    },
    th: {
        background: 'rgba(255,255,255,0.03)', color: '#8890b8', fontWeight: 600,
        textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em',
        padding: '16px 20px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)',
    },
    tr: {
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    },
    td: {
        padding: '16px 20px', color: '#c5c8e8', fontSize: '0.9rem',
    },
    deleteBtn: {
        background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)',
        padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem',
        fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.2s',
    },
};

export default AdminUsersPage;
