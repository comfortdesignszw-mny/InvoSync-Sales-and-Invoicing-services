
import { AppState, BusinessProfile, DocumentStatus, DocumentType } from './types.ts';

export const LOCAL_STORAGE_KEY = 'invoSyncData';

export const DEFAULT_PROFILE: BusinessProfile = {
    name: 'Your Company',
    address: 'Business Address',
    email: 'contact@company.com',
    phone: '',
    whatsappPhone: '',
    logo: '',
    taxRate: 0,
};

export const INITIAL_STATE: AppState = {
    profile: DEFAULT_PROFILE,
    products: [],
    clients: [],
    invoices: [],
    quotes: [],
    cart: []
};
