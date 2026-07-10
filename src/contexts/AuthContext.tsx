import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { DecodedToken, LoginRequest } from '../types';
import { authService } from '../services';
import { emitToast } from '../components/ui/toastBus';
import { registerForceLogoutListener, SESSION_EXPIRED_MESSAGE } from './authBus';

type Role = 'Admin' | 'Doctor' | 'Patient';

interface AuthContextType {
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  doctorId: number | null;
  doctorStatus: string | null;
  patientId: number | null;
  username: string | null;
  login: (credentials: LoginRequest) => Promise<Role>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [doctorStatus, setDoctorStatus] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Registers the handler that services/api.ts calls when an authenticated
  // request comes back 401 mid-session - clears both React state and
  // localStorage together (unlike a plain localStorage.clear(), this keeps
  // the UI from showing "still logged in" for the fraction of a second
  // before the redirect fires) and shows why the user is being sent to /login.
  useEffect(() => {
    registerForceLogoutListener((message) => {
      setToken(null);
      setRole(null);
      setDoctorId(null);
      setDoctorStatus(null);
      setPatientId(null);
      setUsername(null);
      localStorage.clear();
      emitToast('error', message);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1200);
    });
    return () => registerForceLogoutListener(null);
  }, []);

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
          setDoctorStatus(decoded.doctor_status ?? null);
          setPatientId(decoded.patient_id ? parseInt(decoded.patient_id) : null);
        } catch (error) {
          console.error('Invalid token:', error);
          localStorage.clear();
          emitToast('error', SESSION_EXPIRED_MESSAGE);
        }
      } else {
        // Token expired
        localStorage.clear();
        emitToast('error', SESSION_EXPIRED_MESSAGE);
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginRequest): Promise<Role> => {
    const response = await authService.login(credentials);

    // Store token and expiry
    localStorage.setItem('token', response.token);
    localStorage.setItem('expiresAt', (Date.now() + response.expiresIn * 1000).toString());

    // Decode token to get user info
    const decoded = jwtDecode<DecodedToken>(response.token);

    setToken(response.token);
    setRole(response.role);
    setUsername(decoded.unique_name);
    setDoctorId(decoded.doctor_id ? parseInt(decoded.doctor_id) : null);
    setDoctorStatus(decoded.doctor_status ?? null);
    setPatientId(decoded.patient_id ? parseInt(decoded.patient_id) : null);

    return response.role;
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setDoctorId(null);
    setDoctorStatus(null);
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
        doctorStatus,
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
