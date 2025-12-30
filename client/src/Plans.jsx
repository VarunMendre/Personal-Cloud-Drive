import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createSubscription, getSubscriptionDetails } from "./apis/subscriptionApi";
import SubscriptionAlert from "./components/SubscriptionAlert";
import DirectoryHeader from "./components/DirectoryHeader";
import { useAuth } from "./context/AuthContext";

const PLAN_CATALOG = {
  monthly: [
    {
      id: "free_monthly",
      name: "Free",
      tagline: "Starter Plan",
      description: "Personal users who want to try the platform",
      storage: "500 MB",
      price: 0,
      period: "/month",
      cta: "Current Plan",
      features: [
        "500 MB secure storage",
        "File upload limit: 100 MB per file",
        "Access from 1 device",
        "Standard download speed",
        "Basic email support",
      ],
      popular: false,
    },
    {
      id: "plan_RuC1EiZlwurf5N",
      name: "Standard",
      tagline: "For Students & Freelancers",
      description: "Students, freelancers, or small teams who need more space",
      storage: "100 GB",
      price: 349,
      period: "/month",
      cta: "Subscribe Now",
      features: [
        "100 GB secure storage",
        "File upload limit: 1 GB per file",
        "Access from up to 2 devices",
        "Priority upload/download speed",
        "Email & chat support",
      ],
      popular: true,
    },
    {
      id: "plan_RuC2evjqwSxHOH",
      name: "Premium",
      tagline: "For Professionals & Creators",
      description: "Professionals and creators handling large media files",
      storage: "200 GB",
      price: 999,
      period: "/month",
      cta: "Subscribe Now",
      features: [
        "200 GB secure storage",
        "File upload limit: 2 GB per file",
        "Access from up to 3 devices",
        "Priority upload/download speed",
        "Priority customer support",
      ],
      popular: false,
    },
  ],
  yearly: [
    {
      id: "free_yearly",
      name: "Free",
      tagline: "Starter Plan",
      description: "Personal users who want to try the platform",
      storage: "500 MB",
      price: 0,
      period: "/year",
      cta: "Current Plan",
      features: [
        "500 MB secure storage",
        "File upload limit: 100 MB per file",
        "Access from 1 device",
        "Standard download speed",
        "Basic email support",
      ],
      popular: false,
    },
    {
      id: "plan_RuC3yiXd7cecny",
      name: "Standard",
      tagline: "For Students & Freelancers",
      description: "Students, freelancers, or small teams who need more space",
      storage: "200 GB",
      price: 3999,
      period: "/year",
      cta: "Subscribe Now",
      features: [
        "200 GB secure storage",
        "File upload limit: 1 GB per file",
        "Access from up to 2 devices",
        "Priority upload/download speed",
        "Email & chat support",
      ],
      popular: true,
    },
    {
      id: "plan_RuC5FeIwTTfUSh",
      name: "Premium",
      tagline: "For Professionals & Creators",
      description: "Professionals and creators handling large media files",
      storage: "300 GB",
      price: 7999,
      period: "/year",
      cta: "Subscribe Now",
      features: [
        "300 GB secure storage",
        "File upload limit: 2 GB per file",
        "Access from up to 3 devices",
        "Priority upload/download speed",
        "Priority customer support",
      ],
      popular: false,
    },
  ],
};

