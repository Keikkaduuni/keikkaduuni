import axios from 'axios';
import { API_BASE_PATH } from '../config';

const BASE_URL = API_BASE_PATH + '/api/reviews';

export const fetchReceivedReviews = async (token: string) => {
  const res = await axios.get(`${BASE_URL}/received`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
  return res.data;
};