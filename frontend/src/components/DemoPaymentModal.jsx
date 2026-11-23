import { useState } from 'react';
import { Lock, X, CreditCard, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/index.jsx';
import { Input } from './ui/Field.jsx';
import { formatINR } from '../lib/constants.js';
import api from '../lib/api.js'; // Make sure to import your api instance

export default function DemoPaymentModal({ isOpen, onClose, request, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !request) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate network delay (bank processing)
    setTimeout(async () => {
      setLoading(false);
      
      try {
        // Call the real backend API to update the DB
        await api.post('/payments/demo', { requestId: request.id });
        setSuccess(true);
        
        // Wait 1s to show the green checkmark before closing
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess(false); // Reset for next time
        }, 1000);
      } catch (err) {
        console.error(err);
        setLoading(false);
        // In a real app, you'd show a toast here
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-brand-600 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="font-semibold text-sm">Secure Demo Checkout</span>
          </div>
          <button onClick={onClose} disabled={loading} className="text-brand-100 hover:text-white disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!success ? (
            <>
              <div className="text-center mb-6">
                <p className="text-sm text-ink-500">Paying for {request.service?.name}</p>
                <p className="text-3xl font-bold text-ink-900 mt-1">{formatINR(request.amountPaise)}</p>
              </div>

              <form onSubmit={handlePay} className="space-y-4">
                <div className="bg-ink-50 p-3 rounded-lg border border-ink-200 flex items-center gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-brand-600" />
                  <span className="text-sm font-medium text-ink-700">Demo Card (Simulated)</span>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-ink-600 mb-1 block">Card Number</label>
                  <Input defaultValue="4111 1111 1111 1111" disabled className="bg-ink-50/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-ink-600 mb-1 block">Expiry</label>
                    <Input defaultValue="12/30" disabled className="bg-ink-50/50" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-600 mb-1 block">CVV</label>
                    <Input defaultValue="123" disabled className="bg-ink-50/50" type="password" />
                  </div>
                </div>

                <Button type="submit" loading={loading} className="w-full h-11 mt-2">
                  Pay {formatINR(request.amountPaise)}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-emerald-100 rounded-full grid place-items-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-ink-900">Payment Successful</h3>
              <p className="text-sm text-ink-500 mt-1">Generating your receipt...</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-ink-50 px-6 py-3 border-t border-ink-100 text-center">
          <p className="text-[10px] text-ink-400 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> This is a simulated demo environment. No real money is charged.
          </p>
        </div>
      </div>
    </div>
  );
}