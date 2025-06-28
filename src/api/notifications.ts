import axios from 'axios';
import { API_BASE_PATH } from '../config';

const BASE_URL = API_BASE_PATH + '/api/notifications';

export const fetchNotifications = async (token: string) => {
  const res = await axios.get(BASE_URL, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
  return res.data;
};

export const markNotificationAsRead = async (id: string, token: string) => {
  return await axios.post(`${BASE_URL}/${id}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
};

export const deleteNotification = async (id: string, token: string) => {
  return await axios.delete(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
};