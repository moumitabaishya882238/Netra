import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    LogOut, LayoutDashboard, Hospital, Bed,
    Activity, Zap, ShieldAlert, Baby, Edit3,
    Check, X, RefreshCw, MapPin, User, Phone,
    Stethoscope, Plus, Trash2, Clock, UserPlus,
    UserCheck, ClipboardList, Package, Droplets,
    Gauge, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import MapView from '../components/MapView';

const Dashboard = () => {
    const { hospital, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(null); // 'beds', 'icu', etc.
    const [editData, setEditData] = useState({ total: 0, available: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [doctors, setDoctors] = useState([]);
    const [newDoctor, setNewDoctor] = useState({ name: '', specialization: '' });
    const [showAddDoctor, setShowAddDoctor] = useState(false);
    const [patients, setPatients] = useState([]);
    const [newPatient, setNewPatient] = useState({ patientName: '', age: '', emergencyType: '', bedType: 'beds' });
    const [showAddPatient, setShowAddPatient] = useState(false);
    const [resources, setResources] = useState([]);
    const [showAddResource, setShowAddResource] = useState(false);
    const [newResource, setNewResource] = useState({ name: '', category: 'Gases', quantity: 0, unit: '', minThreshold: 5 });
    const [auditLogs, setAuditLogs] = useState([]);

    const getStatusTheme = () => {
        if (hospital?.status === 'CRITICAL') return {
            borderColor: '#ef4444',
            background: 'rgba(239, 68, 68, 0.03)',
            glow: '0 0 20px rgba(239, 68, 68, 0.1)'
        };
        if (hospital?.status === 'HIGH LOAD') return {
            borderColor: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.03)',
            glow: '0 0 20px rgba(245, 158, 11, 0.1)'
        };
        return { borderColor: 'transparent', background: 'transparent', glow: 'none' };
    };

    const statusTheme = getStatusTheme();

    const infraKeys = [
        { key: 'beds', label: 'General Beds', icon: Bed, color: '#0ea5e9' },
        { key: 'icu', label: 'ICU Units', icon: Activity, color: '#6366f1' },
        { key: 'ventilators', label: 'Ventilators', icon: Zap, color: '#f59e0b' },
        { key: 'emergency', label: 'Emergency Room', icon: ShieldAlert, color: '#ef4444' },
        { key: 'maternity', label: 'Maternity Ward', icon: Baby, color: '#ec4899' },
    ];

    const getStatusColor = (available, total) => {
        if (total === 0) return '#64748b';
        const ratio = available / total;
        if (ratio > 0.5) return '#10b981'; // Green
        if (ratio > 0.2) return '#f59e0b'; // Orange
        return '#ef4444'; // Red
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/doctors');
            setDoctors(res.data.data);
        } catch (err) {
            console.error('Fetch doctors error:', err);
        }
    };

    const fetchPatients = async () => {
        try {
            const res = await api.get('/patients');
            setPatients(res.data.data);
        } catch (err) {
            console.error('Fetch patients error:', err);
        }
    };

    const fetchResources = async () => {
        try {
            const res = await api.get('/resources');
            setResources(res.data.data);
        } catch (err) {
            console.error('Fetch resources error:', err);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await api.get('/audit/logs');
            setAuditLogs(res.data.data);
        } catch (err) {
            console.error('Fetch audit logs error:', err);
        }
    };

    useEffect(() => {
        fetchDoctors();
        fetchPatients();
        fetchResources();
        fetchAuditLogs();

        // Socket.io Setup
        const socket = io('http://localhost:5000');

        if (hospital?._id) {
            socket.emit('joinHospital', hospital._id);
        }

        socket.on('infraUpdate', (data) => {
            console.log('Real-time infra update received');
            refreshUser();
        });

        socket.on('doctorUpdate', () => {
            console.log('Real-time doctor update received');
            fetchDoctors();
        });

        socket.on('patientUpdate', () => {
            console.log('Real-time patient update received');
            fetchPatients();
        });

        socket.on('resourceUpdate', () => {
            console.log('Real-time resource update received');
            fetchResources();
            fetchAuditLogs();
        });

        socket.on('patientUpdate', () => {
            fetchAuditLogs();
        });

        socket.on('doctorUpdate', () => {
            fetchAuditLogs();
        });

        return () => {
            socket.disconnect();
        };
    }, [hospital?._id]);

    const handleEdit = (key) => {
        setEditMode(key);
        setEditData({
            total: hospital.infrastructure[key].total,
            available: hospital.infrastructure[key].available
        });
    };

    const handleSave = async (key) => {
        if (editData.available > editData.total) {
            setError('Available count cannot exceed total');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const updatedInfra = { ...hospital.infrastructure, [key]: editData };
            await api.put('/hospitals/infrastructure', { infrastructure: updatedInfra });
            await refreshUser();
            setEditMode(null);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Update failed';
            setError(errorMsg);
            console.error('Infrastructure update error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getSpecialistCounts = () => {
        const counts = {};
        doctors.forEach(doc => {
            if (doc.status === 'Available') {
                counts[doc.specialization] = (counts[doc.specialization] || 0) + 1;
            }
        });
        return counts;
    };

    const handleAddDoctor = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/doctors', newDoctor);
            setNewDoctor({ name: '', specialization: '' });
            setShowAddDoctor(false);
            fetchDoctors();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add doctor');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDoctorStatus = async (id, status) => {
        try {
            await api.put(`/doctors/${id}/status`, { status });
            fetchDoctors();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update doctor status');
        }
    };

    const handleDeleteDoctor = async (id) => {
        if (!window.confirm('Are you sure you want to delete this doctor?')) return;
        try {
            await api.delete(`/doctors/${id}`);
            fetchDoctors();
        } catch (err) {
            setError('Failed to delete doctor');
        }
    };

    const handleAdmitPatient = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/patients', newPatient);
            setNewPatient({ patientName: '', age: '', emergencyType: '', bedType: 'beds' });
            setShowAddPatient(false);
            await fetchPatients();
            await refreshUser(); // Update infrastructure counts
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to admit patient');
        } finally {
            setLoading(false);
        }
    };

    const handleDischargePatient = async (id) => {
        if (!window.confirm('Are you sure you want to discharge this patient?')) return;
        try {
            await api.put(`/patients/${id}/discharge`);
            await fetchPatients();
            await refreshUser(); // Update infrastructure counts
        } catch (err) {
            setError('Failed to discharge patient');
        }
    };

    const handleAddResource = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/resources', newResource);
            setNewResource({ name: '', category: 'Gases', quantity: 0, unit: '', minThreshold: 5 });
            setShowAddResource(false);
            fetchResources();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add resource');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStock = async (id, newQuantity) => {
        try {
            await api.put(`/resources/${id}`, { quantity: Math.max(0, newQuantity) });
            fetchResources();
        } catch (err) {
            setError('Failed to update stock');
        }
    };

    const handleDeleteResource = async (id) => {
        if (!window.confirm('Delete this resource?')) return;
        try {
            await api.delete(`/resources/${id}`);
            fetchResources();
        } catch (err) {
            setError('Failed to delete resource');
        }
    };

    return (
        <div style={{
            padding: '1.5rem',
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: statusTheme.background,
            transition: 'background 0.5s ease'
        }}>
            {hospital?.status === 'CRITICAL' && (
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: '#ef4444',
                        zIndex: 1000
                    }}
                />
            )}
            {/* Header Section */}
            <header className="glass-card" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                padding: '1.5rem 2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                        padding: '0.75rem',
                        borderRadius: '0.75rem',
                        color: 'white'
                    }}>
                        <LayoutDashboard size={24} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: '800' }}>NETRA Intelligence Hub</h1>
                            {hospital?.status && (
                                <motion.span
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    style={{
                                        padding: '2px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.65rem',
                                        fontWeight: '900',
                                        letterSpacing: '0.05em',
                                        background: hospital.status === 'CRITICAL' ? '#fee2e2' : hospital.status === 'HIGH LOAD' ? '#fef3c7' : '#dcfce7',
                                        color: hospital.status === 'CRITICAL' ? '#ef4444' : hospital.status === 'HIGH LOAD' ? '#b45309' : '#16a34a',
                                        border: `1px solid ${hospital.status === 'CRITICAL' ? '#ef444450' : hospital.status === 'HIGH LOAD' ? '#f59e0b50' : '#10b98150'}`,
                                        boxShadow: hospital.status === 'CRITICAL' ? '0 0 10px rgba(239, 68, 68, 0.2)' : 'none'
                                    }}
                                >
                                    {hospital.status}
                                </motion.span>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{hospital?.name} • {hospital?.city}, {hospital?.state}</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => navigate('/profile')} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', background: 'white', border: '1.5px solid var(--primary)', color: 'var(--primary)', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <User size={16} /> Profile
                    </button>
                    <button onClick={logout} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', background: '#fee2e2', color: '#ef4444', boxShadow: 'none' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', flex: 1 }}>
                {/* Hospital Info Sidebar */}
                <aside className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Hospital size={18} color="var(--primary)" /> Basic Info
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ fontSize: '0.9rem' }}>
                            <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>ADMIN</label>
                            <span style={{ fontWeight: '500' }}>{hospital?.adminName}</span>
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>
                            <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>CONTACT</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Phone size={14} color="var(--text-muted)" />
                                <span style={{ fontWeight: '500' }}>{hospital?.contactNumber}</span>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.9rem' }}>
                            <label style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', fontWeight: '600' }}>LOCATION</label>
                            <div style={{ display: 'flex', alignItems: 'start', gap: '0.4rem' }}>
                                <MapPin size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                                <span style={{ fontWeight: '500' }}>{hospital?.address}, {hospital?.city} - {hospital?.pincode}</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f1f5f9', borderRadius: '0.75rem', textAlign: 'center' }}>
                            <RefreshCw size={24} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last synced: Just now</p>
                        </div>
                    </div>

                    {/* Recent Activity Feed */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} color="#6366f1" /> Recent Activity
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {auditLogs.length === 0 ? (
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>No recent activity.</p>
                            ) : (
                                auditLogs.slice(0, 10).map((log, index) => {
                                    const isLast = index === Math.min(auditLogs.length, 10) - 1;
                                    return (
                                        <div key={log._id} style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                                            {!isLast && (
                                                <div style={{ position: 'absolute', left: '9px', top: '22px', bottom: '-15px', width: '2px', background: '#e2e8f0' }} />
                                            )}
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                background: log.action.includes('ADMITTED') ? '#dcfce7' : log.action.includes('STOCK') ? '#e0e7ff' : '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 1,
                                                marginTop: '2px'
                                            }}>
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: log.action.includes('ADMITTED') ? '#10b981' : log.action.includes('STOCK') ? '#6366f1' : '#64748b'
                                                }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.78rem', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                                                    {log.details.name || log.details.patientName || 'Details updated'}
                                                </p>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </aside>

                {/* Infrastructure Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>Infrastructure Capacity</h2>
                    </div>

                    {(hospital?.infrastructure?.beds?.total === 0 && !editMode) && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{
                                marginBottom: '1.5rem',
                                background: '#fff7ed',
                                border: '1px solid #f9731650',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem'
                            }}
                        >
                            <div style={{ background: '#f97316', padding: '8px', borderRadius: '50%' }}>
                                <AlertTriangle size={20} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ color: '#9a3412', fontSize: '0.9rem', marginBottom: '2px' }}>Hospital Capacity Not Set ⚠️</h4>
                                <p style={{ color: '#c2410c', fontSize: '0.75rem' }}>Please set your total and available beds using the <strong>edit icons</strong> below to enable admissions.</p>
                            </div>
                        </motion.div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {infraKeys.map(({ key, label, icon: Icon, color }) => {
                            const data = hospital?.infrastructure[key];
                            const isEditing = editMode === key;
                            const statusColor = getStatusColor(data.available, data.total);
                            const percentage = data.total > 0 ? (data.available / data.total) * 100 : 0;

                            return (
                                <motion.div
                                    key={key}
                                    layout
                                    className="glass-card"
                                    style={{ padding: '1rem', borderTop: `4px solid ${color}` }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                        <div style={{ background: `${color}15`, padding: '0.5rem', borderRadius: '0.5rem', color }}>
                                            <Icon size={20} />
                                        </div>
                                        {!isEditing ? (
                                            <button
                                                onClick={() => handleEdit(key)}
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => handleSave(key)} style={{ border: 'none', background: '#dcfce7', color: '#16a34a', padding: '4px', borderRadius: '4px', cursor: 'pointer' }} disabled={loading}>
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={() => setEditMode(null)} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</h4>

                                    {!isEditing ? (
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1rem' }}>
                                            <span style={{ fontSize: '1.75rem', fontWeight: '800', color: statusColor }}>{data.available}</span>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ {data.total} Available</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.65rem', display: 'block', fontWeight: '700' }}>AVAIL</label>
                                                <input
                                                    type="number"
                                                    value={editData.available}
                                                    onChange={(e) => setEditData({ ...editData, available: parseInt(e.target.value) || 0 })}
                                                    style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.65rem', display: 'block', fontWeight: '700' }}>TOTAL</label>
                                                <input
                                                    type="number"
                                                    value={editData.total}
                                                    onChange={(e) => setEditData({ ...editData, total: parseInt(e.target.value) || 0 })}
                                                    style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Progress Bar */}
                                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            style={{ height: '100%', background: statusColor }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            {percentage.toFixed(0)}% Occupancy
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: statusColor, fontWeight: '700' }}>
                                            {percentage > 20 ? 'OPERATIONAL' : 'CRITICAL'}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Doctor Management Section */}
                    <div style={{ marginTop: '2.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <Stethoscope size={22} color="var(--primary)" /> Doctor Management
                            </h2>
                            <button
                                onClick={() => setShowAddDoctor(!showAddDoctor)}
                                className="btn-primary"
                                style={{
                                    width: 'auto',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Plus size={16} /> Add Doctor
                            </button>
                        </div>

                        <AnimatePresence>
                            {showAddDoctor && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="glass-card"
                                    style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(99, 102, 241, 0.05)' }}
                                >
                                    <form onSubmit={handleAddDoctor} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Doctor Name</label>
                                            <input
                                                type="text"
                                                placeholder="Dr. John Doe"
                                                value={newDoctor.name}
                                                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Specialization</label>
                                            <input
                                                type="text"
                                                placeholder="Cardiology"
                                                value={newDoctor.specialization}
                                                onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} disabled={loading}>
                                                Save
                                            </button>
                                            <button type="button" onClick={() => setShowAddDoctor(false)} className="btn-primary" style={{ width: 'auto', padding: '0.5rem', background: '#fee2e2', color: '#ef4444', boxShadow: 'none' }}>
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Specialist Summary */}
                        {doctors.length > 0 && (
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                                {Object.entries(getSpecialistCounts()).map(([spec, count]) => (
                                    <div key={spec} style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1.5px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                        <span style={{ fontWeight: '700' }}>{count}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{spec} Available</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--glass-border)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>DOCTOR NAME</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>SPECIALIZATION</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>STATUS</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doctors.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                No doctors registered yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        doctors.map((doc) => (
                                            <tr key={doc._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '1rem', fontWeight: '600', fontSize: '0.9rem' }}>{doc.name}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                                    <span style={{ padding: '2px 8px', background: 'var(--bg-main)', borderRadius: '4px', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                                                        {doc.specialization}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <select
                                                        value={doc.status}
                                                        onChange={(e) => handleUpdateDoctorStatus(doc._id, e.target.value)}
                                                        style={{
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            background: doc.status === 'Available' ? '#dcfce7' : doc.status === 'Busy' ? '#fef3c7' : doc.status === 'OnCall' ? '#e0e7ff' : '#f1f5f9',
                                                            color: doc.status === 'Available' ? '#16a34a' : doc.status === 'Busy' ? '#b45309' : doc.status === 'OnCall' ? '#4338ca' : '#64748b'
                                                        }}
                                                    >
                                                        <option value="Available">Available</option>
                                                        <option value="Busy">Busy</option>
                                                        <option value="OnCall">On Call</option>
                                                        <option value="OffDuty">Off Duty</option>
                                                    </select>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                                            <Clock size={12} /> {new Date(doc.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <button onClick={() => handleDeleteDoctor(doc._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.7 }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Patient Admission Section */}
                    <div style={{ marginTop: '2.5rem', marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <ClipboardList size={22} color="#ec4899" /> Patient Bed Allocation
                            </h2>
                            <button
                                onClick={() => setShowAddPatient(!showAddPatient)}
                                className="btn-primary"
                                style={{
                                    width: 'auto',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                                }}
                            >
                                <UserPlus size={16} /> Admit Patient
                            </button>
                        </div>

                        <AnimatePresence>
                            {showAddPatient && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="glass-card"
                                    style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(236, 72, 153, 0.05)' }}
                                >
                                    <form onSubmit={handleAdmitPatient} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '1rem', alignItems: 'end' }}>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Patient Name</label>
                                            <input
                                                type="text"
                                                placeholder="Aman Sharma"
                                                value={newPatient.patientName}
                                                onChange={(e) => setNewPatient({ ...newPatient, patientName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Age</label>
                                            <input
                                                type="number"
                                                placeholder="25"
                                                value={newPatient.age}
                                                onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Emergency Type</label>
                                            <input
                                                type="text"
                                                placeholder="Cardiac Arrest"
                                                value={newPatient.emergencyType}
                                                onChange={(e) => setNewPatient({ ...newPatient, emergencyType: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Target Ward/Bed</label>
                                            <select
                                                value={newPatient.bedType}
                                                onChange={(e) => setNewPatient({ ...newPatient, bedType: e.target.value })}
                                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                                            >
                                                {infraKeys.map(k => (
                                                    <option key={k.key} value={k.key}>{k.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    type="submit"
                                                    className="btn-primary"
                                                    style={{ width: 'auto', padding: '0.5rem 1.5rem', background: hospital?.infrastructure?.[newPatient.bedType]?.available > 0 ? '#ec4899' : '#94a3b8' }}
                                                    disabled={loading || (hospital?.infrastructure?.[newPatient.bedType]?.available <= 0)}
                                                >
                                                    {hospital?.infrastructure?.[newPatient.bedType]?.available > 0 ? 'Admit' : 'No Capacity'}
                                                </button>
                                                <button type="button" onClick={() => setShowAddPatient(false)} className="btn-primary" style={{ width: 'auto', padding: '0.5rem', background: '#fee2e2', color: '#ef4444', boxShadow: 'none' }}>
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            {hospital?.infrastructure?.[newPatient.bedType]?.available <= 0 && (
                                                <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: '600' }}>Set capacity first</span>
                                            )}
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: '#fff1f2', borderBottom: '1px solid var(--glass-border)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: '#be185d' }}>PATIENT NAME</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: '#be185d' }}>AGE</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: '#be185d' }}>CASE TYPE</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: '#be185d' }}>ALLOCATED BED</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: '#be185d' }}>ADMISSION TIME</th>
                                        <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: '#be185d' }}>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                No patients currently admitted.
                                            </td>
                                        </tr>
                                    ) : (
                                        patients.map((pat) => (
                                            <tr key={pat._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '1rem', fontWeight: '600', fontSize: '0.9rem' }}>{pat.patientName}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{pat.age}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                                    <span style={{ color: '#be185d', fontWeight: '600' }}>{pat.emergencyType}</span>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <status-indicator style={{ width: '6px', height: '6px', borderRadius: '3px', background: infraKeys.find(k => k.key === pat.bedType)?.color || 'gray' }} />
                                                        {infraKeys.find(k => k.key === pat.bedType)?.label}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {new Date(pat.admittedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button
                                                        onClick={() => handleDischargePatient(pat._id)}
                                                        style={{
                                                            border: 'none',
                                                            background: '#dcfce7',
                                                            color: '#16a34a',
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '700',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem'
                                                        }}
                                                    >
                                                        <UserCheck size={14} /> Discharge
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Resource Inventory Section */}
                    <div style={{ marginTop: '2.5rem', marginBottom: '4rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <Package size={22} color="var(--primary)" /> Critical Resource Inventory
                            </h2>
                            <button
                                onClick={() => setShowAddResource(!showAddResource)}
                                className="btn-primary"
                                style={{
                                    width: 'auto',
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'var(--primary)'
                                }}
                            >
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        <AnimatePresence>
                            {showAddResource && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="glass-card"
                                    style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
                                >
                                    <form onSubmit={handleAddResource} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '1rem', alignItems: 'end' }}>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Resource Name</label>
                                            <input type="text" placeholder="Oxygen" value={newResource.name} onChange={(e) => setNewResource({ ...newResource, name: e.target.value })} required />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Category</label>
                                            <select value={newResource.category} onChange={(e) => setNewResource({ ...newResource, category: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                <option value="Gases">Gases</option>
                                                <option value="Blood">Blood</option>
                                                <option value="Medicines">Medicines</option>
                                                <option value="Equipment">Equipment</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Stock</label>
                                            <input type="number" value={newResource.quantity} onChange={(e) => setNewResource({ ...newResource, quantity: parseInt(e.target.value) })} required />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Unit</label>
                                            <input type="text" placeholder="Liters" value={newResource.unit} onChange={(e) => setNewResource({ ...newResource, unit: e.target.value })} required />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.75rem' }}>Min Alert</label>
                                            <input type="number" value={newResource.minThreshold} onChange={(e) => setNewResource({ ...newResource, minThreshold: parseInt(e.target.value) })} required />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} disabled={loading}>Add</button>
                                            <button type="button" onClick={() => setShowAddResource(false)} className="btn-primary" style={{ width: 'auto', padding: '0.5rem', background: '#fee2e2', color: '#ef4444' }}>
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            {resources.length === 0 ? (
                                <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No critical resources tracked yet. Add your first item (e.g., Oxygen Cylinders).
                                </div>
                            ) : (
                                resources.map((res) => {
                                    const isLow = res.quantity <= res.minThreshold;
                                    return (
                                        <motion.div
                                            key={res._id}
                                            className="glass-card"
                                            style={{
                                                padding: '1.25rem',
                                                border: isLow ? '1.5px solid #ef4444' : '1px solid var(--glass-border)',
                                                background: isLow ? 'rgba(239, 68, 68, 0.02)' : 'white',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {isLow && (
                                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ef4444', fontSize: '0.65rem', fontWeight: '800', background: '#fee2e2', padding: '2px 8px', borderRadius: '10px' }}>
                                                    <AlertTriangle size={12} /> LOW STOCK
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                                <div style={{ padding: '0.5rem', borderRadius: '0.6rem', background: isLow ? '#fee2e2' : '#f1f5f9', color: isLow ? '#ef4444' : 'var(--primary)' }}>
                                                    {res.category === 'Blood' ? <Droplets size={20} /> : <Gauge size={20} />}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>{res.name}</h4>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{res.category}</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                                                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: isLow ? '#ef4444' : 'var(--text-main)' }}>{res.quantity}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>{res.unit}</span>
                                            </div>

                                            <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', marginBottom: '1.25rem', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${Math.min(100, (res.quantity / (res.minThreshold * 4)) * 100)}%`,
                                                    height: '100%',
                                                    background: isLow ? '#ef4444' : 'var(--primary)',
                                                    transition: 'width 0.5s ease-in-out'
                                                }} />
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button onClick={() => handleUpdateStock(res._id, res.quantity + 1)} style={{ padding: '4px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}><ChevronUp size={16} /></button>
                                                    <button onClick={() => handleUpdateStock(res._id, res.quantity - 1)} style={{ padding: '4px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}><ChevronDown size={16} /></button>
                                                </div>
                                                <button onClick={() => handleDeleteResource(res._id)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* Regional Hub Map */}
            <div style={{ marginTop: '1rem', padding: '0 1rem 3rem 1rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <MapPin size={22} color="var(--primary)" /> Regional Hub Map
                    </h2>
                    <MapView />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
