
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.tsx';
import Dashboard from './components/pages/Dashboard.tsx';
import Inventory from './components/pages/Inventory.tsx';
import Clients from './components/pages/Clients.tsx';
import DocumentsList from './components/pages/DocumentsList.tsx';
import DocumentEditor from './components/pages/DocumentEditor.tsx';
import Settings from './components/pages/Settings.tsx';
import Login from './components/pages/Login.tsx';
import Register from './components/pages/Register.tsx';
import Cart from './components/pages/Cart.tsx';
import { DocumentType } from './types.ts';
import { useAuth } from './hooks/useAuth.tsx';
import { useStore } from './hooks/useStore.ts';
import { MenuIcon, CloudSyncIcon } from './components/Icons.tsx';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const { syncStatus, lastSaved } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium tracking-wide">Initializing secure workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-background text-text-main flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-primary hover:bg-indigo-50 rounded-lg transition-all"
              aria-label="Open Menu"
            >
              <MenuIcon className="w-7 h-7" />
            </button>
            <div className="flex items-center">
               <span className="text-xl font-black tracking-tight text-primary">InvoSync</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Real-time Sync Status */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
               <div className={`w-2 h-2 rounded-full ${
                 syncStatus === 'saved' ? 'bg-emerald-500' : 
                 syncStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 
                 'bg-red-500'
               }`} />
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                 {syncStatus === 'saved' ? `Last Synced: ${lastSaved}` : 
                  syncStatus === 'saving' ? 'Syncing...' : 'Sync Error'}
               </span>
               <CloudSyncIcon className={`w-3.5 h-3.5 text-gray-400 ${syncStatus === 'saving' ? 'animate-spin' : ''}`} />
            </div>
            
            <div className="flex items-center space-x-3">
               <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-gray-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-gray-500 leading-tight uppercase tracking-widest">{user.email}</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-primary text-sm">
                  {user.name.charAt(0)}
               </div>
            </div>
          </div>
        </header>

        {/* Navigation Sidebar Drawer */}
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/invoices" element={<DocumentsList type={DocumentType.INVOICE} />} />
            <Route path="/invoices/new" element={<DocumentEditor type={DocumentType.INVOICE} />} />
            <Route path="/invoices/edit/:id" element={<DocumentEditor type={DocumentType.INVOICE} />} />
            <Route path="/quotes" element={<DocumentsList type={DocumentType.QUOTE} />} />
            <Route path="/quotes/new" element={<DocumentEditor type={DocumentType.QUOTE} />} />
            <Route path="/quotes/edit/:id" element={<DocumentEditor type={DocumentType.QUOTE} />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
