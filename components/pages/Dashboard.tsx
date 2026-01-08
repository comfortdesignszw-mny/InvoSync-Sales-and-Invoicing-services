
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore.ts';
import { useAuth } from '../../hooks/useAuth.tsx';
import Card from '../ui/Card.tsx';
import PageWrapper from '../layout/PageWrapper.tsx';
import { DocumentStatus, DocumentType } from '../../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { InventoryIcon, InvoiceIcon, DownloadIcon, QuoteIcon, SettingsIcon } from '../Icons.tsx';
import { generatePdf } from '../../services/pdfService.ts';

const Dashboard: React.FC = () => {
    const { state, lastSaved } = useStore();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { invoices, quotes, products, profile } = state;

    const totalRevenue = invoices
        .filter(inv => inv.status === DocumentStatus.PAID)
        .reduce((sum, inv) => sum + inv.lineItems.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);

    const outstandingRevenue = invoices
        .filter(inv => inv.status === DocumentStatus.SENT)
        .reduce((sum, inv) => sum + inv.lineItems.reduce((itemSum, item) => itemSum + item.price * item.quantity, 0), 0);

    const lowStockProducts = products.filter(p => p.quantity < 5 && p.quantity > 0).length;

    const salesData = invoices.filter(i => i.status === DocumentStatus.PAID).slice(-5).map(inv => ({
        name: inv.docNumber,
        amount: inv.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }));

    // Combine and sort recent documents
    const recentDocs = [...invoices, ...quotes]
        .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
        .slice(0, 5);

    // Profile completion logic
    const profileCompleteness = [
        profile.name !== 'Your Company',
        Boolean(profile.logo),
        profile.address !== 'Business Address',
        Boolean(profile.phone),
        Boolean(profile.email)
    ].filter(Boolean).length / 5 * 100;

    return (
        <PageWrapper title="Dashboard">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900">Welcome back, {user?.name}</h2>
                <p className="text-sm text-gray-500">Here's what's happening with your business today.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                  Active Cloud Session • {lastSaved}
                </span>
              </div>
            </div>

            {/* Profile Health Bar */}
            {profileCompleteness < 100 && (
                <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-indigo-200">
                             <SettingsIcon className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-900">Complete Your Business Identity</h3>
                            <p className="text-sm text-indigo-700">Add a logo and physical address to design professional letterheads.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex-1 md:w-48 bg-indigo-200 h-2 rounded-full overflow-hidden">
                             <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${profileCompleteness}%` }}></div>
                        </div>
                        <button 
                            onClick={() => navigate('/settings')}
                            className="whitespace-nowrap px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-primary/20 transition-all"
                        >
                            Design Profile
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card
                    title="Total Revenue"
                    value={`$${totalRevenue.toFixed(2)}`}
                    icon={<InvoiceIcon />}
                    color="primary"
                />
                <Card
                    title="Outstanding"
                    value={`$${outstandingRevenue.toFixed(2)}`}
                    icon={<InvoiceIcon />}
                    color="yellow"
                />
                <Card
                    title="Paid Invoices"
                    value={invoices.filter(i => i.status === DocumentStatus.PAID).length}
                    icon={<InvoiceIcon />}
                    color="secondary"
                />
                <Card
                    title="Low Stock Items"
                    value={lowStockProducts}
                    icon={<InventoryIcon />}
                    color="red"
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Sales Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Sales Performance</h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip 
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']} 
                            />
                            <Legend iconType="circle" />
                            <Bar dataKey="amount" name="Paid Invoices" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Recent Documents</h2>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last 5 Created</span>
                </div>
                <div className="space-y-4">
                    {recentDocs.length > 0 ? (
                        recentDocs.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg ${doc.type === DocumentType.INVOICE ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {doc.type === DocumentType.INVOICE ? <InvoiceIcon className="w-5 h-5" /> : <QuoteIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-gray-900 text-sm truncate max-w-[120px]">{doc.docNumber}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[120px]">{doc.customerName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">
                                            ${(doc.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * (1 + profile.taxRate / 100)).toFixed(2)}
                                        </p>
                                        <p className="text-[10px] text-gray-400">{doc.issueDate}</p>
                                    </div>
                                    <button 
                                        onClick={() => generatePdf(doc, profile)}
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-full transition-all"
                                        title="Download PDF"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-gray-400 text-sm">No recent documents created yet.</p>
                            <button 
                                onClick={() => navigate('/invoices/new')}
                                className="mt-4 text-xs font-bold text-primary hover:underline"
                            >
                                + Create Your First Invoice
                            </button>
                        </div>
                    )}
                </div>
              </div>
            </div>
        </PageWrapper>
    );
};

export default Dashboard;
