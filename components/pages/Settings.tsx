
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../hooks/useStore.ts';
import { BusinessProfile, AppState } from '../../types.ts';
import PageWrapper from '../layout/PageWrapper.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';
import { DownloadIcon, CloudSyncIcon, EyeIcon } from '../Icons.tsx';
import { useAuth } from '../../hooks/useAuth.tsx';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const { state, dispatch, syncStatus, lastSaved } = useStore();
    const [profile, setProfile] = useState<BusinessProfile>(state.profile);
    const [feedback, setFeedback] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            if (file.size > 1024 * 512) { // 512KB limit for better sync performance
                alert("Logo is too large. Please use an image under 512KB for cloud sync.");
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
        setFeedback('Cloud Profile updated!');
        setTimeout(() => setFeedback(''), 3000);
    };

    const handleExportData = () => {
      const dataStr = JSON.stringify(state, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `invosync_cloud_backup_${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    };

    return (
        <PageWrapper title="Brand Identity & Cloud Sync">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              <div className="lg:col-span-7 space-y-8">
                {/* Real-time Status Banner */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${syncStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></div>
                        <div>
                            <p className="text-sm font-bold text-emerald-900">Cloud Persistence Active</p>
                            <p className="text-[10px] text-emerald-700 uppercase tracking-widest">Status: {syncStatus} • {lastSaved}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Device Linking Key</p>
                        <p className="text-xs font-mono text-gray-600 font-bold">{user?.id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="p-2 bg-indigo-50 text-primary rounded-xl">🏗️</span>
                                Business Identity
                            </h3>
                            {feedback && <span className="text-sm font-bold text-emerald-600">{feedback}</span>}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input label="Business Legal Name" name="name" value={profile.name} onChange={handleChange} required />
                            <Input label="Support Email" name="email" type="email" value={profile.email} onChange={handleChange} required />
                            <Input label="Primary Phone" name="phone" value={profile.phone} onChange={handleChange} />
                            <Input label="WhatsApp Line" name="whatsappPhone" value={profile.whatsappPhone} onChange={handleChange} />
                            <Input label="Tax Rate (%)" name="taxRate" type="number" step="0.01" value={profile.taxRate} onChange={handleChange} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Office Address</label>
                            <textarea 
                                name="address" 
                                value={profile.address} 
                                onChange={handleChange} 
                                rows={2} 
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Logo</label>
                            <div className="flex items-center gap-4 p-4 border border-dashed rounded-2xl bg-gray-50/50">
                                {profile.logo && <img src={profile.logo} alt="Logo" className="w-16 h-16 object-contain rounded border bg-white" />}
                                <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full py-4 shadow-lg shadow-primary/10">
                        Save & Sync Changes
                    </Button>
                </form>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="p-2 bg-gray-50 text-gray-400 rounded-xl">🔒</span>
                        Data Portability
                    </h3>
                    <div className="flex gap-4">
                        <button onClick={handleExportData} className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-center">
                            <DownloadIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Offline Backup</span>
                        </button>
                        <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 text-center opacity-50 cursor-not-allowed">
                            <CloudSyncIcon className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Sync History</span>
                        </div>
                    </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="sticky top-24 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 px-2">
                        <EyeIcon className="w-5 h-5 text-gray-400" />
                        Letterhead Live Preview
                    </h3>

                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 aspect-[1/1.414] relative p-8">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
                        
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                {profile.logo ? (
                                    <img src={profile.logo} className="h-8 w-auto mb-4" alt="Logo" />
                                ) : (
                                    <h2 className="text-lg font-black text-primary mb-4">{profile.name || 'COMPANY NAME'}</h2>
                                )}
                                <div className="text-[8px] uppercase tracking-tighter text-gray-400 leading-tight">
                                    <p>{profile.address}</p>
                                    <p>{profile.email}</p>
                                    <p>{profile.phone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-2xl font-black text-gray-200">RECORD</h1>
                                <p className="text-[10px] text-gray-400">#00000000</p>
                            </div>
                        </div>

                        <div className="h-[1px] bg-gray-100 mb-6"></div>

                        <div className="space-y-3">
                            <div className="h-3 w-1/4 bg-gray-50 rounded"></div>
                            <div className="h-10 w-full bg-gray-50 rounded"></div>
                            <div className="h-10 w-full bg-gray-50 rounded"></div>
                            <div className="h-10 w-full bg-gray-50 rounded"></div>
                        </div>

                        <div className="absolute bottom-8 left-8 right-8 text-center">
                            <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest">Powered by InvoSync Professional Cloud</p>
                        </div>
                    </div>
                </div>
              </div>

            </div>
        </PageWrapper>
    );
};

export default Settings;
