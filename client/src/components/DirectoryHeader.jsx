import { useNavigate } from "react-router-dom";
import { Cloud, Crown, Share2, Users, Settings } from "lucide-react";

export const BASE_URL = import.meta.env.VITE_BASE_URL;

function DirectoryHeader({
  directoryName,
  path,
  disabled = false,
  onStorageUpdate,
  userName = "Guest User",
  userEmail = "guest@example.com",
  userPicture = "",
  userRole = "User",
  subscriptionId = null,
  subscriptionStatus = "active",
}) {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate("/settings");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40" style={{ backgroundColor: '#fafdff', boxShadow: '0 4px 20px -2px rgba(31, 62, 102, 0.15), 0 2px 8px -2px rgba(31, 62, 102, 0.1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105" style={{ backgroundColor: '#66B2D6' }}>
              <Cloud className="w-6 h-6" style={{ color: '#FFFFFF' }} />
            </div>
            <div>
              <span className="text-lg font-bold" style={{ color: '#2C3E50' }}>CloudVault</span>
              <p className="text-xs" style={{ color: '#A3C5D9' }}>Your Secure Storage</p>
            </div>
          </div>

          {/* Right side: Navigation Links + Profile */}
          <div className="flex items-center gap-4">
            {/* Subscription Status Badge */}
            {subscriptionStatus?.toLowerCase() === "paused" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-full animate-pulse shadow-md border border-amber-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wide">Paused</span>
              </div>
            )}

            {/* Action Buttons Group */}
            <div className="flex items-center gap-2">
              {/* Upgrade/Subscription Link */}
              <button
                onClick={() => navigate(subscriptionId ? "/subscription" : "/plans")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:transform hover:-translate-y-0.5"
                style={{
                  backgroundColor: subscriptionId ? '#A7DDE9' : '#FFFFFF',
                  color: subscriptionId ? '#FFFFFF' : '#66B2D6',
                  border: subscriptionId ? 'none' : '1px solid #D1DCE5'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 178, 214, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = 'none';
                }}
              >
                <Crown className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {subscriptionId ? "Subscription" : "Upgrade"}
                </span>
              </button>

              {/* Share Link */}
              <button
                onClick={() => navigate("/share")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#2C3E50',
                  border: '1px solid #D1DCE5'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#FFFFFF';
                }}
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm font-semibold">Share</span>
              </button>

              {/* Users Link - Only for Owner/Admin/Manager */}
              {userRole !== "User" && (
                <button
                  onClick={() => navigate("/users")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#2C3E50',
                    border: '1px solid #D1DCE5'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#fafdff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#FFFFFF';
                  }}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-semibold">Users</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-8 w-px" style={{ backgroundColor: '#D1DCE5' }}></div>

            {/* Profile Section */}
            <div
              onClick={handleProfileClick}
              className="flex items-center gap-3 cursor-pointer hover:bg-opacity-10 p-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold" style={{ color: '#2C3E50' }}>
                  {userName}
                </div>
                <div className="text-xs" style={{ color: '#A3C5D9' }}>{userEmail}</div>
              </div>
              {userPicture ? (
                <img
                  src={userPicture}
                  alt={userName}
                  className="w-10 h-10 rounded-full object-cover border-2"
                  style={{ borderColor: '#FFFFFF' }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold border-2" style={{ backgroundColor: '#FFFFFF', borderColor: '#E6FAF5', color: '#66B2D6' }}>
                  <span className="text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DirectoryHeader;
