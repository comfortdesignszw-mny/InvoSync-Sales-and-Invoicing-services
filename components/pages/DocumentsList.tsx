
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore.ts';
import { Document, DocumentType, DocumentStatus } from '../../types.ts';
import PageWrapper from '../layout/PageWrapper.tsx';
import Button from '../ui/Button.tsx';
import { PlusIcon, EditIcon, TrashIcon, DownloadIcon } from '../Icons.tsx';
import { generatePdf } from '../../services/pdfService.ts';

interface DocumentsListProps {
  type: DocumentType;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ type }) => {
    const { state, dispatch } = useStore();
    const navigate = useNavigate();
    
    const documents = type === DocumentType.INVOICE ? state.invoices : state.quotes;
    const title = type === DocumentType.INVOICE ? 'Invoices' : 'Quotations';
    const basePath = type === DocumentType.INVOICE ? '/invoices' : '/quotes';

    const handleDelete = (id: string) => {
        if (window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
            dispatch({ type: 'DELETE_DOCUMENT', payload: { type, id } });
        }
    };
    
    const getStatusColor = (status: DocumentStatus) => {
        switch (status) {
            case DocumentStatus.PAID:
            case DocumentStatus.ACCEPTED:
                return 'bg-green-100 text-green-800';
            case DocumentStatus.SENT:
            case DocumentStatus.DRAFT:
                return 'bg-yellow-100 text-yellow-800';
            case DocumentStatus.REJECTED:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <PageWrapper
            title={title}
            actions={
                <Button onClick={() => navigate(`${basePath}/new`)}>
                    <PlusIcon />
                    Create {type === DocumentType.INVOICE ? 'Invoice' : 'Quote'}
                </Button>
            }
        >
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doc Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Issued</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Export</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {documents.length > 0 ? documents.map((doc: Document) => {
                            const total = doc.lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * (1 + state.profile.taxRate / 100);
                            return (
                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-primary">{doc.docNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{doc.customerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.issueDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">${total.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                                            {doc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button 
                                            onClick={() => generatePdf(doc, state.profile)} 
                                            className="text-gray-400 hover:text-secondary transition-all p-2 rounded-full hover:bg-emerald-50"
                                            title="Export to PDF"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <button 
                                            onClick={() => navigate(`${basePath}/edit/${doc.id}`)} 
                                            className="text-gray-400 hover:text-primary transition-colors"
                                            title="Edit Document"
                                        >
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(doc.id)} 
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete Document"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 italic">
                                    No {type}s found. Start by creating a new one!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </PageWrapper>
    );
};

export default DocumentsList;
