// src/api/conversations.ts
import axios from 'axios';
import { API_BASE_PATH } from '../config';

const BASE_URL = API_BASE_PATH + '/api/conversations';

export const fetchConversations = async (token: string) => {
  const res = await axios.get(BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
  return res.data;
};

// Example extensions
export const markConversationAsRead = async (conversationId: string, token: string) => {
  return await axios.patch(`${BASE_URL}/${conversationId}/read`, {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteConversation = async (conversationId: string, token: string) => {
  return await axios.delete(`${BASE_URL}/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};