import axios from "axios";

/**
 * Exchanges GitHub OAuth code for user profile and email
 * @param {string} code - OAuth code from frontend
 * @returns {Promise<object>} - GitHub user info { name, email, picture }
 */
export const getGitHubUser = async (code) => {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

  // 1. Exchange code for access token
  const tokenResp = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
    },
    {
      headers: { Accept: "application/json" },
    }
  );

  const accessToken = tokenResp.data.access_token;
  if (!accessToken) {
    throw new Error("No access token received from GitHub");
  }

  // 2. Fetch user info
  const userResp = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` },
  });

  // 3. Fetch primary email
  let email = null;
  try {
    const emailsResp = await axios.get("https://api.github.com/user/emails", {
      headers: { Authorization: `token ${accessToken}` },
    });
    email = emailsResp.data.find((e) => e.primary)?.email || null;
  } catch (err) {
    console.warn("Could not fetch GitHub email:", err.message);
  }

  return {
    name: userResp.data.name || userResp.data.login,
    email,
    picture: userResp.data.avatar_url,
  };
};
