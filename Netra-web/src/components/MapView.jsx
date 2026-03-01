import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapService from '../services/mapService';

// Fix for default marker icons in Leaflet with Webpack/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Custom markers for different statuses
const getMarkerIcon = (status) => {
    let color = '#3b82f6'; // Default Blue (NORMAL)
    if (status === 'CRITICAL') color = '#ef4444'; // Red
    if (status === 'HIGH LOAD') color = '#f59e0b'; // Amber

    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
};

const MapView = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                const response = await mapService.getAllHospitals();
                if (response.success) {
                    // Filter hospitals that have location data
                    const withLocation = response.data.filter(h =>
                        h.location && h.location.coordinates && h.location.coordinates.length === 2
                    );
                    setHospitals(withLocation);
                }
            } catch (err) {
                console.error('Error fetching hospitals for map:', err);
                setError('Failed to load map data');
            } finally {
                setLoading(false);
            }
        };

        fetchHospitals();
    }, []);

    if (loading) return <div className="map-loader">Loading Map Data...</div>;
    if (error) return <div className="map-error">{error}</div>;

    const defaultCenter = [20.5937, 78.9629]; // Center of India

    return (
        <div className="map-wrapper" style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <MapContainer
                center={hospitals.length > 0 ? [hospitals[0].location.coordinates[1], hospitals[0].location.coordinates[0]] : defaultCenter}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {hospitals.map(hospital => (
                    <Marker
                        key={hospital._id}
                        position={[hospital.location.coordinates[1], hospital.location.coordinates[0]]}
                        icon={getMarkerIcon(hospital.status)}
                    >
                        <Popup>
                            <div className="map-popup">
                                <h3>{hospital.name}</h3>
                                <p><strong>Status:</strong> <span className={`status-${hospital.status.replace(' ', '-').toLowerCase()}`}>{hospital.status}</span></p>
                                <p><strong>City:</strong> {hospital.city}</p>
                                <p><strong>Contact:</strong> {hospital.contactNumber}</p>
                                <div className="popup-infra">
                                    <span>Beds: {hospital.infrastructure?.beds?.available}/{hospital.infrastructure?.beds?.total}</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;
