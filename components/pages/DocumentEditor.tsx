
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../hooks/useStore.ts';
import { Document, DocumentType, LineItem, DocumentStatus } from '../../types.ts';
import PageWrapper from '../layout/PageWrapper.tsx';
import Button from '../ui/Button.tsx';
import Input from '../ui/Input.tsx';
import { TrashIcon, DownloadIcon, SettingsIcon } from '../Icons.tsx';
import { generatePdf } from '../../services/pdfService.ts';

interface DocumentEditorProps {
    type: DocumentType;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({ type }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { state, dispatch } = useStore();
    const [doc, setDoc] = useState<Partial<Document>>({});
    const [isManualOverride, setIsManualOverride] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    
    const isEditing = Boolean(id);
    const title = `${isEditing ? 'Edit' : 'New'} ${type === DocumentType.INVOICE ? 'Invoice' : 'Quote'}`;

    useEffect(() => {
        if (isEditing) {
            const existingDoc = type === DocumentType.INVOICE
                ? state.invoices.find(i => i.id === id)
                : state.quotes.find(q => q.id === id);
            if (existingDoc) {
                setDoc(existingDoc);
                // If the document has customer info but no linked clientId, consider it a manual override
                if (!existingDoc.clientId && (existingDoc.customerName || existingDoc.customerEmail)) {
                    setIsManualOverride(true);
                }
            }
        } else if (!isInitialized) {
            const docList = type === DocumentType.INVOICE ? state.invoices : state.quotes;
            
            // Generate next ID by looking at existing docs of this type
            const nextId = docList.length > 0 ? Math.max(...docList.map(d => {
                const parts = d.docNumber.split('-');
                const lastSegment = parts[parts.length - 1];
                const numericPart = parseInt(lastSegment, 10);
                return isNaN(numericPart) ? 0 : numericPart;
            })) + 1 : 1;
            
            const prefix = type === DocumentType.INVOICE ? 'INV' : 'QT';
            const year = new Date().getFullYear();
            const autoDocNumber = `${prefix}-${year}-${nextId.toString().padStart(3, '0')}`;
            
            const prefilledItems = location.state?.prefilledCart as LineItem[] | undefined;

            setDoc({
                type,
                docNumber: autoDocNumber,
                customerName: '', customerAddress: '', customerEmail: '',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                lineItems: prefilledItems || [],
                notes: prefilledItems ? 'Generated from Cart Order via WhatsApp.' : '',
                status: DocumentStatus.DRAFT,
            });
            setIsInitialized(true);
        }
    }, [id, isEditing, type, state.invoices, state.quotes, location.state, isInitialized]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // If user manually edits customer fields, enable manual override to lock client selection
        if (['customerName', 'customerAddress', 'customerEmail'].includes(name)) {
            setIsManualOverride(true);
        }
        
        setDoc(prev => ({ ...prev, [name]: value }));
    };

    const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedClientId = e.target.value;
        const selectedClient = state.clients.find(c => c.id === selectedClientId);

        setIsManualOverride(false);

        if (selectedClient) {
            setDoc(prevDoc => ({
                ...prevDoc,
                clientId: selectedClient.id,
                customerName: selectedClient.name,
                customerAddress: selectedClient.address,
                customerEmail: selectedClient.email,
            }));
        } else {
            setDoc(prevDoc => ({
                ...prevDoc,
                clientId: undefined,
                customerName: '',
                customerAddress: '',
                customerEmail: '',
            }));
        }
    };

    const handleResetToClientMode = () => {
        setIsManualOverride(false);
        setDoc(prev => ({
            ...prev,
            customerName: '',
            customerAddress: '',
            customerEmail: '',
            clientId: undefined
        }));
    };

