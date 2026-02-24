import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    role: 'Admin' | 'CourseMaster' | 'HOD' | 'Trainer' | 'Student';
    is_activated: boolean;
    admission_no?: string;
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

    const decodeToken = (token: string): User | null => {
        try {
            const decoded: any = jwtDecode(token);
            return {
                id: decoded.user_id || decoded.sub || -1,
                username: decoded.username || '',
                email: decoded.email || '',
                role: decoded.role || 'Student',
                is_activated: true,
            };
        } catch (error) {
            console.error('Failed to decode token', error);
            return null;
        }
    };

    const login = (access: string, refresh: string) => {
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        const userInfo = decodeToken(access);
        if (userInfo) {
            setUser(userInfo);
            console.log('User logged in:', userInfo);
        }
        setLoading(false);
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
            const userInfo = decodeToken(token);
            if (userInfo) {
                setUser(userInfo);
            } else {
                logout();
            }
        }
        setLoading(false);
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
