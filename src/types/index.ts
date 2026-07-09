// Auth & User Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: number;
  role: 'Admin' | 'Doctor' | 'Patient';
}

export interface DecodedToken {
  unique_name: string;
  role: 'Admin' | 'Doctor' | 'Patient';
  sub: string;
  doctor_id?: string;
  patient_id?: string;
  jti: string;
  exp: number;
}

// Patient Types
export interface CreatePatientUserRequest {
  icPassport: string;
  username: string;
  password: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  contactNumber: string;
  email: string;
}

export interface PatientUserDto {
  patientId: number;
  icPassport: string;
  username: string;
  role: string;
  name: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
}

// Doctor Types
export interface DoctorDto {
  doctorId: number;
  name: string;
  icPassport: string;
  specialistId: number;
  contactNumber: string;
  status: 'Active' | 'Inactive';
  medicalLicense: string;
  hospitalId: number;
}

export interface DoctorDirectoryDto {
  doctorId: number;
  name: string;
  contactNumber: string;
  status: string;
  specialistId: number;
  specialismName: string;
  hospitalId: number;
  hospitalName: string;
}

export interface CreateDoctorWithUserRequest {
  icPassport: string;
  username: string;
  password: string;
  name: string;
  specialistId: number;
  contactNumber: string;
  status: string;
  medicalLicense: string;
  hospitalId: number;
}

// Schedule Types
export interface DoctorScheduleDto {
  scheduleId: number;
  doctorId: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
}

export interface DoctorAvailabilityDto {
  doctorId: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
}

export interface CreateDoctorScheduleRequest {
  date: string;
  startTime: string;
  endTime: string;
}

export interface UpdateDoctorScheduleRequest {
  date: string;
  startTime: string;
  endTime: string;
}

// Appointment Types
export interface AppointmentDto {
  appointmentId: number;
  appointmentCategoryId: number;
  doctorId: number;
  doctorName: string;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  status: 'Scheduled' | 'Paid Scheduled' | 'Cancelled' | 'Completed' | 'No-show' | 'Expired';
  medicalConcern: string;
  startTime: string;
  endTime: string;
}

export interface DoctorAppointmentDto {
  appointmentId: number;
  patientName: string;
  appointmentType: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: string;
  medicalConcern: string;
  paymentStatus: 'Unpaid' | 'Paid';
}

export interface CreateAppointmentRequest {
  appointmentCategoryId: number;
  doctorId: number;
  patientId: number;
  appointmentDate: string;
  medicalConcern: string;
  startTime: string;
  endTime: string;
}

// Payment Types
export interface AppointmentPaymentDocumentDto {
  paymentDocumentId: number;
  appointmentId: number;
  appointmentStatus: string;
  receiptFileName: string;
  receiptS3ObjectKey: string;
  receiptPresignedUrl?: string;
  invoiceFileName: string;
  invoiceS3ObjectKey: string;
  invoicePresignedUrl?: string;
  paidAt: string;
}

export interface DocumentUrlResponse {
  invoiceUrl?: string;
  receiptUrl?: string;
  expiresInSeconds: number;
}

// Reference Data Types
export interface HospitalDto {
  hospitalId: number;
  name: string;
}

export interface SpecialismDto {
  specialistId: number;
  specialism: string;
}

export interface AppointmentTypeDto {
  appointmentCategoryId: number;
  type: string;
}

export interface UserDto {
  icPassport: string;
  username: string;
  role: string;
}

export interface CreateAdminUserRequest {
  icPassport: string;
  username: string;
  password: string;
  name: string;
  dob?: string; // YYYY-MM-DD
}

export interface AdminUserDto {
  adminId: number;
  icPassport: string;
  username: string;
  role: string;
  name: string;
  dob?: string;
}

// Error Response
export interface ErrorResponse {
  error: string;
  errors?: Record<string, string[]>;
}

// Medical Record Types
export interface MedicalRecordDto {
  medicalRecordId: number;
  appointmentId: number;
  diagnose: string;
  createdAt: string;
  note: string;
  files: MedicalRecordFileDto[];
}

export interface MedicalRecordFileDto {
  recordFileId: number;
  medicalRecordId: number;
  fileName: string;
  fileType: string;
  s3ObjectKey: string;
  presignedUrl?: string;
}

export interface CompleteAppointmentRequest {
  diagnose: string;
  note: string;
}

export interface CompleteAppointmentResponse {
  appointment: AppointmentDto;
  medicalRecord: MedicalRecordDto;
}

export interface FilePresignedUrlResponse {
  fileUrl: string;
  expiresInSeconds: number;
}
