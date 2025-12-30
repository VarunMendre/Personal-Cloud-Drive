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
import { getSubscriptionDetails, getEligiblePlans, upgradeSubscription, checkSubscriptionStatus } from "./apis/subscriptionApi";
import SubscriptionAlert from "./components/SubscriptionAlert";
import DirectoryHeader from "./components/DirectoryHeader";
import { useAuth } from "./context/AuthContext";

export default function ChangePlan() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(null);
  const [eligiblePlans, setEligiblePlans] = useState([]);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  // Modals & Animation State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [createdSubscriptionId, setCreatedSubscriptionId] = useState(null);
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
        
        if (details && details.activePlan && ["active", "created"].includes(details.activePlan.status)) {
          setCurrentPlan(details);
          setEligiblePlans(eligible?.eligiblePlans || []);
          setEmptyMessage(eligible?.message || "");
        } else {
          // If no active plan, they shouldn't be here
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

  // Load Razorpay Script
  useEffect(() => {
    const razorpayScript = document.querySelector("#razorpay-script");
    if (razorpayScript) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.id = "razorpay-script";
    document.body.appendChild(script);
  }, []);

  async function handleUpgrade(planId) {
    if (showCountdownModal) return;

    const plan = eligiblePlans.find(p => p.id === planId);
    console.log(`Initiating upgrade for user to ${plan.name}. Bonus days: ${plan.cappedBonusDays}`);
    setPendingPlan(plan);
    setProcessingId(planId);
    setShowCountdownModal(true);
    setCountdown(3);

    let count = 3;
    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(countdownInterval);
        setShowCountdownModal(false);
        startUpgrade(plan);
      }
    }, 1000);
  }

  async function startUpgrade(plan) {
    try {
      console.log("Attempting upgrade for plan:", plan.id);
      const res = await upgradeSubscription(plan.id);
      
      if (res.subscriptionId) {
        setCreatedSubscriptionId(res.subscriptionId);
        openRazorPayPopup({
          subscriptionId: res.subscriptionId,
          planName: plan.name,
          planDescription: `${plan.storage} Storage - ${plan.tagline}`,
          onSuccess: () => {
            setProcessingId(null);
            setShowSuccessModal(true);
          },
          onFailure: (msg) => {
            setProcessingId(null);
            
            let tip = null;
            if (msg.toLowerCase().includes("international cards are not supported")) {
               tip = "Merchant Configuration Tip: Your Razorpay account is currently rejecting international cards. Ensure 'International Payments' is enabled in your Dashboard.";
            }

            setErrorAlert({
              show: true,
              title: "Upgrade Failed",
              message: msg,
              tip: tip
            });
          },
          onClose: () => {
            setProcessingId(null);
          }
        });
      }
    } catch (err) {
      console.error("Detailed Upgrade Error Context:", {
          message: err.message,
          response: err.response?.data,
          stack: err.stack
      });
      const msg = err.response?.data?.message || "Failed to initiate plan change. Please try again later.";
      
      let tip = null;
      const lowerMsg = msg.toLowerCase();
      
      // Check for "wait 1 day" error
      if (lowerMsg.includes("wait") && lowerMsg.includes("day") && lowerMsg.includes("bonus")) {
        tip = "Your current plan credit is too low to upgrade today. Please wait until tomorrow when you'll have accumulated enough credit for at least 1 bonus day.";
      }
      // Check for UPI/Card mandate errors
      else if (lowerMsg.includes("upi subscriptions cannot be updated") || lowerMsg.includes("card mandate is applicable")) {
        tip = "Why this happened: Banking regulations (RBI) in India fix the terms of your auto-pay mandate at creation. Many UPI and Card mandates cannot be modified mid-cycle. To change plans, please cancel your current subscription and purchase the new one manually.";
      }

      setErrorAlert({
        show: true,
        title: "Upgrade Restricted",
        message: msg,
        tip: tip
      });
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mb-6" style={{ borderColor: '#2E5E99', borderTopColor: 'transparent' }}></div>
        <p className="font-bold animate-pulse uppercase tracking-widest text-xs" style={{ color: '#7BA4D0' }}>Preparing upgrade options...</p>
      </div>
    );
  }

  if (!currentPlan) return null;

  return (
    <div className="min-h-screen">
      <DirectoryHeader
        userName={user?.name || "Guest User"}
        userEmail={user?.email || "guest@example.com"}
        userPicture={user?.picture || ""}
        userRole={user?.role || "User"}
        subscriptionId={user?.subscriptionId}
        subscriptionStatus={user?.subscriptionStatus || "active"}
      />
    <div className="py-16 px-4 pt-24">
      <div className="max-w-5xl mx-auto relative">
        
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
          <p className="text-slate-500 text-lg">Upgrade or adjust your plan anytime. We'll automatically apply a discount based on your remaining days.</p>
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
                        <h2 className="text-3xl font-black text-slate-900 mb-1">{currentPlan.activePlan.name}</h2>
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
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-start gap-4 mb-16 shadow-sm">
            <BsInfoCircleFill className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm font-medium leading-relaxed">
                <strong className="block text-green-800 mb-1">Prorated Upgrade Credit Active!</strong>
                Switching plans? We'll automatically calculate the value of your remaining days on your current plan and apply it as a discount to your new subscription!
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
                    <h4 className="text-xl font-black text-slate-900 mb-2">
                        {emptyMessage && emptyMessage.includes("highest") ? "You're on our highest plan!" : "No Upgrades Available"}
                    </h4>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">
                        {emptyMessage || "Once your current subscription ends, you will revert to a standard user and can choose any available plan again."}
                    </p>
                </div>
            )}
        </div>
      </div>

        {/* Modals */}
        {showCountdownModal && (
          <CountdownModal 
            countdown={countdown} 
            onCancel={() => {
              setShowCountdownModal(false);
              setProcessingId(null);
              setPendingPlan(null);
            }} 
          />
        )}
        
        {showSuccessModal && (
          <SuccessModal 
            subscriptionId={createdSubscriptionId} 
            onClose={() => navigate("/subscription")} 
          />
        )}

    </div>
    </div>
  );
}

