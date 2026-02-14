import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

interface User {
    id: number;
    username: string;
    role: 'Admin' | 'CourseMaster' | 'HOD' | 'Trainer' | 'Student';
    is_activated: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (access: string, refresh: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('users/me/'); // Note: Need to implement this endpoint in backend properly or use token data
            // For now, let's decode from token or fetch if possible. 
            // In Django simplejwt, 'me' isn't default, but we can decode tokens for basic info.
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = (access: string, refresh: string) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        const decoded: any = jwtDecode(access);
        console.log('Decoded token:', decoded);
        // Basic user info from token (we should customize simplejwt to include role/id)
        // For now, let's assume we fetch profile after login
        fetchUserProfile();
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setLoading(false);
    };

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            fetchUserProfile();
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
