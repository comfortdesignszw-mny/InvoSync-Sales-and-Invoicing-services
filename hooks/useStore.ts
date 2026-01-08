
import React, { createContext, useReducer, useContext, useEffect, ReactNode, useState, useRef } from 'react';
import { AppState, Action, DocumentType, LineItem, SyncStatus } from '../types.ts';
import { INITIAL_STATE } from '../constants.ts';
import { useAuth } from './useAuth.tsx';
import { dbService } from '../services/dbService.ts';

const StoreContext = createContext<{ 
  state: AppState; 
  dispatch: React.Dispatch<Action>;
  syncStatus: SyncStatus;
  lastSaved: string | null;
} | undefined>(undefined);

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_STATE':
        return action.payload;
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'DELETE_PRODUCT':
      return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map(c => c.id === action.payload.id ? action.payload : c),
      };
    case 'DELETE_CLIENT':
      return { ...state, clients: state.clients.filter(c => c.id !== action.payload) };
    case 'ADD_DOCUMENT':
    {
      if (action.payload.type === DocumentType.INVOICE) {
        const updatedProducts = state.products.map(p => {
          const item = action.payload.lineItems.find(li => li.productId === p.id);
          if (item) {
            return { ...p, quantity: Math.max(0, p.quantity - item.quantity) };
          }
          return p;
        });
        return {
          ...state,
          products: updatedProducts,
          invoices: [...state.invoices, action.payload],
        };
      } else {
        return { ...state, quotes: [...state.quotes, action.payload] };
      }
    }
    case 'UPDATE_DOCUMENT':
    {
        if (action.payload.type === DocumentType.INVOICE) {
          const payload = action.payload;
          return { ...state, invoices: state.invoices.map(i => i.id === payload.id ? payload : i) };
        } else {
          const payload = action.payload;
          return { ...state, quotes: state.quotes.map(q => q.id === payload.id ? payload : q) };
        }
    }
    case 'DELETE_DOCUMENT':
      if (action.payload.type === DocumentType.INVOICE) {
        return { ...state, invoices: state.invoices.filter(i => i.id !== action.payload.id) };
      } else {
        return { ...state, quotes: state.quotes.filter(i => i.id !== action.payload.id) };
      }
    case 'ADD_TO_CART':
    {
      const existing = state.cart.find(item => item.productId === action.payload.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.productId === action.payload.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        };
      }
      const newItem: LineItem = {
        id: Date.now().toString(),
        productId: action.payload.id,
        name: action.payload.name,
        description: action.payload.description,
        price: action.payload.price,
        quantity: 1
      };
      return { ...state, cart: [...state.cart, newItem] };
    }
    case 'UPDATE_CART_QTY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id ? { ...item, quantity: action.payload.quantity } : item
        )
      };
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(item => item.id !== action.payload) };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    default:
      return state;
  }
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  const isHydrated = useRef(false);
  const syncChannel = useRef<BroadcastChannel | null>(null);
  const saveDebounceTimer = useRef<number | null>(null);

  // 1. Initialize Sync Channel and Load Data
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_STATE', payload: INITIAL_STATE });
      isHydrated.current = false;
      return;
    }

    // Initialize Broadcast Channel for multi-tab real-time sync
    syncChannel.current = new BroadcastChannel(`invosync_cloud_sync_${user.id}`);
    syncChannel.current.onmessage = (event) => {
      if (event.data.type === 'SYNC_STATE') {
        dispatch({ type: 'SET_STATE', payload: event.data.payload });
        setLastSaved(new Date().toLocaleTimeString());
      }
    };

    const hydrateFromCloud = async () => {
      setSyncStatus('loading');
      try {
        const cloudData = await dbService.loadState(user.id);
        
        // Auto-initialize profile with registration info if it's the first time
        if (cloudData.profile.name === 'Your Company') {
          cloudData.profile.name = user.name;
          cloudData.profile.email = user.email;
        }

        dispatch({ type: 'SET_STATE', payload: cloudData });
        isHydrated.current = true;
        setSyncStatus('saved');
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Cloud hydration failed", err);
        setSyncStatus('error');
      }
    };

    hydrateFromCloud();

    return () => {
      syncChannel.current?.close();
    };
  }, [user]);

  // 2. Real-time Persistence Effect
  useEffect(() => {
    if (!user || !isHydrated.current) return;

    // Local multi-tab notification
    syncChannel.current?.postMessage({ type: 'SYNC_STATE', payload: state });

    // Cloud persistence (Simulated)
    setSyncStatus('saving');
    
    if (saveDebounceTimer.current) {
      window.clearTimeout(saveDebounceTimer.current);
    }

    saveDebounceTimer.current = window.setTimeout(async () => {
      try {
        await dbService.saveState(user.id, state);
        setSyncStatus('saved');
        setLastSaved(new Date().toLocaleTimeString());
      } catch (err) {
        setSyncStatus('error');
      }
    }, 800); // 800ms debounce for "Real-time" feel without thrashing the "API"

  }, [state, user]);

  return React.createElement(StoreContext.Provider, { 
    value: { state, dispatch, syncStatus, lastSaved } 
  }, children);
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
