import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  BsLightningChargeFill, 
  BsCheckCircleFill, 
  BsArrowRightShort,
  BsShieldCheck,
  BsInfoCircleFill,
  BsGem,
  BsStars
} from "react-icons/bs";
import { getSubscriptionDetails, getEligiblePlans, createSubscription } from "./apis/subscriptionApi";
import SubscriptionAlert from "./components/SubscriptionAlert";

export default function ChangePlan() {
  const [currentPlan, setCurrentPlan] = useState(null);
  const [eligiblePlans, setEligiblePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errorAlert, setErrorAlert] = useState({ show: false, title: "", message: "", tip: null });
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [details, eligible] = await Promise.all([
          getSubscriptionDetails(),
          getEligiblePlans()
        ]);
        
        if (details && details.activePlan && details.activePlan.status === "active") {
          setCurrentPlan(details);
          setEligiblePlans(eligible || []);
        } else {
          // If no active plan (or just 'created'), they shouldn't be here
          navigate("/plans");
        }
      } catch (err) {
        console.error("Failed to fetch upgrade data:", err);
        // If 404 on details, they don't have a plan
        navigate("/plans");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [navigate]);

  async function handleUpgrade(planId) {
    try {
      setProcessingId(planId);
      // In a real flow, this would call createSubscription which initiates Razorpay
      // But since user is handling BE, I'll keep it standard
      const res = await createSubscription(planId);
      
      if (res.subscriptionId) {
        // Trigger Razorpay (reusing logic from Plans.jsx)
        openRazorPayPopup({
          subscriptionId: res.subscriptionId,
          planName: "Upgrade",
          onSuccess: () => {
             navigate("/subscription");
          },
          onFailure: (msg) => {
            let tip = null;
            if (msg.toLowerCase().includes("international cards are not supported")) {
              tip = "Merchant Configuration Tip: Ensure 'International Payments' is enabled in your Razorpay Dashboard -> Settings -> Payment Methods. If you are using an Indian card in Test Mode, Razorpay might incorrectly flag it if the merchant settings are restricted.";
            }

            setErrorAlert({
              show: true,
              title: "Upgrade Failed",
              message: msg,
              tip: tip
            });
            setProcessingId(null);
          },
          onClose: () => setProcessingId(null)
        });
      }
    } catch (err) {
      setErrorAlert({
        show: true,
        title: "Change Plan Error",
        message: err.response?.data?.message || "Failed to initiate plan change. Please try again later."
      });
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Preparing upgrade options...</p>
      </div>
    );
  }

  if (!currentPlan) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {errorAlert.show && (
          <SubscriptionAlert 
            title={errorAlert.title}
            message={errorAlert.message}
            troubleshootingTip={errorAlert.tip}
            onClose={() => setErrorAlert({ ...errorAlert, show: false })}
          />
        )}
        
        {/* Header */}
        <div className="mb-12">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-4">
                <BsShieldCheck className="w-4 h-4" />
                <span>Subscription Management</span>
            </div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Change Your Plan</h1>
          <p className="text-slate-500 text-lg">Upgrade or adjust your plan anytime. We don't offer prorated charges for plan changes.</p>
        </div>

        {/* Current Plan Card - Reusing the style from provided mockup */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden mb-12 transform transition hover:scale-[1.01]">
            <div className="p-8 md:p-10">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-600 uppercase tracking-wider mb-4 border border-blue-100">
                           <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                           Current Plan
                        </span>
                        <h2 className="text-3xl font-black text-slate-900 mb-1">{currentPlan.activePlan.name} Plan</h2>
                        <p className="text-slate-400 font-medium">{currentPlan.activePlan.tagline}</p>
                    </div>
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <BsLightningChargeFill className="w-7 h-7" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Billing Amount</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900">₹{currentPlan.activePlan.billingAmount}</span>
                            <span className="text-sm font-bold text-slate-400">/{currentPlan.activePlan.billingPeriod}</span>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Next Billing Date</div>
                        <div className="text-2xl font-black text-slate-900">{currentPlan.activePlan.nextBillingDate}</div>
                        <div className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-wider">in {currentPlan.activePlan.daysLeft} days</div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 mb-8" />

                <div className="mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Features:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                    <FeatureItem label={`${currentPlan.storage.totalLabel} secure storage`} />
                    <FeatureItem label={`File upload limit: ${currentPlan.limits.maxFileSize} per file`} />
                    <FeatureItem label="Password-protected sharing links" />
                    <FeatureItem label={`Access from up to ${currentPlan.stats.maxDevices || 3} devices`} />
                    <FeatureItem label="Priority upload/download speed" />
                    <FeatureItem label="Email & chat support" />
                </div>
            </div>
        </div>

        {/* Global Notice */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4 mb-16 shadow-sm">
            <BsInfoCircleFill className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-blue-700 text-sm font-medium leading-relaxed">
                Your new plan starts today! You'll be billed the full amount immediately. We don't offer prorated charges for plan changes.
            </p>
        </div>

        {/* Available Plans Section */}
        <div className="mb-24">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                <div>
                    <h3 className="text-2xl font-black text-slate-900">Available Plans to Switch To</h3>
                    <p className="text-slate-500 font-medium">{eligiblePlans.length} plans available for change</p>
                </div>
            </div>

            {eligiblePlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {eligiblePlans.map((plan) => (
                        <UpgradePlanCard 
                            key={plan.id} 
                            plan={plan} 
                            onUpgrade={handleUpgrade}
                            isProcessing={processingId === plan.id}
                            disabled={!!processingId}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BsGem className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 mb-2">You're on our highest plan!</h4>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">Once your current subscription ends, you will revert to a standard user and can choose any available plan again.</p>
                </div>
            )}
        </div>
      </div>

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed bottom-10 right-10 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
            <BsInfoCircleFill className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold text-sm tracking-wide">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-4 opacity-70 hover:opacity-100 uppercase text-[10px] font-black border border-white/30 px-2 py-1 rounded-md">Dismiss</button>
        </div>
      )}
    </div>
  );
}

