
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore.ts';
import { Product, ItemCategory } from '../../types.ts';
import PageWrapper from '../layout/PageWrapper.tsx';
import Button from '../ui/Button.tsx';
import Modal from '../ui/Modal.tsx';
import Input from '../ui/Input.tsx';
import { PlusIcon, EditIcon, TrashIcon, ShoppingCartIcon, EyeIcon, WhatsAppIcon } from '../Icons.tsx';

const Inventory: React.FC = () => {
    const { state, dispatch } = useStore();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const openModal = (product: Product | null = null) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingProduct(null);
        setIsModalOpen(false);
    };

    const openDetailModal = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setSelectedProduct(null);
        setIsDetailModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            dispatch({ type: 'DELETE_PRODUCT', payload: id });
        }
    };

    const addToCart = (product: Product) => {
      dispatch({ type: 'ADD_TO_CART', payload: product });
      setNotification(`${product.name} added to cart!`);
    };

    const orderNow = (product: Product) => {
      dispatch({ type: 'ADD_TO_CART', payload: product });
      navigate('/cart');
    };

    const orderViaWhatsApp = (product: Product) => {
      const targetPhone = '263772824132'; 
      
      const businessName = state.profile.name || 'InvoSync';
      let message = `*New Order Inquiry from ${businessName}*%0A%0A`;
      message += `I would like to order: *${product.name}*%0A`;
      message += `Price: $${product.price.toFixed(2)}%0A`;
      
      if (product.description) {
        message += `Details: ${product.description}%0A`;
      }
      
      if (product.category === 'Product') {
        message += `Current Stock: ${product.quantity} units%0A`;
      }
      
      message += `%0APlease let me know if this is available. Thank you!`;
      
      const whatsappUrl = `https://wa.me/${targetPhone}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    };
    
    return (
        <PageWrapper
            title="Inventory & Catalog"
            actions={
                <Button onClick={() => openModal()}>
                    <PlusIcon />
                    Add New Item
                </Button>
            }
        >
            {/* Success Notification */}
            {notification && (
                <div className="fixed top-6 right-6 z-[60] animate-bounce-in">
                    <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3 border border-emerald-500">
                        <ShoppingCartIcon className="w-5 h-5" />
                        <span className="font-bold text-sm tracking-wide">{notification}</span>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {state.products.map(product => (
                            <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">{product.name}</div>
                                    <div className="text-sm text-gray-500 max-w-xs truncate">{product.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        product.category === 'Service' 
                                        ? 'bg-indigo-100 text-indigo-800' 
                                        : 'bg-teal-100 text-teal-800'
                                    }`}>
                                        {product.category || 'Product'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                    ${product.price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {product.category === 'Service' ? (
                                        <span className="text-gray-400 text-sm italic">N/A</span>
                                    ) : (
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.quantity < 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {product.quantity}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button 
                                      onClick={() => addToCart(product)} 
                                      className="text-gray-400 hover:text-primary transition-colors p-1"
                                      title="Add to Cart"
                                    >
                                      <ShoppingCartIcon className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={() => orderViaWhatsApp(product)} 
                                      className="text-[#25D366] hover:text-[#128C7E] transition-colors p-1"
                                      title="Order via WhatsApp"
                                    >
                                      <WhatsAppIcon className="w-5 h-5" />
                                    </button>
                                    <button 
                                      onClick={() => openDetailModal(product)} 
                                      className="text-gray-400 hover:text-primary transition-colors p-1"
                                      title="View Details"
                                    >
                                      <EyeIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => openModal(product)} className="text-gray-400 hover:text-indigo-900 transition-colors p-1" title="Edit"><EditIcon /></button>
                                    <button onClick={() => handleDelete(product.id)} className="text-gray-400 hover:text-red-900 transition-colors p-1" title="Delete"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {state.products.length === 0 && <p className="text-center text-gray-500 py-8 font-medium">No items found in your inventory.</p>}
            </div>

            <ProductFormModal isOpen={isModalOpen} onClose={closeModal} product={editingProduct} />
            
            {selectedProduct && (
              <Modal 
                isOpen={isDetailModalOpen} 
                onClose={closeDetailModal} 
                title={`${selectedProduct.category === 'Service' ? '🛠️' : '📦'} Item Details`}
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                      <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        selectedProduct.category === 'Service' 
                        ? 'bg-indigo-100 text-indigo-800' 
                        : 'bg-teal-100 text-teal-800'
                      }`}>
                        {selectedProduct.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-extrabold text-primary">${selectedProduct.price.toFixed(2)}</p>
                      {selectedProduct.category === 'Product' && (
                        <p className={`text-sm mt-1 font-medium ${selectedProduct.quantity < 5 ? 'text-red-500' : 'text-green-600'}`}>
                          {selectedProduct.quantity} in stock
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedProduct.description || 'No description provided for this item.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <Button 
                      onClick={() => {
                        addToCart(selectedProduct);
                        closeDetailModal();
                      }} 
                      variant="secondary"
                      className="w-full py-3 text-sm font-bold shadow-sm"
                    >
                      <ShoppingCartIcon className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button 
                      onClick={() => orderViaWhatsApp(selectedProduct)} 
                      className="w-full py-3 text-sm font-bold bg-[#25D366] hover:bg-[#128C7E] border-none shadow-md shadow-green-500/20"
                    >
                      <WhatsAppIcon className="w-4 h-4 mr-2" />
                      Order via WhatsApp
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={() => orderNow(selectedProduct)} 
                    variant="primary"
                    className="w-full py-4 text-base font-bold shadow-lg shadow-primary/20"
                  >
                    View in Cart & Checkout
                  </Button>
                </div>
              </Modal>
            )}
        </PageWrapper>
    );
};

const ProductFormModal: React.FC<{ isOpen: boolean; onClose: () => void; product: Product | null }> = ({ isOpen, onClose, product }) => {
    const { dispatch } = useStore();
    const [formData, setFormData] = useState<{
        name: string;
        description: string;
        price: number;
        quantity: number;
        category: ItemCategory;
    }>({
        name: '', description: '', price: 0, quantity: 0, category: 'Product'
    });

    React.useEffect(() => {
        if (isOpen) {
            setFormData({
                name: product?.name || '',
                description: product?.description || '',
                price: product?.price || 0,
                quantity: product?.quantity || 0,
                category: product?.category || 'Product'
            });
        }
    }, [product, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: (name === 'price' || name === 'quantity') ? (parseFloat(value) || 0) : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Product = {
            id: product?.id || Date.now().toString(),
            ...formData
        };
        
        if (product) {
            dispatch({ type: 'UPDATE_PRODUCT', payload });
        } else {
            dispatch({ type: 'ADD_PRODUCT', payload });
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Item' : 'Add New Item'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select 
                            id="category" 
                            name="category" 
                            value={formData.category} 
                            onChange={handleChange} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            <option value="Product">📦 Product</option>
                            <option value="Service">🛠️ Service</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <Input label="Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Graphic Design" />
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                        id="description" 
                        name="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        rows={3} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="Detailed information about the item..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Price ($)" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
                    <div className={formData.category === 'Service' ? 'opacity-50 pointer-events-none' : ''}>
                        <Input 
                            label="Stock Quantity" 
                            name="quantity" 
                            type="number" 
                            value={formData.category === 'Service' ? 0 : formData.quantity} 
                            onChange={handleChange} 
                            required={formData.category === 'Product'}
                            disabled={formData.category === 'Service'}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button type="button" variant="secondary" onClick={onClose} className="bg-gray-200 text-gray-800 hover:bg-gray-300 border-none">
                        Cancel
                    </Button>
                    <Button type="submit">
                        {product ? 'Update Changes' : 'Create Item'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default Inventory;
