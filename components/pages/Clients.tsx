
import React, { useState } from 'react';
import { useStore } from '../../hooks/useStore.ts';
import { Client } from '../../types.ts';
import PageWrapper from '../layout/PageWrapper.tsx';
import Button from '../ui/Button.tsx';
import Modal from '../ui/Modal.tsx';
import Input from '../ui/Input.tsx';
import { PlusIcon, EditIcon, TrashIcon, DownloadIcon, CloudSyncIcon, InvoiceIcon } from '../Icons.tsx';
import { generateClientsPdf } from '../../services/pdfService.ts';

const Clients: React.FC = () => {
    const { state, dispatch } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const openModal = (client: Client | null = null) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingClient(null);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            dispatch({ type: 'DELETE_CLIENT', payload: id });
        }
    };

    const exportClientsToCSV = () => {
        if (state.clients.length === 0) {
            alert("No client data to export.");
            return;
        }

        const headers = ['Name', 'Email', 'Phone', 'Address'];
        const rows = state.clients.map(client => [
            `"${client.name.replace(/"/g, '""')}"`,
            `"${client.email.replace(/"/g, '""')}"`,
            `"${client.phone.replace(/"/g, '""')}"`,
            `"${client.address.replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `invosync_clients_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportClientsToPDF = () => {
        if (state.clients.length === 0) {
            alert("No client data to export.");
            return;
        }
        generateClientsPdf(state.clients, state.profile);
    };

    const syncToCRM = async () => {
        if (state.clients.length === 0) {
            alert("No client data to sync.");
            return;
        }

        setIsSyncing(true);
        // Simulate an API call to a CRM
        await new Promise(resolve => setTimeout(resolve, 2000));

        state.clients.forEach(client => {
            dispatch({
                type: 'UPDATE_CLIENT',
                payload: {
                    ...client,
                    crmId: `CRM-${Math.floor(Math.random() * 90000) + 10000}`,
                    lastSynced: new Date().toLocaleString()
                }
            });
        });

        setIsSyncing(false);
        alert("Client database successfully synchronized with InvoSync CRM cloud.");
    };
    
    return (
        <PageWrapper
            title="Clients"
            actions={
                <div className="flex flex-wrap gap-2 justify-end">
                    <Button onClick={syncToCRM} variant="secondary" className="bg-primary hover:bg-indigo-700" disabled={isSyncing}>
                        <CloudSyncIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync to CRM'}</span>
                    </Button>
                    <div className="flex bg-gray-100 p-1 rounded-md border">
                        <button onClick={exportClientsToCSV} className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-white rounded transition-all flex items-center gap-1 border-r border-gray-200">
                             <DownloadIcon className="w-4 h-4" /> CSV
                        </button>
                        <button onClick={exportClientsToPDF} className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-white rounded transition-all flex items-center gap-1">
                             <InvoiceIcon className="w-4 h-4" /> PDF
                        </button>
                    </div>
                    <Button onClick={() => openModal()}>
                        <PlusIcon />
                        <span>Add Client</span>
                    </Button>
                </div>
            }
        >
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CRM Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {state.clients.map(client => (
                            <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{client.name}</div>
                                    <div className="text-sm text-gray-500 max-w-xs truncate">{client.address}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{client.email}</div>
                                    <div className="text-sm text-gray-500">{client.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {client.crmId ? (
                                        <div className="flex flex-col">
                                            <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-green-100 text-green-800 w-fit">
                                                {client.crmId}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-1 italic">Synced: {client.lastSynced?.split(',')[0]}</span>
                                        </div>
                                    ) : (
                                        <span className="px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-gray-100 text-gray-500">
                                            Not Synced
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => openModal(client)} className="text-primary hover:text-indigo-900 mr-4" title="Edit Client"><EditIcon /></button>
                                    <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-900" title="Delete Client"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {state.clients.length === 0 && <p className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg m-4 border-2 border-dashed border-gray-200">No clients found. Add one to get started!</p>}
            </div>
            <ClientFormModal isOpen={isModalOpen} onClose={closeModal} client={editingClient} />
        </PageWrapper>
    );
};

const ClientFormModal: React.FC<{ isOpen: boolean; onClose: () => void; client: Client | null }> = ({ isOpen, onClose, client }) => {
    const { dispatch } = useStore();
    const [formData, setFormData] = useState({
        name: '', email: '', address: '', phone: '',
    });

    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                name: client?.name || '',
                email: client?.email || '',
                address: client?.address || '',
                phone: client?.phone || '',
            });
        }
    }, [client, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (client) {
            dispatch({ type: 'UPDATE_CLIENT', payload: { ...client, ...formData } });
        } else {
            dispatch({ type: 'ADD_CLIENT', payload: { ...formData, id: Date.now().toString() } });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Edit Client' : 'Add New Client'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Client Name" name="name" value={formData.name} onChange={handleChange} required placeholder="Acme Corp" />
                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="contact@acme.com" />
                <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm" placeholder="123 Business Way..."></textarea>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={onClose} className="bg-gray-200 text-gray-800 hover:bg-gray-300">Cancel</Button>
                    <Button type="submit">{client ? 'Update Client' : 'Save Client'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default Clients;
