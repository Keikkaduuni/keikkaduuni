export const getToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token');
