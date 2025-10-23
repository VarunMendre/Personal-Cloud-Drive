import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGitHub } from "./apis/loginWithGitHub";

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
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl font-semibold mb-4">Processing GitHub login...</h2>
    </div>
  );
};

export default GitHubCallbackHandler;
