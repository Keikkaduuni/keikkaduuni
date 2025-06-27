import axios from 'axios';
import { BACKEND_URL } from '../config';

const BASE_URL = BACKEND_URL + '/api/reviews';

export const fetchReceivedReviews = async (token: string) => {
  const res = await axios.get(`${BASE_URL}/received`, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
  return res.data;
}; 