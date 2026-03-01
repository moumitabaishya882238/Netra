import api from './api';

const mapService = {
    getAllHospitals: async () => {
        const response = await api.get('/hospitals/map');
        return response.data;
    }
};

export default mapService;