// Helper function to calculate next billing date
function calculateNextBillingDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: "numeric" 
  });
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

function Price({ value }) {
  return (
    <div className="flex items-baseline gap-1">
      {value === 0 ? (
        <span className="text-4xl font-bold tracking-tight text-slate-900">
          Free
        </span>
      ) : (
        <>
          <span className="text-lg font-semibold text-slate-700">₹</span>
          <span className="text-4xl font-bold tracking-tight text-slate-900">
            {value}
          </span>
        </>
      )}
    </div>
  );
}

function UpgradePlanCard({ plan, onUpgrade, isProcessing, disabled }) {
    const isPremium = plan.name.toLowerCase().includes('premium');
    const billingPeriod = plan.billingPeriod === 'Yearly' ? '/year' : '/month';
    
    return (
        <div
          className={classNames(
            "relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition",
            "hover:shadow-md",
            isPremium
              ? "border-blue-500/60 ring-1 ring-blue-500/20"
              : "border-slate-200"
          )}
        >
          {isPremium && (
            <div className="absolute -top-2 right-4 select-none rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white shadow">
              RECOMMENDED
            </div>
          )}
    
          <div className="mb-3 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                 <div className={classNames(
                   "p-1.5 rounded-lg",
                   isPremium ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
                 )}>
                    {isPremium ? (
                       <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    ) : (
                       <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    )}
                 </div>
                 <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              </div>
              <p className="text-xs font-semibold text-blue-600">{plan.tagline}</p>
            </div>
          </div>
    
          <div className="mb-6 mt-2 flex flex-col gap-0.5">
            <div className="flex items-end gap-1">
              <Price value={plan.billingPeriod === "Yearly" ? Math.floor(plan.price / 12) : plan.price} />
              <span className="mb-[6px] text-sm text-slate-500">/month</span>
            </div>
            
            {plan.cappedBonusDays > 0 && (
                <div className="flex flex-col mt-1">
                    <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                        <BsCheckCircleFill className="w-2.5 h-2.5" />
                        {plan.cappedBonusDays} Days Free Trial
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        Next billing on {calculateNextBillingDate(30)}
                    </span>
                </div>
            )}
          </div>
    
          <div className="h-px bg-slate-100 mb-6" />
    
          <button
            onClick={() => onUpgrade(plan.id)}
            disabled={disabled}
            className={classNames(
              "mb-6 cursor-pointer inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none",
              isPremium
                ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-700 disabled:cursor-not-allowed"
            )}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
                <span className="flex items-center gap-2">
                    {isPremium ? 'Upgrade Now' : 'Switch Plan'}
                    <BsArrowRightShort className="w-5 h-5" />
                </span>
            )}
          </button>
    
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">What's Included</div>
          <ul className="space-y-3 text-[13px] text-slate-600">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <svg
                  className="mt-0.5 h-3.5 w-3.5 flex-none text-green-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="3.5"
                  stroke="currentColor"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
    );
}

