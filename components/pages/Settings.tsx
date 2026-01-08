
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../hooks/useStore.ts';
import { BusinessProfile, AppState } from '../../types.ts';
import PageWrapper from '../layout/PageWrapper.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';
import { DownloadIcon, CloudSyncIcon, EyeIcon } from '../Icons.tsx';

const Settings: React.FC = () => {
    const { state, dispatch } = useStore();
    const [profile, setProfile] = useState<BusinessProfile>(state.profile);
    const [feedback, setFeedback] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync local state if global state changes externally (e.g. import)
    useEffect(() => {
        setProfile(state.profile);
    }, [state.profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: name === 'taxRate' ? parseFloat(value) || 0 : value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) { // 1MB limit for localStorage safety
                alert("Image too large. Please use an image under 1MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'UPDATE_PROFILE', payload: profile });
        setFeedback('Brand Identity saved and persisted!');
        setTimeout(() => setFeedback(''), 3000);
    };

    const handleExportData = () => {
      const dataStr = JSON.stringify(state, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `invosync_backup_${state.profile.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      setFeedback('Data exported successfully!');
      setTimeout(() => setFeedback(''), 3000);
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importedState = JSON.parse(content) as AppState;
          if (!importedState.profile) throw new Error('Invalid backup file format.');
          if (window.confirm('This will overwrite all current settings and documents. Continue?')) {
            dispatch({ type: 'SET_STATE', payload: importedState });
            setFeedback('Backup restored successfully!');
            setTimeout(() => setFeedback(''), 3000);
          }
        } catch (err) {
          alert('Failed to import: ' + (err as Error).message);
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <PageWrapper title="Brand Identity Studio">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* Left Column: Form Editor */}
              <div className="lg:col-span-7 space-y-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="p-2 bg-indigo-50 text-primary rounded-xl">🏗️</span>
                                Business Profile
                            </h3>
                            {feedback && <span className="text-sm font-bold text-emerald-600 animate-bounce">{feedback}</span>}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Business Legal Name" name="name" value={profile.name} onChange={handleChange} required />
                            <Input label="Support Email" name="email" type="email" value={profile.email} onChange={handleChange} required />
                            <Input label="Primary Phone" name="phone" value={profile.phone} onChange={handleChange} />
                            <Input label="WhatsApp (For Orders)" name="whatsappPhone" value={profile.whatsappPhone} onChange={handleChange} placeholder="e.g. 15550001234" />
                            <Input label="Default Tax Rate (%)" name="taxRate" type="number" step="0.01" value={profile.taxRate} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Physical Address</label>
                            <textarea 
                                name="address" 
                                value={profile.address} 
                                onChange={handleChange} 
                                rows={3} 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                placeholder="Street, Building, City, Zip Code"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Business Logo</label>
                            <div className="flex items-center gap-6 p-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                {profile.logo ? (
                                    <div className="relative group">
                                        <img src={profile.logo} alt="Logo" className="w-24 h-24 object-contain rounded-lg border bg-white" />
                                        <button 
                                            type="button"
                                            onClick={() => setProfile(p => ({...p, logo: ''}))}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 bg-white border rounded-lg flex items-center justify-center text-gray-300 text-xs text-center p-2">
                                        No Logo Uploaded
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 mb-2">Recommended: Square or horizontal PNG/JPG. Max 1MB.</p>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleLogoChange} 
                                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full py-4 text-lg shadow-xl shadow-primary/10">
                        Update Brand Identity
                    </Button>
                </form>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">🛡️</span>
                        Data Persistence & Backup
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={handleExportData} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all text-center">
                            <DownloadIcon className="w-8 h-8 text-indigo-500 mb-2" />
                            <span className="font-bold text-sm">Download Backup</span>
                            <span className="text-[10px] text-gray-500 uppercase">Save to device</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all text-center">
                            <CloudSyncIcon className="w-8 h-8 text-emerald-500 mb-2" />
                            <span className="font-bold text-sm">Restore Data</span>
                            <span className="text-[10px] text-gray-500 uppercase">Upload JSON</span>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportData} />
                        </button>
                    </div>
                </div>
              </div>

              {/* Right Column: Live Letterhead Preview */}
              <div className="lg:col-span-5 space-y-6">
                <div className="sticky top-24">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <EyeIcon className="w-5 h-5 text-gray-400" />
                            Letterhead Live Preview
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scale: 75%</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 aspect-[1/1.4] relative p-8 select-none">
                        {/* Fake Letterhead Content */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>
                        
                        <div className="flex justify-between items-start mb-10">
                            <div className="w-2/3">
                                {profile.logo ? (
                                    <img src={profile.logo} className="h-10 w-auto object-contain max-w-full" alt="Logo Preview" />
                                ) : (
                                    <h2 className="text-xl font-black text-primary truncate">{profile.name || 'Your Company Name'}</h2>
                                )}
                                <div className="mt-3 text-[9px] leading-relaxed text-gray-500 max-w-[180px]">
                                    <p className="whitespace-pre-wrap">{profile.address || 'Business Address Street'}</p>
                                    <p>{profile.email || 'business@email.com'}</p>
                                    <p>{profile.phone || '+263 ...'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h4 className="text-2xl font-black text-gray-300">INVOICE</h4>
                                <p className="text-[10px] font-bold text-gray-400">#INV-2024-001</p>
                            </div>
                        </div>

                        <div className="h-0.5 bg-gray-100 mb-8"></div>

                        <div className="flex justify-between mb-10">
                            <div>
                                <p className="text-[8px] font-bold text-primary mb-1">BILL TO</p>
                                <p className="text-[10px] font-bold text-gray-900">John Doe Client</p>
                                <p className="text-[9px] text-gray-500">123 Client Ave, New York</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-bold text-primary mb-1">DATE</p>
                                <p className="text-[10px] text-gray-900">Oct 24, 2024</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-8">
                            <div className="h-6 bg-gray-50 rounded flex items-center px-2">
                                <div className="h-1.5 w-1/2 bg-gray-200 rounded"></div>
                                <div className="h-1.5 w-4 bg-gray-200 rounded ml-auto"></div>
                            </div>
                            <div className="h-6 bg-white border border-gray-50 rounded flex items-center px-2">
                                <div className="h-1.5 w-1/3 bg-gray-100 rounded"></div>
                                <div className="h-1.5 w-4 bg-gray-100 rounded ml-auto"></div>
                            </div>
                        </div>

                        <div className="mt-auto pt-10 border-t border-gray-50 text-center">
                             <p className="text-[8px] text-gray-300">Generated by InvoSync Professional</p>
                        </div>
                    </div>
                    
                    <p className="mt-4 text-xs text-gray-500 italic text-center">
                        This preview shows how your identity appears on formal records.
                    </p>
                </div>
              </div>

            </div>
        </PageWrapper>
    );
};

export default Settings;
