import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_URL = `${BASE_URL}/api`;

export const api = {
    getStats: () => axios.get(`${API_URL}/stats`),
    getDocuments: () => axios.get(`${API_URL}/documents`),
    getDocument: (id) => axios.get(`${API_URL}/documents/${id}`),
    uploadDocument: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return axios.post(`${API_URL}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    updateDocument: (id, data) => axios.put(`${API_URL}/documents/${id}`, data),
    deleteDocument: (id) => axios.delete(`${API_URL}/documents/${id}`),
    generateSummary: (id, type) => axios.post(`${API_URL}/documents/${id}/summary`, { type }),
    submitFeedback: (data) => axios.post(`${API_URL}/feedback`, data),
    getFeedback: () => axios.get(`${API_URL}/feedback`),
    getFeedbackStats: () => axios.get(`${API_URL}/feedback/stats`),
    generateAudio: (payload) => axios.post(`${API_URL}/generate-audio`, payload),
    getTTSLanguages: () => axios.get(`${API_URL}/tts/languages`),
    getAudioStreamUrl: (audioPath) => `${BASE_URL}${audioPath}`,
    getFilePreviewUrl: (filename) => `${API_URL}/files/${filename}`,
    getDocPdfExportUrl: (docId) => `${API_URL}/documents/${docId}/export/pdf`,
    exportCustomPdf: (payload) => axios.post(`${API_URL}/export/pdf`, payload, { responseType: 'blob' }),
    getApiKeyStatus: () => axios.get(`${API_URL}/settings/api-key`),
    saveApiKey: (api_key) => axios.post(`${API_URL}/settings/api-key`, { api_key }),
    enhancePreview: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return axios.post(`${API_URL}/enhance-preview`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
};
