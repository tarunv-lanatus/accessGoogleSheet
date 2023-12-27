"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [output, setOutput] = useState(null);
  const [isVisible, setIsVisible] = useState("Authorize");

  const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const DISCOVERY_DOC = process.env.NEXT_PUBLIC_DISCOVERY_DOC;
  const SCOPES = process.env.NEXT_PUBLIC_SCOPES;
  let tokenClient;
  let gapiInited = false;
  let gisInited = false;

  const gapiLoaded = () => {
    window.gapi.load("client", initializeGapiClient);
  };

  const initializeGapiClient = async () => {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
  };

  const gisLoaded = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: "",
    });
    gisInited = true;
  };

  const handleAuthClick = () => {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw resp;
      }
      setIsVisible("Refresh");
      await listMajors();
    };

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: "consent" });
    } else {
      tokenClient.requestAccessToken({ prompt: "" });
    }
  };

  const listMajors = async () => {
    let response;
    try {
      response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: process.env.NEXT_PUBLIC_SPREADSHEET_ID,
        range: process.env.NEXT_PUBLIC_SPREADSHEET_RANGE,
      });
    } catch (err) {
      setOutput("You don't have access!!");
      console.error(err.message);
      return;
    }
    console.log({ response });
    const range = response.result;
    if (range?.values?.length === 0) {
      setOutput("No Values Found!!");
      return;
    }
    setOutput(JSON.stringify(range.values));
  };

  useEffect(() => {
    const script1 = document.createElement("script");
    script1.src = "https://apis.google.com/js/api.js";
    script1.async = true;
    script1.defer = true;
    script1.onload = gapiLoaded;

    const script2 = document.createElement("script");
    script2.src = "https://accounts.google.com/gsi/client";
    script2.async = true;
    script2.defer = true;
    script2.onload = gisLoaded;

    document.body.appendChild(script1);
    document.body.appendChild(script2);

    return () => {
      document.body.removeChild(script1);
      document.body.removeChild(script2);
    };
  }, [gapiLoaded, gisLoaded]);
  return (
    <div>
      <p>Sheets API Quickstart</p>
      <button id="authorize_button" onClick={handleAuthClick}>
        {isVisible}
      </button>
      <p>{output}</p>
    </div>
  );
}
