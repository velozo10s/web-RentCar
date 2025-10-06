export type CustomerSummary = {
  personId: number;
  documentType: 'CI' | 'PASS' | 'DL' | string;
  documentNumber: string;
  name: string;
  phoneNumber?: string;
  birthDate?: string;
  isActive: boolean;
};

export type CustomerDocument = {
  type: 'document' | 'license' | string;
  frontFilePath?: string | null;
  backFilePath?: string | null;
  expirationDate?: string | null;
  entryDate?: string | null;
};

export type CustomerDetail = CustomerSummary & {
  documents?: CustomerDocument[];
};
