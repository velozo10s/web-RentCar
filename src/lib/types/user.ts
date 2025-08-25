export interface User {
  id: number;
  username: string;
  email: string;
  isEmailValidated: boolean;
  role: string;
  documentType: string;
  documentNumber: string;
  name: string;
  birthDate: string;
  phoneNumber: string;
  isActive: boolean;
}
