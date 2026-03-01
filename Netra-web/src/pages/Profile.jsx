import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, MapPin, Phone, Building, Save, ArrowLeft, Globe } from 'lucide-react';

const Profile = () => {
    const { hospital, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        adminName: '',
        contactNumber: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        latitude: '',
        longitude: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const getGPSLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData({
                    ...formData,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setLoading(false);
                setSuccess('GPS Location fetched successfully!');
                setTimeout(() => setSuccess(''), 3000);
            },
            (err) => {
                setError('Unable to retrieve your location. Please ensure location permissions are granted.');
                setLoading(false);
            }
        );
    };

    useEffect(() => {
        if (hospital) {
            setFormData({
                name: hospital.name || '',
                adminName: hospital.adminName || '',
                contactNumber: hospital.contactNumber || '',
                address: hospital.address || '',
                city: hospital.city || '',
                state: hospital.state || '',
                pincode: hospital.pincode || '',
                latitude: hospital.location?.coordinates[1] || '',
                longitude: hospital.location?.coordinates[0] || '',
            });
        }
    }, [hospital]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.put('/hospitals/profile', formData);
            setSuccess('Profile updated successfully!');
            await refreshUser();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <button
                onClick={() => navigate('/dashboard')}
                className="auth-link"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.5rem' }}
            >
                <ArrowLeft size={18} /> Back to Dashboard
            </button>

            <div className="glass-card">
                <div className="auth-header" style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    <h2>Hospital Profile</h2>
                    <p>Complete your hospital information for the intelligence network</p>
                </div>

                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>{error}</div>}
                {success && <div style={{ color: 'var(--success)', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem' }}>{success}</div>}

                <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="input-group">
                            <label>Hospital Name</label>
                            <div style={{ position: 'relative' }}>
                                <Building size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Admin Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    style={{ paddingLeft: '2.5rem' }}
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Contact Number</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.contactNumber}
                                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Detailed Address</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={18} style={{ position: 'absolute', top: '14px', left: '12px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>State</label>
                            <input
                                type="text"
                                value={formData.state}
                                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Pincode</label>
                            <input
                                type="text"
                                value={formData.pincode}
                                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--glass-border)', marginTop: '1rem', paddingTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Globe size={18} color="#6366f1" /> Geolocation
                            </div>
                            <button
                                type="button"
                                onClick={getGPSLocation}
                                className="btn-primary"
                                style={{
                                    width: 'auto',
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.8rem',
                                    background: 'var(--bg-main)',
                                    border: '1.5px solid var(--primary)',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    boxShadow: 'none',
                                    fontWeight: '600'
                                }}
                            >
                                <MapPin size={14} /> Locate Me
                            </button>
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label>Latitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 19.0760"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Longitude</label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="e.g. 72.8777"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Saving Changes...' : 'Save Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
