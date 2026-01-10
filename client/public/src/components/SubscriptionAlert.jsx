import { useState } from "react";
import { IoCardOutline } from "react-icons/io5";
import { Alert, AlertTitle, AlertDescription } from "./lightswind/alert";

export default function SubscriptionAlert({ 
  title = "Subscription Error", 
  message, 
  onClose,
  showSafetyNotice = true,
  troubleshootingTip = null
}) {
  const [showTechnical, setShowTechnical] = useState(false);
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      {/* Alert Container */}

        <Alert variant="destructive" withIcon dismissible onDismiss={onClose} className="bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-w-2xl border-l-[6px]">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Icon Section */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-100/80 rounded-full flex items-center justify-center text-red-600 border border-red-200/50">
                <IoCardOutline className="w-6 h-6" />
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-grow">
              <AlertTitle size="lg" className="text-[#8B1A1A] mb-2">
                {title}
              </AlertTitle>
              <AlertDescription className="text-[#8B1A1A]/80 text-sm md:text-[15px] leading-relaxed mb-6 font-medium">
                {message}
              </AlertDescription>

              {/* Troubleshooting Tip (NEW) */}
              {troubleshootingTip && (
                <div className="bg-blue-50/50 rounded-lg p-4 mb-6 border border-blue-200/30">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-[11px] uppercase tracking-wider mb-2">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 16V12M12 8h.01M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
                    </svg>
                    Troubleshooting Tip
                  </div>
                  <p className="text-blue-800/90 text-[13px] font-semibold leading-relaxed">
                    {troubleshootingTip}
                  </p>
                </div>
              )}

              {/* Support Box */}
              <div className="bg-[#FFEAEA] rounded-lg p-4 mb-4 border border-red-200/30">
                <p className="text-sm font-semibold text-[#8B1A1A]">
                  For assistance, please contact our support team at <a href="mailto:varunmm0404@gmail.com" className="underline underline-offset-2 hover:text-red-800 transition-colors">varunmm0404@gmail.com</a>.
                </p>
              </div>

              {/* Safety Notice */}
              {showSafetyNotice && (
                <p className="text-[12.5px] italic text-[#8B1A1A]/70 font-medium pb-2 border-b border-red-200/20 mb-4">
                  Your stored files and data remain safe during this retry period. You'll be notified once the payment succeeds or the plan is cancelled.
                </p>
              )}

              {/* Technical Details Toggle */}
              <button 
                onClick={() => setShowTechnical(!showTechnical)}
                className="text-[10px] font-black uppercase tracking-widest text-[#8B1A1A]/40 hover:text-[#8B1A1A]/60 transition-colors"
              >
                {showTechnical ? "- Hide Technical Details" : "+ View technical details"}
              </button>
              
              {showTechnical && (
                <div className="mt-2 p-3 bg-red-900/5 rounded-md font-mono text-[10px] text-[#8B1A1A]/60 break-all border border-red-200/10">
                  Error context: razorpay_payment_failed_event_tracking
                </div>
              )}
            </div>
          </div>
        </Alert>
    </div>
  );
}
