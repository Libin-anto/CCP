import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // On mount, validate stored token
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            axios.get('http://localhost:8000/api/v1/auth/me')
                .then(res => setUser(res.data))
                .catch(() => { logout(); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const form = new URLSearchParams();
        form.append('username', email);
        form.append('password', password);
        const res = await axios.post('http://localhost:8000/api/v1/auth/login', form, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const { access_token, role } = res.data;
        localStorage.setItem('token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setToken(access_token);

        // Fetch full profile
        const me = await axios.get('http://localhost:8000/api/v1/auth/me');
        setUser(me.data);
        return me.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
