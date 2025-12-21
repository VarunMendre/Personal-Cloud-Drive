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
  BsHddStack
} from "react-icons/bs";
import { getSubscriptionDetails, getInvoiceUrl } from "./apis/subscriptionApi";

const MOCK_DATA = {
  activePlan: {
    name: "Pro Plan",
    tagline: "For Students & Freelancers",
    nextBillingDate: "Dec 9, 2025",
    daysLeft: 30,
    billingAmount: 299,
    billingPeriod: "Monthly",
    status: "active"
  },
  storage: {
    usedInBytes: 0,
    totalInBytes: 214748364800, // 200 GB
    percentageUsed: 0.0,
    usedLabel: "0 Bytes",
    totalLabel: "200 GB"
  },
  limits: {
    maxFileSize: "2 GB",
    prioritySpeed: "Active"
  },
  stats: {
    totalFiles: 0,
    sharedFiles: 0,
    devicesConnected: 1,
    maxDevices: 3,
    uploadsDuringSubscription: 0
  }
};

export default function SubscriptionDetails() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  async function handleViewInvoice() {
    try {
      setLoadingInvoice(true);
      const res = await getInvoiceUrl();
      if (res.invoiceUrl) {
        window.open(res.invoiceUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
      setErrorMessage(err.response?.data?.message || "Unable to find the invoice. Please try again later.");
      // Clear error after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setLoadingInvoice(false);
    }
  }

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const res = await getSubscriptionDetails();
        if (res && res.activePlan) {
          setData(res);
        } else {
          // If response is successful but empty/invalid plan
          navigate("/plans");
        }
      } catch (err) {
        console.error("DEBUG - Subscription Fetch Error:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        navigate("/plans");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [navigate]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-slate-50 min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent shadow-sm"></div>
          <p className="text-slate-500 font-medium animate-pulse text-sm">Verifying subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 bg-slate-50 min-h-screen relative">
      {/* Custom Error Toast */}
      {errorMessage && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right-8 duration-500">
          <div className="flex items-center gap-3 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl border border-red-500/50 backdrop-blur-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-bold text-sm tracking-wide">{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} className="ml-2 opacity-50 hover:opacity-100 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Your Subscription</h1>
        <p className="text-slate-500 mt-1">Manage your plan and view usage details</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Plan Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
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
              to="/plans" 
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
            <button className="px-5 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">
              Cancel Subscription
            </button>
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
