// Netlify Function to fetch videos from Google Drive
// This keeps your API key secure on the server-side

exports.handler = async function (event, context) {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Get environment variables
  const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
  const FOLDER_ID = process.env.VIDEOS_FOLDER_ID;

  // Validate environment variables
  if (!API_KEY || !FOLDER_ID) {
    console.error("Missing environment variables");
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server configuration error",
        message: "Missing required environment variables",
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

    // Fetch from Google Drive API
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Drive API error:", response.status, errorText);

      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "Failed to fetch videos from Google Drive",
          details: errorText,
        }),
      };
    }

    const data = await response.json();

    // Return success response with CORS headers
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=300, s-maxage=600", // Cache for 5-10 minutes
      },
      body: JSON.stringify({
        files: data.files || [],
        count: data.files?.length || 0,
      }),
    };
  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
    };
  }
};