    const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
        const updatedLineItems = [...(doc.lineItems || [])];
        if (field === 'productId' && value) {
            const product = state.products.find(p => p.id === value);
            if (product) {
                updatedLineItems[index] = { 
                    ...updatedLineItems[index], 
                    productId: value, 
                    name: product.name, 
                    description: product.description, 
                    price: product.price, 
                    quantity: 1 
                };
            }
        } else {
             updatedLineItems[index] = { ...updatedLineItems[index], [field]: value };
        }
        setDoc({ ...doc, lineItems: updatedLineItems });
    };

    const addLineItem = () => {
        const newItem: LineItem = { id: Date.now().toString(), name: '', description: '', quantity: 1, price: 0 };
        setDoc({ ...doc, lineItems: [...(doc.lineItems || []), newItem] });
    };

    const removeLineItem = (index: number) => {
        const updatedLineItems = (doc.lineItems || []).filter((_, i) => i !== index);
        setDoc({ ...doc, lineItems: updatedLineItems });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(isEditing) {
            dispatch({ type: 'UPDATE_DOCUMENT', payload: doc as Document });
        } else {
            dispatch({ type: 'ADD_DOCUMENT', payload: { ...doc, id: Date.now().toString() } as Document });
        }
        navigate(type === DocumentType.INVOICE ? '/invoices' : '/quotes');
    };

    const handleDownloadPdf = () => {
        if (!doc.customerName) {
            alert("Please provide at least a customer name before exporting.");
            return;
        }
        generatePdf(doc as Document, state.profile);
    };
    
    const subtotal = doc.lineItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
    const tax = subtotal * (state.profile.taxRate / 100);
    const total = subtotal + tax;
    
    if (!doc.docNumber) return <div className="p-8 text-center text-gray-500">Loading Document...</div>

    return (
        <PageWrapper 
            title={title}
            actions={
                <Button onClick={handleDownloadPdf} variant="secondary" type="button" className="bg-emerald-600 hover:bg-emerald-700">
                    <DownloadIcon className="w-5 h-5" />
                    <span>Download PDF</span>
                </Button>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Header Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-6 border-b border-gray-100">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
                            {isManualOverride && (
                                <button 
                                    type="button" 
                                    onClick={handleResetToClientMode}
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                    <SettingsIcon className="w-3 h-3" /> Re-enable Dropdown
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <label htmlFor="client-selector" className="block text-sm font-medium text-gray-700 mb-1">Select Existing Client</label>
                            <select
                                id="client-selector"
                                value={doc.clientId || ''}
                                onChange={handleClientSelect}
                                disabled={isManualOverride}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${isManualOverride ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-gray-50'}`}
                            >
                                <option value="">{isManualOverride ? '-- Locked: Manual Entry --' : '-- Choose a Client (Optional) --'}</option>
                                {state.clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            {isManualOverride && (
                                <p className="mt-1 text-[10px] text-orange-600 italic">
                                    Selection disabled because fields were edited manually.
                                </p>
                            )}
                        </div>
                        <Input label="Customer Name" name="customerName" value={doc.customerName || ''} onChange={handleChange} required />
                        <Input label="Customer Email" name="customerEmail" type="email" value={doc.customerEmail || ''} onChange={handleChange} />
                        <div>
                            <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700 mb-1">Customer Address</label>
                            <textarea 
                                id="customerAddress" 
                                name="customerAddress" 
                                value={doc.customerAddress || ''} 
                                onChange={handleChange} 
                                rows={2} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input 
                                label="Document Number" 
                                name="docNumber" 
                                value={doc.docNumber || ''} 
                                onChange={handleChange}
                                placeholder="e.g. INV-2024-001"
                                required
                            />
                            <div>
                               <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                               <select id="status" name="status" value={doc.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm">
                                   {Object.values(DocumentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                               </select>
                            </div>
                            <Input label="Issue Date" name="issueDate" type="date" value={doc.issueDate} onChange={handleChange} />
                            <Input label="Due Date" name="dueDate" type="date" value={doc.dueDate} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                {/* Line Items Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                        <Button type="button" variant="secondary" onClick={addLineItem} className="text-sm px-3 py-1.5">
                            + Add Item
                        </Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-2 py-3 w-1/4">Item Selection</th>
                                    <th className="px-2 py-3 w-1/4">Description</th>
                                    <th className="px-2 py-3 w-1/12 text-center">Qty</th>
                                    <th className="px-2 py-3 w-1/6 text-right">Unit Price</th>
                                    <th className="px-2 py-3 w-1/6 text-right">Total</th>
                                    <th className="px-2 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {doc.lineItems?.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-2 py-2">
                                            <select 
                                                value={item.productId || ''} 
                                                onChange={(e) => handleLineItemChange(index, 'productId', e.target.value)} 
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                                            >
                                                <option value="">-- Custom / Manual Entry --</option>
                                                {state.products.map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.category === 'Service' ? '🛠️' : '📦'} {p.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <input 
                                                type="text" 
                                                placeholder="Item Name" 
                                                value={item.name} 
                                                onChange={(e) => handleLineItemChange(index, 'name', e.target.value)} 
                                                className="mt-1 w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm" 
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <textarea 
                                                placeholder="Description" 
                                                value={item.description} 
                                                onChange={(e) => handleLineItemChange(index, 'description', e.target.value)} 
                                                rows={2}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm" 
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input 
                                                type="number" 
                                                value={item.quantity} 
                                                onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)} 
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm text-center" 
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                value={item.price} 
                                                onChange={(e) => handleLineItemChange(index, 'price', parseFloat(e.target.value) || 0)} 
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm text-right" 
                                            />
                                        </td>
                                        <td className="px-2 py-2 text-right font-medium text-gray-900">
                                            ${(item.quantity * item.price).toFixed(2)}
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <button type="button" onClick={() => removeLineItem(index)} className="text-red-400 hover:text-red-600 transition-colors">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-6 border-t border-gray-100">
                     <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes / Terms</label>
                        <textarea 
                            id="notes" 
                            name="notes" 
                            value={doc.notes} 
                            onChange={handleChange} 
                            rows={4} 
                            placeholder="Provide any additional details or payment terms..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        ></textarea>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Tax ({state.profile.taxRate}%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-200 pt-3 mt-3">
                            <span>Total</span>
                            <span className="text-primary">${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                
                {/* Footer Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                     <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                        Cancel
                     </Button>
                     <Button type="submit" className="px-8">
                        Save {type === DocumentType.INVOICE ? 'Invoice' : 'Quote'}
                     </Button>
                </div>
            </form>
        </PageWrapper>
    );
};

export default DocumentEditor;
