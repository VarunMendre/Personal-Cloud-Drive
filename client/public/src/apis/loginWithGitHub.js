const BASE_URL = import.meta.env.VITE_BASE_URL;

export const loginWithGitHub = async (code) => {
  const response = await fetch(`${BASE_URL}/auth/github`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
    credentials: "include",
  });
  const data = await response.json();
  return data;
};
