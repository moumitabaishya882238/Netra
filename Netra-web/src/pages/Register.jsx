import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import {
    Hospital, Mail, Lock, FileText, User, MapPin,
    Phone, Building, Save, Globe, ArrowRight, ArrowLeft,
    Activity, AlertCircle, CheckCircle
} from 'lucide-react';

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        registrationId: '',
        password: '',
        confirmPassword: '',
        adminName: '',
        contactNumber: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        latitude: '',
        longitude: '',
        infrastructure: {
            beds: { total: 0, available: 0 },
            icu: { total: 0, available: 0 },
            ventilators: { total: 0, available: 0 },
            emergency: { total: 0, available: 0 },
            maternity: { total: 0, available: 0 },
        }
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleNext = async () => {
        setError('');
        if (step === 1) {
            if (!formData.name || !formData.email) {
                setError('Please fill name and email');
                return;
            }
            setLoading(true);
            try {
                const res = await api.post('/auth/register/init', {
                    name: formData.name,
                    email: formData.email
                });
                setFormData({ ...formData, registrationId: res.data.data.registrationId });
                setStep(2);
            } catch (err) {
                setError(err.response?.data?.message || 'Verification failed');
            } finally {
                setLoading(false);
            }
        } else if (step === 2) {
            if (!formData.password || formData.password !== formData.confirmPassword) {
                setError('Passwords do not match or are missing');
                return;
            }
            setStep(3);
        } else if (step === 3) {
            if (!formData.adminName || !formData.contactNumber || !formData.address) {
                setError('Please fill all profile fields');
                return;
            }
            setStep(4);
        }
    };

    const handleBack = () => {
        setError('');
        setStep(step - 1);
    };

    const getGPSLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData({
                    ...formData,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                });
                setLoading(false);
            },
            () => {
                setError('Unable to fetch location');
                setLoading(false);
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const payload = {
                ...formData,
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
                }
            };
            await register(payload);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 500 : -500,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 500 : -500,
            opacity: 0
        })
    };

    return (
        <div className="auth-container" style={{ maxWidth: '600px' }}>
            <div className="glass-card" style={{ position: 'relative', overflow: 'hidden' }}>

                {/* Progress Bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--border)' }}>
                    <div style={{
                        height: '100%',
                        width: `${(step / 4) * 100}%`,
                        background: 'var(--primary)',
                        transition: 'width 0.3s'
                    }} />
                </div>

                <div className="auth-header">
                    <Hospital size={40} color="#6366f1" />
                    <h2 style={{ fontSize: '1.5rem', marginTop: '1rem' }}>Register Hospital</h2>
                    <p>Step {step} of 4</p>
                </div>

                {error && (
                    <div style={{
                        color: 'var(--error)',
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait" initial={false}>
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div className="input-group">
                                    <label>Official Hospital Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <Building size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            placeholder="City General Hospital"
                                            style={{ paddingLeft: '2.5rem' }}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Official Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="email"
                                            placeholder="admin@hospital.com"
                                            style={{ paddingLeft: '2.5rem' }}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="button" onClick={handleNext} className="btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    {loading ? 'Verifying...' : 'Next Step'} <ArrowRight size={18} />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', border: '1px dashed var(--primary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                                        <CheckCircle size={18} />
                                        <strong>Registration ID Generated</strong>
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '2px' }}>{formData.registrationId}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>
                                        Save this ID! You will need it to login later.
                                    </p>
                                </div>

                                <div className="input-group">
                                    <label>Set Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
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
                                <div className="input-group">
                                    <label>Confirm Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            style={{ paddingLeft: '2.5rem' }}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" onClick={handleBack} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>
                                        Back
                                    </button>
                                    <button type="button" onClick={handleNext} className="btn-primary">
                                        Next Step
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label>Admin Name</label>
                                        <input type="text" value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Contact No</label>
                                        <input type="text" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Address</label>
                                    <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                    <div className="input-group"><label>City</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
                                    <div className="input-group"><label>State</label><input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} /></div>
                                    <div className="input-group"><label>Pincode</label><input type="text" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} /></div>
                                </div>
                                <div className="input-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <label style={{ margin: 0 }}>Location</label>
                                        <button type="button" onClick={getGPSLocation} style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <MapPin size={12} /> Use GPS
                                        </button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <input type="text" placeholder="Lat" value={formData.latitude} readOnly />
                                        <input type="text" placeholder="Lng" value={formData.longitude} readOnly />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" onClick={handleBack} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>Back</button>
                                    <button type="button" onClick={handleNext} className="btn-primary">Next Step</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Enter initial infrastructure capacity</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {['beds', 'icu', 'ventilators', 'emergency', 'maternity'].map(key => (
                                        <div key={key} className="glass-card" style={{ padding: '1rem', marginBottom: '0.5rem' }}>
                                            <label style={{ textTransform: 'capitalize', fontSize: '0.8rem', color: 'var(--primary)' }}>{key}</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <div><label style={{ fontSize: '0.6rem' }}>Total</label><input type="number" value={formData.infrastructure[key].total} onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setFormData({ ...formData, infrastructure: { ...formData.infrastructure, [key]: { ...formData.infrastructure[key], total: val, available: val } } });
                                                }} style={{ padding: '0.3rem' }} /></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button type="button" onClick={handleBack} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>Back</button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? 'Completing...' : 'Register Hospital'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>

                <div className="auth-link">
                    Already have an account? <Link to="/login">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
