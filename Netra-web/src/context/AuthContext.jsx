import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHospital = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setHospital(res.data.data);
                } catch (err) {
                    localStorage.removeItem('token');
                    setHospital(null);
                }
            }
            setLoading(false);
        };

        loadHospital();
    }, []);

    const login = async (registrationId, password) => {
        const res = await api.post('/auth/login', { registrationId, password });
        localStorage.setItem('token', res.data.token);
        const userRes = await api.get('/auth/me');
        setHospital(userRes.data.data);
        return res.data;
    };

    const register = async (hospitalData) => {
        const res = await api.post('/auth/register', hospitalData);
        localStorage.setItem('token', res.data.token);
        const userRes = await api.get('/auth/me');
        setHospital(userRes.data.data);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setHospital(null);
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setHospital(res.data.data);
        } catch (err) {
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{ hospital, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
