// Function to decode JWT token
export const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Function to get user role from token
export const getUserRole = (token) => {
  const decodedToken = decodeToken(token);
  if (decodedToken) {
    return decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  }
  return null;
};

// Function to get user name from token
export const getUserName = (token) => {
  const decodedToken = decodeToken(token);
  if (decodedToken) {
    return decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'];
  }
  return null;
};

// Function to get user ID from token
export const getUserId = (token) => {
  const decodedToken = decodeToken(token);
  if (decodedToken) {
    return decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
  }
  return null;
};

// Function to check if token is expired
export const isTokenExpired = (token) => {
  const decodedToken = decodeToken(token);
  if (decodedToken && decodedToken.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedToken.exp < currentTime;
  }
  return true;
};

// Function to get stored token from localStorage
export const getStoredToken = () => {
  return localStorage.getItem('token');
};

// Function to get stored user role from localStorage
export const getStoredUserRole = () => {
  return localStorage.getItem('userRole');
};

// Function to get stored user name from localStorage
export const getStoredUserName = () => {
  return localStorage.getItem('userName');
};

// Function to get stored user ID from localStorage
export const getStoredUserId = () => {
  return localStorage.getItem('userId');
};

// Function to clear all stored authentication data
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
}; 