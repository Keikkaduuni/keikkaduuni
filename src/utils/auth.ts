export function getTokenPayload(): { id: string } | null {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (err) {
    console.error('Failed to decode token:', err);
    return null;
  }
}
