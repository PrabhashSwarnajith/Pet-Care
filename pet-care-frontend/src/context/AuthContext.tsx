import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/axiosConfig';

interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    /** role defaults to 'USER' if not provided */
    register: (firstName: string, lastName: string, email: string, password: string, role?: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('pet_care_token');
        const storedUser = localStorage.getItem('pet_care_user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post('/api/auth/login', { email, password });
        const { token: t, user: u } = res.data;
        localStorage.setItem('pet_care_token', t);
        localStorage.setItem('pet_care_user', JSON.stringify(u));
        setToken(t);
        setUser(u);
    };

    const register = async (firstName: string, lastName: string, email: string, password: string, role: string = 'USER') => {
        const res = await api.post('/api/auth/register', { firstName, lastName, email, password, role });
        const { token: t, user: u } = res.data;
        localStorage.setItem('pet_care_token', t);
        localStorage.setItem('pet_care_user', JSON.stringify(u));
        setToken(t);
        setUser(u);
    };

    const logout = () => {
        localStorage.removeItem('pet_care_token');
        localStorage.removeItem('pet_care_user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