function classNames(...cls) {
    return cls.filter(Boolean).join(" ");
}

// Reuse the exact same modal components from Plans.jsx for consistency
function SuccessModal({ subscriptionId, onClose }) {
  const [activating, setActivating] = useState(true);

  useEffect(() => {
    if (!subscriptionId) return;

    const interval = setInterval(async () => {
      try {
        const status = await checkSubscriptionStatus(subscriptionId);
        if (status && (status.active || status.status === 'active')) {
          clearInterval(interval);
          setActivating(false);
          setTimeout(() => {
             onClose();
          }, 1500);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [subscriptionId, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"></div>
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 fade-in duration-300 border border-slate-100">
        <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full transition-colors duration-500 ${activating ? 'bg-blue-50' : 'bg-green-50'}`}>
          <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors duration-500 ${activating ? 'bg-blue-600' : 'bg-green-600'}`}>
            {activating ? (
               <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : (
              <svg className="w-6 h-6 animate-in zoom-in duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {activating ? "Confirming Upgrade..." : "Upgrade Successful!"}
        </h2>
        <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
          {activating 
            ? "Please wait while we confirm your payment and update your account features." 
            : "Your new plan is now active. Redirecting to your dashboard..."}
        </p>
        {activating && (
           <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-2">
             <div className="h-full bg-blue-600 animate-progress-indeterminate"></div>
           </div>
        )}
      </div>
    </div>
  );
}

function CountdownModal({ countdown, onCancel }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => { setProgress(100); }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"></div>
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all ease-linear"
            style={{ width: `${progress}%`, transitionDuration: '3000ms' }}
          ></div>
        </div>
        <div className="p-8 text-center">
          <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10" /></svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Preparing your Upgrade</h2>
          <p className="text-sm text-slate-500 mb-8">You are being redirected to a secure payment gateway</p>
          <div className="mb-8">
            <div className="text-6xl font-bold text-slate-900 mb-2 animate-pulse">{countdown}</div>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-6 font-bold">
            <BsShieldCheck className="w-4 h-4 text-blue-600" /> Secure connection
          </div>
          <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-700 transition font-bold uppercase tracking-wider">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Helper for Razorpay (copied from Plans.jsx)
function openRazorPayPopup({
  subscriptionId,
  planName,
  planDescription,
  onClose,
  onSuccess,
  onFailure,
}) {
  console.log("Opening Razorpay for upgrade:", subscriptionId);
  const rzp = new window.Razorpay({
    key: "rzp_test_RnAnjbXG3sqHWQ",
    name: "Storage App",
    description: planName + " - " + planDescription,
    subscription_id: subscriptionId,
    theme: {
      color: "#2563eb",
    },
    handler: function (response) {
      console.log("Upgrade payment successful!", response);
      onSuccess?.();
    },
    modal: {
      ondismiss: function() {
        console.log("Upgrade checkout modal closed");
        onClose?.();
      }
    }
  });

  rzp.on("payment.failed", function (response) {
    console.error("Upgrade payment failed:", response.error);
    onFailure?.("Payment failed: " + response.error.description);
  });

  rzp.open();
}
