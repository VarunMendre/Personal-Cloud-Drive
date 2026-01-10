import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGitHub } from "./apis/loginWithGitHub";
import { Loader2 } from "lucide-react";

const GitHubCallbackHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGitHubCallback = async () => {
      const url = window.location.href;
      const hasCode = url.includes("?code=");

      if (hasCode) {
        const newUrl = new URL(url);
        const code = newUrl.searchParams.get("code");
        window.history.pushState({}, null, "/"); // clean URL

        try {
          const data = await loginWithGitHub(code);
          if (data.error) {
            console.error("GitHub login error:", data.error);
            navigate("/login");
          } else {
            console.log("✅ GitHub User Data:", data);
            navigate("/");
          }
        } catch (err) {
          console.error("GitHub login error:", err);
          navigate("/login");
        }
      }
    };

    handleGitHubCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-vh-100 h-screen bg-[#fafdff]">
      <div className="p-8 rounded-2xl glass-effect shadow-medium max-w-md w-full animate-fadeIn border-2 border-[#E6FAF5] bg-white flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-[#E6FAF5] flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#66B2D6] animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-[#66B2D6] opacity-20 animate-ping"></div>
        </div>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#2C3E50] mb-2">Authenticating</h2>
          <p className="text-[#A3C5D9] font-medium">Securing your connection to GitHub...</p>
        </div>

        <div className="w-full bg-[#fafdff] rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-[#66B2D6] rounded-full animate-progressIndeterminate"></div>
        </div>
      </div>
    </div>
  );
};

export default GitHubCallbackHandler;
