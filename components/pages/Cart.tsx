
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../hooks/useStore.ts';
import PageWrapper from '../layout/PageWrapper.tsx';
import Button from '../ui/Button.tsx';
import Modal from '../ui/Modal.tsx';
import { TrashIcon, ShoppingCartIcon, InvoiceIcon, QuoteIcon, WhatsAppIcon } from '../Icons.tsx';

const Cart: React.FC = () => {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { cart, profile } = state;
  const [showOrderChoiceModal, setShowOrderChoiceModal] = useState(false);

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    dispatch({ type: 'UPDATE_CART_QTY', payload: { id, quantity: qty } });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch({ type: 'CLEAR_CART' });
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * (profile.taxRate / 100);
  const total = subtotal + tax;

  const getWhatsAppUrl = () => {
    // Hardcoded target number as requested
    const targetPhone = '263772824132'; 
    const businessName = profile.name || 'InvoSync Client';
    
    let message = `*New Order Inquiry from ${businessName}*%0A%0A`;
    message += `I'd like to place an order for the following items:%0A`;
    
    cart.forEach((item, index) => {
      message += `${index + 1}. *${item.name}* x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}%0A`;
    });

    message += `%0A*Subtotal:* $${subtotal.toFixed(2)}`;
    if (profile.taxRate > 0) {
      message += `%0A*Tax (${profile.taxRate}%):* $${tax.toFixed(2)}`;
    }
    message += `%0A*Total Amount:* $${total.toFixed(2)}%0A%0A`;
    message += `Please confirm availability. Thank you!`;

    return `https://wa.me/${targetPhone}?text=${message}`;
  };

  const handlePlaceOrderClick = () => {
    if (cart.length === 0) return;
    setShowOrderChoiceModal(true);
  };

  const handleCreateDocument = (type: 'invoice' | 'quote') => {
    const path = type === 'invoice' ? '/invoices/new' : '/quotes/new';
    // Navigate with the cart items as state so the editor can pick them up
    navigate(path, { state: { prefilledCart: cart } });
    // Clear cart when turning into a formal record
    dispatch({ type: 'CLEAR_CART' });
    setShowOrderChoiceModal(false);
  };

  const handleSkipToWhatsApp = () => {
    window.open(getWhatsAppUrl(), '_blank');
    setShowOrderChoiceModal(false);
    // Optionally clear cart here if you want it gone after sending
    // dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <PageWrapper
      title="Order Cart"
      actions={
        cart.length > 0 && (
          <Button variant="danger" onClick={clearCart} className="text-sm">
            <TrashIcon className="w-4 h-4" />
            <span>Clear Cart</span>
          </Button>
        )
      }
    >
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <ShoppingCartIcon className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Your cart is empty</h3>
          <p className="text-gray-500 mt-2">Go to Inventory to add products or services.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                    <p className="text-primary font-semibold mt-1">${item.price.toFixed(2)} / unit</p>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button 
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 text-sm font-medium border-x border-gray-300 min-w-[3rem] text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 font-bold"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-right min-w-[5rem]">
                      <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-2"
                      title="Remove Item"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">Order Summary</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {profile.taxRate > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({profile.taxRate}%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-extrabold text-gray-900 border-t pt-4 mt-4">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={handlePlaceOrderClick} 
                  className="w-full py-4 text-lg bg-[#25D366] hover:bg-[#128C7E] border-none shadow-lg shadow-green-500/20"
                >
                  <WhatsAppIcon className="w-6 h-6 mr-2" />
                  Place Order via WhatsApp
                </Button>
                <p className="text-[11px] text-center text-gray-500 italic">
                  Review and formalize your order before sending.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      <Modal 
        isOpen={showOrderChoiceModal} 
        onClose={() => setShowOrderChoiceModal(false)} 
        title="Finalize Order"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
             <ShoppingCartIcon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Choose Order Type</h3>
            <p className="text-gray-500 mt-2">Would you like to generate a formal document for your records before sending the WhatsApp message?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={() => handleCreateDocument('invoice')} variant="primary" className="py-3 shadow-md">
              <InvoiceIcon className="w-5 h-5 mr-2" />
              Create Invoice
            </Button>
            <Button onClick={() => handleCreateDocument('quote')} variant="secondary" className="py-3 shadow-md">
              <QuoteIcon className="w-5 h-5 mr-2" />
              Create Quote
            </Button>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <button 
              onClick={handleSkipToWhatsApp}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border-2 border-dashed border-emerald-200"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Skip to WhatsApp Only
            </button>
            <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              No formal record will be saved in InvoSync
            </p>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => setShowOrderChoiceModal(false)}
              className="text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Go back to Cart
            </button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
};

export default Cart;
