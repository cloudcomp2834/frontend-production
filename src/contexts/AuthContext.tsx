import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { DecodedToken, LoginRequest } from '../types';
import { authService } from '../services';

interface AuthContextType {
  token: string | null;
  role: 'Admin' | 'Doctor' | 'Patient' | null;
  isAuthenticated: boolean;
  doctorId: number | null;
  patientId: number | null;
  username: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<'Admin' | 'Doctor' | 'Patient' | null>(null);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    const expiresAt = localStorage.getItem('expiresAt');

    if (storedToken && expiresAt) {
      const now = Date.now();
      if (now < parseInt(expiresAt)) {
        // Token is still valid
        try {
          const decoded = jwtDecode<DecodedToken>(storedToken);
          setToken(storedToken);
          setRole(decoded.role);
          setUsername(decoded.unique_name);
          setDoctorId(decoded.doctor_id ? parseInt(decoded.doctor_id) : null);
          setPatientId(decoded.patient_id ? parseInt(decoded.patient_id) : null);
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.clear();
        }
      } else {
        // Token expired
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    
    // Store token and expiry
    localStorage.setItem('token', response.token);
    localStorage.setItem('role', response.role);
    localStorage.setItem('expiresAt', (Date.now() + response.expiresIn * 1000).toString());

    // Decode token to get user info
    const decoded = jwtDecode<DecodedToken>(response.token);
    
    setToken(response.token);
    setRole(response.role);
    setUsername(decoded.unique_name);
    setDoctorId(decoded.doctor_id ? parseInt(decoded.doctor_id) : null);
    setPatientId(decoded.patient_id ? parseInt(decoded.patient_id) : null);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setDoctorId(null);
    setPatientId(null);
    setUsername(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        isAuthenticated: !!token,
        doctorId,
        patientId,
        username,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
