import { createContext, useState, useEffect } from 'react';
import { isTokenExpired, getStoredToken, clearAuthData } from '../utils/tokenUtils';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Validate token on app initialization
  useEffect(() => {
    const token = getStoredToken();
    
    if (token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        // Token is expired, clear all auth data
        clearAuthData();
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
      } else {
        // Token is valid, user is logged in
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
      }
    } else {
      // No token found, clear login state
      localStorage.removeItem('isLoggedIn');
      setIsLoggedIn(false);
    }
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true'); // Save login state
  };

  const logout = () => {
    setIsLoggedIn(false);
    clearAuthData(); // Clear token and user data
    localStorage.removeItem('isLoggedIn');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
