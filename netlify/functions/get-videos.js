// Netlify Function to fetch videos from Google Drive (DEBUG VERSION)
// This version includes detailed logging to help debug issues

exports.handler = async function (event, context) {
  console.log("=== get-videos function called ===");
  console.log("HTTP Method:", event.httpMethod);

  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    console.log("ERROR: Invalid method:", event.httpMethod);
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Get environment variables
  const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
  const FOLDER_ID = process.env.VIDEOS_FOLDER_ID;

  // Log environment variable status (without exposing values)
  console.log("Environment variables check:");
  console.log(
    "- GOOGLE_DRIVE_API_KEY:",
    API_KEY ? "✅ Set (" + API_KEY.substring(0, 10) + "...)" : "❌ Missing",
  );
  console.log(
    "- VIDEOS_FOLDER_ID:",
    FOLDER_ID ? "✅ Set (" + FOLDER_ID + ")" : "❌ Missing",
  );

  // Validate environment variables
  if (!API_KEY || !FOLDER_ID) {
    console.error("❌ Missing environment variables!");
    console.error("API_KEY exists:", !!API_KEY);
    console.error("FOLDER_ID exists:", !!FOLDER_ID);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Server configuration error",
        message: "Missing required environment variables",
        debug: {
          hasApiKey: !!API_KEY,
          hasFolderId: !!FOLDER_ID,
          availableEnvVars: Object.keys(process.env).filter(
            (k) =>
              k.includes("DRIVE") ||
              k.includes("VIDEO") ||
              k.includes("FOLDER"),
          ),
        },
      }),
    };
  }

  try {
    // Build Google Drive API URL
    const url =
      `https://www.googleapis.com/drive/v3/files?` +
      `q='${FOLDER_ID}'+in+parents+and+(mimeType+contains+'video/')` +
      `&key=${API_KEY}` +
      `&fields=files(id,name,description,createdTime,videoMediaMetadata)` +
      `&orderBy=createdTime desc`;

    console.log("Fetching from Google Drive API...");
    console.log("Folder ID:", FOLDER_ID);

    // Fetch from Google Drive API
    const response = await fetch(url);

    console.log("Google Drive API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Google Drive API error:", response.status);
      console.error("Error details:", errorText);

      return {
        statusCode: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Failed to fetch videos from Google Drive",
          status: response.status,
          details: errorText,
          folderId: FOLDER_ID,
        }),
      };
    }

    const data = await response.json();
    const fileCount = data.files?.length || 0;

    console.log("✅ Successfully fetched videos:", fileCount);
    console.log(
      "Video IDs:",
      data.files?.map((f) => f.id).join(", ") || "none",
    );

    // Return success response with CORS headers
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
      body: JSON.stringify({
        files: data.files || [],
        count: fileCount,
        debug: {
          folderId: FOLDER_ID,
          timestamp: new Date().toISOString(),
        },
      }),
    };
  } catch (error) {
    console.error("❌ Function error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
        name: error.name,
      }),
    };
  }
};
