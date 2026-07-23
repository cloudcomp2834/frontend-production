import { apiFetch, buildQueryString } from './api';
import type {
  LoginRequest,
  LoginResponse,
  CreatePatientUserRequest,
  PatientUserDto,
  DoctorDto,
  DoctorDirectoryDto,
  CreateDoctorWithUserRequest,
  DoctorScheduleDto,
  DoctorAvailabilityDto,
  CreateDoctorScheduleRequest,
  UpdateDoctorScheduleRequest,
  DoctorAppointmentDto,
  AppointmentDto,
  CreateAppointmentRequest,
  AppointmentPaymentDocumentDto,
  DocumentUrlResponse,
  HospitalDto,
  SpecialismDto,
  AppointmentTypeDto,
  UserDto,
  CreateAdminUserRequest,
  AdminUserDto,
  MedicalRecordDto,
  MedicalRecordFileDto,
  CompleteAppointmentRequest,
  CompleteAppointmentResponse,
  FilePresignedUrlResponse,
} from '../types';

// Auth
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiFetch(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
      { suppressSessionHandling: true }
    );
    return data;
  },
};

// Patient Registration & Profile
export const patientService = {
  register: async (userData: CreatePatientUserRequest): Promise<{ message: string; patientId: number }> => {
    const { data } = await apiFetch('/api/patientuser', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data;
  },

  getProfile: async (patientId: number): Promise<PatientUserDto> => {
    const { data } = await apiFetch(`/api/patientuser/${patientId}`);
    return data;
  },
};

// Reference Data (Public)
export const referenceService = {
  getHospitals: async (): Promise<HospitalDto[]> => {
    const { data } = await apiFetch('/api/hospital');
    return data;
  },

  getSpecialisms: async (): Promise<SpecialismDto[]> => {
    const { data } = await apiFetch('/api/specialism');
    return data;
  },

  getAppointmentTypes: async (): Promise<AppointmentTypeDto[]> => {
    const { data } = await apiFetch('/api/appointment-types');
    return data;
  },

  getDoctorDirectory: async (): Promise<DoctorDirectoryDto[]> => {
    const { data } = await apiFetch('/api/doctor/directory');
    return data;
  },
};

// Doctor Management (Admin)
export const doctorService = {
  getAll: async (): Promise<DoctorDto[]> => {
    const { data } = await apiFetch('/api/doctor');
    return data;
  },

  getById: async (id: number): Promise<DoctorDto> => {
    const { data } = await apiFetch(`/api/doctor/${id}`);
    return data;
  },

  create: async (doctorData: CreateDoctorWithUserRequest): Promise<DoctorDto> => {
    const { data } = await apiFetch('/api/doctor', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
    return data;
  },

  updateStatus: async (id: number, status: 'Active' | 'Inactive'): Promise<DoctorDto> => {
    const { data } = await apiFetch(`/api/doctor/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return data;
  },
};

// Doctor Schedules
export const scheduleService = {
  getSchedules: async (
    doctorId: number,
    from?: string,
    to?: string
  ): Promise<DoctorScheduleDto[]> => {
    const query = buildQueryString({ from, to });
    const { data } = await apiFetch(`/api/doctors/${doctorId}/schedules${query}`);
    return data;
  },

  getAvailability: async (
    doctorId: number,
    from?: string,
    to?: string
  ): Promise<DoctorAvailabilityDto[]> => {
    const query = buildQueryString({ from, to });
    const { data } = await apiFetch(`/api/doctors/${doctorId}/availability${query}`);
    return data;
  },

  createSchedule: async (
    doctorId: number,
    schedule: CreateDoctorScheduleRequest
  ): Promise<DoctorScheduleDto> => {
    const { data } = await apiFetch(`/api/doctors/${doctorId}/schedules`, {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
    return data;
  },

  updateSchedule: async (
    doctorId: number,
    scheduleId: number,
    schedule: UpdateDoctorScheduleRequest
  ): Promise<DoctorScheduleDto> => {
    const { data } = await apiFetch(`/api/doctors/${doctorId}/schedules/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(schedule),
    });
    return data;
  },

  deleteSchedule: async (doctorId: number, scheduleId: number): Promise<void> => {
    await apiFetch(`/api/doctors/${doctorId}/schedules/${scheduleId}`, {
      method: 'DELETE',
    });
  },
};

// Appointments
export const appointmentService = {
  getAll: async (): Promise<AppointmentDto[]> => {
    const { data } = await apiFetch('/api/appointment');
    return data;
  },

  getById: async (id: number): Promise<AppointmentDto> => {
    const { data } = await apiFetch(`/api/appointment/${id}`);
    return data;
  },

  getMine: async (): Promise<AppointmentDto[]> => {
    const { data } = await apiFetch('/api/appointment/mine');
    return data;
  },

  getDoctorAppointments: async (
    doctorId: number,
    from?: string,
    to?: string
  ): Promise<DoctorAppointmentDto[]> => {
    const query = buildQueryString({ from, to });
    const { data } = await apiFetch(`/api/doctors/${doctorId}/appointments${query}`);
    return data;
  },

  create: async (appointment: CreateAppointmentRequest): Promise<AppointmentDto> => {
    const { data } = await apiFetch('/api/appointment', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    return data;
  },

  cancel: async (id: number): Promise<AppointmentDto> => {
    const { data } = await apiFetch(`/api/appointment/${id}/cancel`, {
      method: 'PATCH',
    });
    return data;
  },

  complete: async (id: number, request: CompleteAppointmentRequest): Promise<CompleteAppointmentResponse> => {
    const { data } = await apiFetch(`/api/appointment/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data;
  },

  markNoShow: async (id: number): Promise<AppointmentDto> => {
    const { data } = await apiFetch(`/api/appointment/${id}/no-show`, {
      method: 'PATCH',
    });
    return data;
  },
};

// Payments
export const paymentService = {
  uploadReceipt: async (
    appointmentId: number,
    receipt: File
  ): Promise<AppointmentPaymentDocumentDto> => {
    const formData = new FormData();
    formData.append('receipt', receipt);

    const { data } = await apiFetch(`/api/appointment-payments/${appointmentId}/receipt`, {
      method: 'POST',
      body: formData,
    });
    return data;
  },

  getInvoiceUrl: async (
    appointmentId: number,
    expiresInSeconds?: number
  ): Promise<DocumentUrlResponse> => {
    const query = buildQueryString({ expiresInSeconds });
    const { data } = await apiFetch(
      `/api/appointment-payments/${appointmentId}/invoice-url${query}`
    );
    return data;
  },

  getReceiptUrl: async (
    appointmentId: number,
    expiresInSeconds?: number
  ): Promise<DocumentUrlResponse> => {
    const query = buildQueryString({ expiresInSeconds });
    const { data } = await apiFetch(
      `/api/appointment-payments/${appointmentId}/receipt-url${query}`
    );
    return data;
  },
};

// User Management (Admin)
export const userService = {
  getAll: async (): Promise<UserDto[]> => {
    const { data } = await apiFetch('/api/user');
    return data;
  },

  getAvailable: async (): Promise<UserDto[]> => {
    const { data } = await apiFetch('/api/user/available');
    return data;
  },

  createAdmin: async (userData: CreateAdminUserRequest): Promise<AdminUserDto> => {
    const { data } = await apiFetch('/api/user/admin', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data;
  },

  createPatient: async (userData: CreatePatientUserRequest): Promise<PatientUserDto> => {
    const { data } = await apiFetch('/api/user/patient', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data;
  },
};

// Medical Records
export const medicalRecordService = {
  getById: async (medicalRecordId: number): Promise<MedicalRecordDto> => {
    const { data } = await apiFetch(`/api/medical-records/${medicalRecordId}`);
    return data;
  },

  uploadFiles: async (medicalRecordId: number, files: File[]): Promise<MedicalRecordFileDto[]> => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const { data } = await apiFetch(`/api/medical-records/${medicalRecordId}/files`, {
      method: 'POST',
      body: formData,
    });
    return data;
  },

  getFilePresignedUrl: async (
    recordFileId: number,
    expiresInSeconds?: number
  ): Promise<FilePresignedUrlResponse> => {
    const query = buildQueryString({ expiresInSeconds });
    const { data } = await apiFetch(
      `/api/medical-records/files/${recordFileId}/presigned-url${query}`
    );
    return data;
  },
};