function classNames(...cls) {
  return cls.filter(Boolean).join(" ");
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

function PlanCard({ plan, onSelect, isLoading, isDisabled }) {
  const isFree = plan.price === 0;

  return (
    <div
      className={classNames(
        "relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition",
        "hover:shadow-md",
        plan.popular
          ? "border-blue-500/60 ring-1 ring-blue-500/20"
          : isFree 
            ? "border-green-500 ring-1 ring-green-500/20"
            : "border-slate-200"
      )}
    >
      {plan.popular && (
        <div className="absolute -top-2 right-4 select-none rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white shadow">
          MOST POPULAR
        </div>
      )}
      
      {isFree && (
        <div className="absolute -top-2 right-4 select-none rounded-sm bg-green-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
          ✓ CURRENT PLAN
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
             <div className={classNames(
               "p-1.5 rounded-lg",
               isFree ? "bg-green-50 text-green-600" : plan.popular ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
             )}>
                {isFree ? (
                   <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.912 5.886h6.188l-5.007 3.638 1.913 5.887-5.006-3.639-5.006 3.639 1.913-5.887-5.007-3.638h6.188L12 3z" /></svg>
                ) : plan.popular ? (
                   <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                ) : (
                   <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                )}
             </div>
             <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
          </div>
          <p className="text-xs font-semibold text-blue-600">{plan.tagline}</p>
          <p className="text-[11px] text-slate-500 leading-tight">{plan.description}</p>
        </div>
      </div>

      <div className="mb-6 mt-2 flex flex-col gap-0.5">
        <div className="flex items-end gap-1">
          <Price value={plan.period === "/year" ? Math.floor(plan.price / 12) : plan.price} />
          {plan.price !== 0 && (
            <span className="mb-[6px] text-sm text-slate-500">/month</span>
          )}
        </div>
        {plan.period === "/year" && plan.price !== 0 && (
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 font-medium">
              Billed annually at ₹{plan.price}
            </span>
            <span className="text-[11px] text-green-600 font-bold mt-0.5">
              Save {Math.floor(((PLAN_CATALOG.monthly.find(p => p.name === plan.name).price * 12) - plan.price))} per year
            </span>
          </div>
        )}
      </div>

      <div className="h-px bg-slate-100 mb-6" />

      <button
        onClick={() => !isFree && !isDisabled && onSelect?.(plan)}
        disabled={isDisabled || isFree}
        className={classNames(
          "mb-6 cursor-pointer inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold transition focus:outline-none",
          isFree 
            ? "bg-green-600 text-white cursor-default" 
            : plan.popular
              ? "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-700 disabled:cursor-not-allowed"
        )}
      >
        {isFree ? (
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
            Current Plan
          </span>
        ) : isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : plan.cta}
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

export default function Plans() {
  const { user } = useAuth();
  const [mode, setMode] = useState("monthly");
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [createdSubscriptionId, setCreatedSubscriptionId] = useState(null);
  const [errorAlert, setErrorAlert] = useState({ show: false, title: "", message: "", tip: null });
  const navigate = useNavigate();
  const plans = PLAN_CATALOG[mode];

  useEffect(() => {
    async function checkExistingSubscription() {
      try {
        const res = await getSubscriptionDetails();
        if (res && res.activePlan && ["active", "created", "past_due"].includes(res.activePlan.status)) {
          // User already has a plan, they should go to /change-plan instead
          navigate("/change-plan", { replace: true });
        }
      } catch (err) {
        // No subscription found (expected 404), stay on plans page
      }
    }
    checkExistingSubscription();
  }, [navigate]);

  useEffect(() => {
    const razorpayScript = document.querySelector("#razorpay-script");
    if (razorpayScript) return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.id = "razorpay-script";
    document.body.appendChild(script);
  }, []);

  async function handleSelect(plan) {
    if (plan.price === 0 || showCountdownModal) return;
    
    // Show BOTH countdown modal AND processing state at the same time
    setLoadingPlanId(plan.id);  // ← Button shows "Processing..."
    setPendingPlan(plan);
    setShowCountdownModal(true);  // ← Modal appears
    setCountdown(3);
    
    // Start countdown
    let count = 3;
    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(countdownInterval);
        // Close countdown modal and open Razorpay
        setShowCountdownModal(false);
        startSubscription(plan);
      }
    }, 1000);
  }
  
  async function startSubscription(plan) {
    try {
      console.log("Creating subscription for plan:", plan.id);
      const res = await createSubscription(plan.id);
      
      if (res.message) {
        setErrorAlert({
           show: true,
           title: "Subscription Required",
           message: res.message
        });
        setLoadingPlanId(null);
        return;
      }

      setCreatedSubscriptionId(res.subscriptionId);

      openRazorPayPopup({
        subscriptionId: res.subscriptionId,
        planName: plan.name,
        planDescription: `${plan.storage} Storage - ${plan.tagline}`,
        onSuccess: () => {
          setLoadingPlanId(null);
          setShowSuccessModal(true);
        },
        onFailure: (msg) => {
          setLoadingPlanId(null);
          
          let tip = null;
          if (msg.toLowerCase().includes("international cards are not supported")) {
            tip = "Merchant Configuration Tip: Your Razorpay account is currently rejecting international cards. If you are using a real Indian card and seeing this, ensure 'International Payments' is enabled in your Razorpay Dashboard -> Settings -> Payment Methods. Also, verify you are not using a Test Card that Razorpay identifies as international.";
          }

          setErrorAlert({
            show: true,
            title: "Payment Processing Failed",
            message: msg,
            tip: tip
          });
        },
        onClose: () => {
          setLoadingPlanId(null);
        }
      });
    } catch (error) {
      console.error("Failed to start subscription:", error);
      setErrorAlert({
        show: true,
        title: "Subscription error",
        message: error.response?.data?.message || "Something went wrong while initiating your subscription. Please try again."
      });
      setLoadingPlanId(null);
    }
  }

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
      <div className="mx-auto max-w-6xl px-4 py-12 pt-24 relative">
      {errorAlert.show && (
        <SubscriptionAlert 
          title={errorAlert.title}
          message={errorAlert.message}
          troubleshootingTip={errorAlert.tip}
          onClose={() => setErrorAlert({ ...errorAlert, show: false })}
        />
      )}
      {showCountdownModal && (
        <CountdownModal countdown={countdown} onCancel={() => {
          setShowCountdownModal(false);
          setLoadingPlanId(null);
          setPendingPlan(null);
        }} />
      )}
      {showSuccessModal && (
        <SuccessModal 
          subscriptionId={createdSubscriptionId} 
          onClose={() => window.location.href = "/subscription"} 
        />
      )}
      {/* Rest of the UI remains the same */}
      <header className="mb-12 text-center relative">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
          Choose Your Perfect Plan
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Secure, reliable cloud storage for everyone. Start free, upgrade anytime.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-12 flex justify-center">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-sm">
          <button
            onClick={() => setMode("monthly")}
            className={classNames(
              "rounded-lg px-8 py-2.5 text-sm font-bold transition-all cursor-pointer",
              mode === "monthly" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setMode("yearly")}
            className={classNames(
              "rounded-lg px-8 py-2.5 text-sm font-bold transition-all cursor-pointer flex items-center gap-2",
              mode === "yearly" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Yearly
            {mode !== "yearly" && (
              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                SALE
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={`${mode}-${plan.id}`}
            plan={plan}
            onSelect={handleSelect}
            isLoading={loadingPlanId === plan.id}
            isDisabled={!!loadingPlanId}
          />
        ))}
      </div>

      {/* Small helper text */}
      <p className="mt-6 text-xs text-slate-500">
        Prices are indicative for demo. Integrate with Razorpay Subscriptions to
        start billing. You can prefill the plan IDs inside a static config.
      </p>
    </div>
    </div>
  );
}

import { checkSubscriptionStatus } from "./apis/subscriptionApi";

// ... existing imports

function SuccessModal({ subscriptionId, onClose }) {
  const [activating, setActivating] = useState(true);

  useEffect(() => {
    if (!subscriptionId) return;

    const interval = setInterval(async () => {
      try {
        const status = await checkSubscriptionStatus(subscriptionId);
        // Check both potential response formats
        if (status && (status.active || status.status === 'active')) {
          clearInterval(interval);
          setActivating(false);
          // Small delay to show success state before redirecting
          setTimeout(() => {
             onClose();
          }, 1500);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [subscriptionId, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"></div>
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center animate-in zoom-in-95 fade-in duration-300 border border-slate-100">
        {/* Icon */}
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
          {activating ? "Activating Subscription..." : "Payment Successful!"}
        </h2>
        <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
          {activating 
            ? "Please wait while we confirm your payment and set up your account." 
            : "Your subscription is now active. Redirecting you to your dashboard..."}
        </p>

        {/* Loading bar only when activating */}
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
  // Use local state for smooth progress animation
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Small delay to ensure the browser has painted the 0% width before transitioning
    const timer = setTimeout(() => {
      setProgress(100);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"></div>
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-slate-100">
        {/* Progress Bar at Top - Continuous Smooth Animation */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all ease-linear"
            style={{ 
              width: `${progress}%`, 
              transitionDuration: '3000ms' // Match exact countdown total time
            }}
          ></div>
        </div>

        <div className="p-8 text-center">
          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Redirecting you now</h2>
          <p className="text-sm text-slate-500 mb-8">
            You are being redirected to a <strong className="text-slate-700">secure payment gateway</strong> for subscription
          </p>
          
          {/* Countdown */}
          <div className="mb-8">
            <div className="text-6xl font-bold text-slate-900 mb-2 animate-pulse">
              {countdown}
            </div>
            <div className="text-sm text-slate-500">seconds remaining</div>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mb-6">
            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Secure connection
          </div>
          
          <button
            onClick={onCancel}
            className="text-sm text-slate-500 hover:text-slate-700 transition font-medium"
          >
            Cancel and stay on this page
          </button>
        </div>
      </div>
    </div>
  );
}

function openRazorPayPopup({
  subscriptionId,
  planName,
  planDescription,
  onClose,
  onSuccess,
  onFailure,
}) {
  console.log("Opening Razorpay for:", subscriptionId);
  const rzp = new window.Razorpay({
    key: "rzp_test_RnAnjbXG3sqHWQ",
    name: "Storage App",
    description: planName + " - " + planDescription,
    subscription_id: subscriptionId,
    theme: {
      color: "#2563eb",
    },
    handler: async function (response) {
      console.log("Payment successful!", response);
      onSuccess?.();
    },
    modal: {
      ondismiss: function() {
        console.log("Checkout modal closed");
        onClose?.(); // Reset loading state when modal is closed
      }
    }
  });

  rzp.on("payment.failed", function (response) {
    console.error("Payment failed:", response.error);
    onFailure?.("Payment failed: " + response.error.description);
  });

  rzp.open();
}