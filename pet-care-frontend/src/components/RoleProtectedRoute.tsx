import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
    children: React.ReactElement;
    allowedRoles: string[];
    /** Where to redirect if the role check fails. Defaults to '/dashboard' */
    redirectTo?: string;
}

/**
 * Extends ProtectedRoute – also checks that the logged-in user has one of the
 * `allowedRoles`. Redirects unauthenticated users to /login, and users with the
 * wrong role to `redirectTo` (default: /dashboard).
 */
const RoleProtectedRoute = ({ children, allowedRoles, redirectTo = '/dashboard' }: Props) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default RoleProtectedRoute;
