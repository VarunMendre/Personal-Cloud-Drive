import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  BsLightningChargeFill, 
  BsInboxesFill, 
  BsShareFill, 
  BsPeopleFill, 
  BsCloudUploadFill,
  BsCalendar3,
  BsCreditCard,
  BsHddStack,
  BsStars
} from "react-icons/bs";
import { getSubscriptionDetails, getInvoiceUrl, cancelSubscription } from "./apis/subscriptionApi";
import { Alert, AlertDescription } from "./components/lightswind/alert";
import DirectoryHeader from "./components/DirectoryHeader";
import { useAuth } from "./context/AuthContext";

const MOCK_DATA = {
// ... existing MOCK_DATA ...
};

export default function SubscriptionDetails() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  async function handleViewInvoice() {
    try {
      setLoadingInvoice(true);
      const response = await getInvoiceUrl();
      if (response?.invoiceUrl) {
        window.open(response.invoiceUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
      setErrorMessage(err.response?.data?.message || "Failed to load invoice. Please try again.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoadingInvoice(false);
    }
  }

  async function handleCancelSubscription() {
    const limit500MB = 524288000;
    if (data.storage.usedInBytes > limit500MB) {
      setErrorMessage("Your storage usage is above 500MB. Please delete some files before cancelling.");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    setShowCancelConfirm(true);
  }

  async function confirmCancellation() {
    try {
      setCancelling(true);
      const res = await cancelSubscription(data.activePlan.planId);
      if (res.success) {
        // Redirect or refresh
        window.location.reload(); 
      }
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
      setErrorMessage(err.response?.data?.message || "Failed to cancel subscription. Please try again.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  }

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await getSubscriptionDetails();
        if (res && res.activePlan && ["active", "created", "past_due"].includes(res.activePlan.status)) {
          setData(res);
        } else {
          // If response is successful but status is not valid (e.g. 'halted'), kick them out
          navigate("/plans");
        }
      } catch (err) {
        // Expected 404 when no subscription exists
        navigate("/plans");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: '#fafdff' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: '#66B2D6', borderTopColor: 'transparent' }}></div>
        <p className="font-medium" style={{ color: '#2C3E50' }}>Loading subscription details...</p>
      </div>
    );
  }

  if (!data) return null;

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
    <div className="mx-auto max-w-6xl px-4 py-12 min-h-screen relative pt-24">

      {/* Custom Error Toast */}
      {errorMessage && (
        <div className="fixed top-24 right-6 z-[100] max-w-sm w-full md:w-[380px]">
          <Alert variant="destructive" withIcon duration={4000} dismissible onDismiss={() => setErrorMessage(null)} className="bg-white/95 backdrop-blur-md shadow-2xl border-red-100">
            <AlertDescription className="font-bold text-sm tracking-wide">
              {errorMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Cancel Subscription?</h3>
            <p className="text-slate-500 text-sm mb-6">
              Are you sure? This action is permanent and will trigger the following changes to your account:
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg>
                </div>
                <p className="text-sm text-slate-600 leading-tight">
                  <strong className="text-slate-900">Permanent Data Loss:</strong> All files uploaded during your subscription period will be <span className="text-red-600 font-bold uppercase text-[10px] tracking-wider">permanently deleted</span>.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" /></svg>
                </div>
                <p className="text-sm text-slate-600 leading-tight">
                  <strong className="text-slate-900">Storage Downgrade:</strong> Your storage limit will be reset to the free tier capacity of <strong className="text-slate-900">500MB</strong>.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM5.884 6.98a1 1 0 00-1.458-1.366l-.707.707a1 1 0 101.458 1.366l.707-.707zM14.282 5.614a1 1 0 00-1.414 0l-.707.707a1 1 0 101.414 1.414l.707-.707a1 1 0 000-1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zM6.98 14.116a1 1 0 00-1.366-1.458l-.707.707a1 1 0 101.366 1.458l.707-.707zM14.386 14.282a1 1 0 101.414-1.414l-.707-.707a1 1 0 10-1.414 1.414l.707.707zM11 16a1 1 0 10-2 0v1a1 1 0 102 0v-1z" /></svg>
                </div>
                <p className="text-sm text-slate-600 leading-tight">
                  <strong className="text-slate-900">Upload Limits:</strong> Maximum file size per upload will be restricted to <strong className="text-slate-900">100MB</strong>.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                  <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                </div>
                <p className="text-sm text-slate-600 leading-tight">
                  <strong className="text-slate-900">Device Restrictions:</strong> You will only be allowed <strong className="text-slate-900">1 active connection</strong> at a time.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmCancellation}
                disabled={cancelling}
                className="w-full px-6 py-4 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  "Yes, Cancel My Subscription"
                )}
              </button>
              <button 
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="w-full px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Nevermind, keep my plan
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-10">
        <h1 className="text-3xl font-extrabold" style={{ color: '#2C3E50' }}>Your Subscription</h1>
        <p className="mt-1" style={{ color: '#A3C5D9' }}>Manage your plan and view usage details</p>
      </header>
      
      {/* Bonus Trial Banner */}
      {data.activePlan.isInTrial && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
              <BsStars className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900">Bonus Trial Active!</h3>
              <p className="text-sm text-blue-700">
                You have <strong>{data.activePlan.bonusDays} bonus days</strong> of free access
              </p>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-blue-800">
              <strong>Trial ends:</strong> {data.activePlan.trialEndsAt}
              <br />
              <strong>Next billing:</strong> After trial expires
            </p>
          </div>
        </div>
      )}
      
      {/* ... existing card start ... */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
          {/* ... existing header ... */}
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                  {data.activePlan.status}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{data.activePlan.name}</h2>
              <p className="text-slate-500 text-sm">{data.activePlan.tagline}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BsLightningChargeFill className="w-6 h-6" />
            </div>
          </div>

          {/* ... existing stats ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 transition hover:border-blue-100">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <BsCalendar3 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Next Billing</span>
              </div>
              <div className="text-lg font-bold text-slate-900">{data.activePlan.nextBillingDate}</div>
              <div className="text-xs text-slate-500 mt-0.5">in {data.activePlan.daysLeft} days</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 transition hover:border-blue-100">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <BsCreditCard className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Billing Amount</span>
              </div>
              <div className="text-lg font-bold text-slate-900">₹{data.activePlan.billingAmount}</div>
              <div className="text-xs text-slate-500 mt-0.5">{data.activePlan.billingPeriod}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-auto">
            <Link 
              to="/change-plan" 
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              Change Plan
            </Link>
            <button 
              onClick={handleViewInvoice}
              disabled={loadingInvoice}
              className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingInvoice ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  Fetching...
                </>
              ) : (
                "View invoice"
              )}
            </button>
            {data.activePlan.cancelledAt ? (
              <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold leading-tight">Cancelled - Pending Expiry</p>
                  <p className="text-[11px] opacity-80 mt-0.5">Your access remains active until {data.activePlan.nextBillingDate}. Files will be deleted after this date.</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleCancelSubscription}
                className="px-5 py-2.5 bg-white text-red-600 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-50 transition-all"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>


        {/* Storage Usage Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-900">
              <BsHddStack className="w-5 h-5 opacity-60" />
              <h3 className="font-bold">Storage Usage</h3>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-2xl font-bold text-slate-900">{data.storage.usedLabel}</span>
              <span className="text-xs font-medium text-slate-400">of {data.storage.totalLabel}</span>
            </div>
            
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${data.storage.percentageUsed || 0}%` }}
              ></div>
            </div>
            <p className="text-xs font-medium text-slate-500">{data.storage.percentageUsed}% used</p>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl text-blue-700">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                      <BsLightningChargeFill className="w-3.5 h-3.5" />
                   </div>
                   <span className="text-sm font-bold">Priority Speed</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-600 text-white rounded-md uppercase">{data.limits.prioritySpeed}</span>
             </div>

             <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl group hover:border-blue-200 transition">
                <span className="text-sm font-medium text-slate-500 group-hover:text-slate-900 transition">Max File Size</span>
                <span className="text-sm font-bold text-slate-900">{data.limits.maxFileSize}</span>
             </div>
             <p className="text-[10px] text-center text-slate-400 font-medium">Per file upload limit</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          icon={<BsInboxesFill className="w-5 h-5 text-blue-600" />} 
          title="Total Files" 
          value={data.stats.totalFiles} 
          bgColor="bg-blue-50"
        />
        <StatsCard 
          icon={<BsShareFill className="w-5 h-5 text-green-600" />} 
          title="Shared Files" 
          value={data.stats.sharedFiles} 
          bgColor="bg-green-50"
        />
        <StatsCard 
          icon={<BsPeopleFill className="w-5 h-5 text-purple-600" />} 
          title="Devices Connected" 
          value={`${data.stats.devicesConnected} / ${data.stats.maxDevices || 3}`} 
          bgColor="bg-purple-50"
        />
        <StatsCard 
          icon={<BsCloudUploadFill className="w-5 h-5 text-orange-600" />} 
          title="Files Uploaded" 
          value={data.stats.uploadsDuringSubscription} 
          subtitle="During subscription"
          bgColor="bg-orange-50"
        />
      </div>
    </div>
    </div>
  );
}

function StatsCard({ icon, title, value, subtitle, bgColor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-blue-200 transition">
      <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{title}</div>
      {subtitle && <div className="text-[10px] text-slate-400 mt-0.5">{subtitle}</div>}
    </div>
  );
}
