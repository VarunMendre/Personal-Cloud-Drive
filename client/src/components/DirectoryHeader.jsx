import { useNavigate } from "react-router-dom";

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
    <header className="fixed top-0 left-0 right-0 z-40 shadow-sm" style={{ backgroundColor: '#0D2440' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105" style={{ backgroundColor: '#2E5E99' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-white">CloudDrive</span>
              <p className="text-xs" style={{ color: '#7BA4D0' }}>Your secure storage</p>
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
                  backgroundColor: subscriptionId ? '#2E5E99' : '#7BA4D0',
                  color: '#FFFFFF'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = subscriptionId ? '#254a7f' : '#5a8ab8';
                  e.target.style.boxShadow = '0 4px 12px rgba(46, 94, 153, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = subscriptionId ? '#2E5E99' : '#7BA4D0';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-semibold">
                  {subscriptionId ? "Subscription" : "Upgrade"}
                </span>
              </button>

              {/* Share Link */}
              <button
                onClick={() => navigate("/share")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(123, 164, 208, 0.1)',
                  color: '#E7F0FA'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(123, 164, 208, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(123, 164, 208, 0.1)';
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="text-sm font-semibold">Share</span>
              </button>

              {/* Users Link - Only for Owner/Admin/Manager */}
              {userRole !== "User" && (
                <button
                  onClick={() => navigate("/users")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(123, 164, 208, 0.1)',
                    color: '#E7F0FA'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(123, 164, 208, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(123, 164, 208, 0.1)';
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm font-semibold">Users</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-8 w-px" style={{ backgroundColor: 'rgba(123, 164, 208, 0.3)' }}></div>

            {/* Profile Section */}
            <div
              onClick={handleProfileClick}
              className="flex items-center gap-3 cursor-pointer hover:bg-opacity-10 p-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(123, 164, 208, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white">
                  {userName}
                </div>
                <div className="text-xs" style={{ color: '#7BA4D0' }}>{userEmail}</div>
              </div>
              {userPicture ? (
                <img
                  src={userPicture}
                  alt={userName}
                  className="w-10 h-10 rounded-full object-cover border-2"
                  style={{ borderColor: '#2E5E99' }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold border-2" style={{ backgroundColor: '#2E5E99', borderColor: '#7BA4D0', color: '#FFFFFF' }}>
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
