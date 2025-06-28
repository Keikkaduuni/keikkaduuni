import axios from 'axios';
import { API_BASE_PATH } from '../config';

const API_ROOT = API_BASE_PATH;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

/**
 * Fetch paginated messages for a conversation.
 */
export const fetchMessages = async (conversationId: string, page = 1, pageSize = 20) => {
  const res = await axios.get(`${API_ROOT}/api/messages/${conversationId}`, {
    params: { page, pageSize },
    headers: getAuthHeaders(),
    withCredentials: true,
  });
  return res.data;
};

/**
 * Send a new message in a conversation. Accepts FormData to support file uploads.
 */
export const sendMessage = async (conversationId: string, formData: FormData) => {
  const res = await axios.post(`${API_ROOT}/api/messages/${conversationId}`, formData, {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true,
  });
  return res.data;
};

/**
 * Delete a message by ID.
 */
export const deleteMessage = async (messageId: string) => {
  const res = await axios.delete(`${API_ROOT}/api/messages/${messageId}`, {
    headers: getAuthHeaders(),
    withCredentials: true,
  });
  return res.data;
};