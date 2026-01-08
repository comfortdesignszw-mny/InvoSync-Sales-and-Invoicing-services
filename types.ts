
export interface BusinessProfile {
  name: string;
  address: string;
  email: string;
  phone: string;
  whatsappPhone: string;
  logo: string;
  taxRate: number;
}

export type ItemCategory = 'Product' | 'Service';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: ItemCategory;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  crmId?: string;
  lastSynced?: string;
}

export interface LineItem {
  id: string;
  productId?: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
}

export enum DocumentType {
  INVOICE = 'invoice',
  QUOTE = 'quote',
}

export enum DocumentStatus {
    DRAFT = 'Draft',
    SENT = 'Sent',
    PAID = 'Paid',
    ACCEPTED = 'Accepted',
    REJECTED = 'Rejected',
}

export interface Document {
  id: string;
  type: DocumentType;
  docNumber: string;
  clientId?: string;
  customerName: string;
  customerAddress: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  notes: string;
  status: DocumentStatus;
}

export type Invoice = Document & { type: DocumentType.INVOICE };
export type Quote = Document & { type: DocumentType.QUOTE };

export interface AppState {
  profile: BusinessProfile;
  products: Product[];
  clients: Client[];
  invoices: Invoice[];
  quotes: Quote[];
  cart: LineItem[];
}

export type SyncStatus = 'saved' | 'saving' | 'error' | 'offline' | 'loading';

export type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'UPDATE_PROFILE'; payload: Partial<BusinessProfile> }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'ADD_DOCUMENT'; payload: Invoice | Quote }
  | { type: 'UPDATE_DOCUMENT'; payload: Invoice | Quote }
  | { type: 'DELETE_DOCUMENT'; payload: { type: DocumentType; id: string } }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'UPDATE_CART_QTY'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' };
