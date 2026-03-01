import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hospital, Lock, Hash } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ registrationId: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(formData.registrationId, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-card">
                <div className="auth-header">
                    <Hospital size={48} color="#6366f1" style={{ marginBottom: '1rem' }} />
                    <h2>Welcome Back</h2>
                    <p>Sign in using your Registration ID</p>
                </div>

                {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Registration ID</label>
                        <div style={{ position: 'relative' }}>
                            <Hash size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#64748b' }} />
                            <input
                                type="text"
                                placeholder="NT-XXXXX"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.registrationId}
                                onChange={(e) => setFormData({ ...formData, registrationId: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: '#64748b' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-link">
                    Don't have an account? <Link to="/register">Register Hospital</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
