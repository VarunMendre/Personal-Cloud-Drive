import { useEffect, useState } from "react";
import { FaFileImport } from "react-icons/fa";
import axios from "axios";

// Ideally these should be in a config file or env variables
// But for now we use process.env as per React standard
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY;
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

export default function ImportFromDrive({ onFilesSelected, className }) {
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [tokenClient, setTokenClient] = useState(null);

  useEffect(() => {
    const loadGapi = () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        window.gapi.load("picker", () => {
          setPickerApiLoaded(true);
        });
      };
      document.body.appendChild(script);
    };

    const loadGis = () => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => {
        setGisLoaded(true);
      };
      document.body.appendChild(script);
    };

    loadGapi();
    loadGis();

    return () => {
      // Cleanup scripts if needed, though usually not necessary for single page apps
      // avoiding strict mode double load issues by checking if scripts exist could be better
      // but for now simple append is fine as per previous implementation style
    };
  }, []);

  useEffect(() => {
    if (gisLoaded) {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (tokenResponse) => {
          console.log("Token Response:", tokenResponse);
          if (tokenResponse && tokenResponse.access_token) {
            console.log("Access Token received:", tokenResponse.access_token.substring(0, 10) + "...");
            createPicker(tokenResponse.access_token);
          } else {
            console.error("No access token in response");
          }
        },
      });
      setTokenClient(client);
    }
  }, [gisLoaded]);

  const handleAuth = () => {
    if (tokenClient) {
      // Skip if we already have a valid token? 
      // GIS handles token management, but for picker we usually just request a fresh one or let it handle it.
      tokenClient.requestAccessToken();
    } else {
      console.error("Google Identity Services not loaded yet");
    }
  };

  const createPicker = (token) => {
    if (pickerApiLoaded && token) {
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setOrigin(window.location.protocol + "//" + window.location.host)
        .setCallback((data) => pickerCallback(data, token))
        .build();
      picker.setVisible(true);
    }
  };

  const pickerCallback = async (data, token) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const file = data.docs[0];
      if (onFilesSelected) {
        onFilesSelected(file, token);
      }
    }
  };

  return (
    <button
      onClick={handleAuth}
      className={className || "flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"}
    >
      <FaFileImport className="w-4 h-4" />
      Import from Drive
    </button>
  );
}