function FeatureItem({ label }) {
    return (
        <div className="flex items-center gap-3 group">
            <div className="flex-shrink-0 w-5 h-5 bg-green-50 text-green-500 rounded-full flex items-center justify-center border border-green-100 group-hover:bg-green-100 transition">
                <BsCheckCircleFill className="w-2.5 h-2.5" />
            </div>
            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition">{label}</span>
        </div>
    );
}

function UpgradePlanCard({ plan, onUpgrade, isProcessing, disabled }) {
    const isPremium = plan.name.toLowerCase().includes('premium');
    
    return (
        <div className={`relative flex flex-col bg-white rounded-3xl border-2 transition-all p-8 md:p-10 ${isPremium ? 'border-green-500 shadow-xl shadow-green-100' : 'border-blue-500 shadow-xl shadow-blue-100'}`}>
            <div className="mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-2xl ${isPremium ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                        {isPremium ? <BsGem className="w-6 h-6" /> : <BsStars className="w-6 h-6" />}
                    </div>
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-1">{plan.name}</h4>
                <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-8">{plan.tagline}</p>
                
                <div className="flex items-baseline gap-1 py-1">
                    <span className="text-4xl font-black text-slate-900">₹{plan.price}</span>
                    <span className="text-slate-400 font-bold">/{plan.billingPeriod === 'Yearly' ? 'Year' : 'Month'}</span>
                </div>
            </div>

            <div className="h-px bg-slate-100 mb-10" />

            <button 
                onClick={() => onUpgrade(plan.id)}
                disabled={disabled}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${isPremium ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
            >
                {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>
                        {plan.name.includes('Premium') ? 'Upgrade Plan' : 'Change Plan'}
                        <BsArrowRightShort className="w-6 h-6" />
                    </>
                )}
            </button>

            <div className="mt-10 mb-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Includes:</div>
                <ul className="space-y-4">
                    {plan.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-start gap-3 group">
                            <BsCheckCircleFill className="w-3.5 h-3.5 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-900 transition leading-snug">{f}</span>
                        </li>
                    ))}
                    {plan.features.length > 4 && (
                        <li className="text-[11px] font-black text-blue-600 uppercase tracking-wider ml-6 mt-2">
                            +{plan.features.length - 4} more features
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
}

// Helper for Razorpay (copied from Plans.jsx)
function openRazorPayPopup({ subscriptionId, planName, onClose, onSuccess, onFailure }) {
  const rzp = new window.Razorpay({
    key: "rzp_test_RnAnjbXG3sqHWQ",
    name: "Storage App",
    description: "Upgrade to " + planName,
    subscription_id: subscriptionId,
    theme: { color: "#2563eb" },
    handler: function (response) { onSuccess?.(); },
    modal: { ondismiss: function() { onClose?.(); } }
  });
  rzp.on("payment.failed", function (response) { onFailure?.("Payment failed: " + response.error.description); });
  rzp.open();
}
