// update-media.js
// Fetches images and videos from Google Drive and generates media.json
// Run this via GitHub Actions on a schedule

const fs = require("fs");
const https = require("https");

// Configuration - these will come from GitHub Secrets
const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
const IMAGES_FOLDER_ID =
  process.env.IMAGES_FOLDER_ID || "18-RF8xntLSdP9Kd8SP4O6413hnhFG5oI";
const VIDEOS_FOLDER_ID =
  process.env.VIDEOS_FOLDER_ID || "1y64_doNJtsopxbxyTZ3xlfI-YZnhN9J8";

console.log("🚀 Starting media update...");

// Function to fetch data from Google Drive API
function fetchFromDrive(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

async function fetchImages() {
  console.log("📸 Fetching images from Google Drive...");

  const url =
    `https://www.googleapis.com/drive/v3/files?` +
    `q='${IMAGES_FOLDER_ID}'+in+parents+and+(mimeType+contains+'image/')` +
    `&key=${GOOGLE_DRIVE_API_KEY}` +
    `&fields=files(id,name,description,createdTime,imageMediaMetadata)` +
    `&orderBy=createdTime desc`;

  try {
    const data = await fetchFromDrive(url);
    console.log(`✅ Found ${data.files?.length || 0} images`);
    return data.files || [];
  } catch (error) {
    console.error("❌ Error fetching images:", error.message);
    return [];
  }
}

async function fetchVideos() {
  console.log("🎥 Fetching videos from Google Drive...");

  const url =
    `https://www.googleapis.com/drive/v3/files?` +
    `q='${VIDEOS_FOLDER_ID}'+in+parents+and+(mimeType+contains+'video/')` +
    `&key=${GOOGLE_DRIVE_API_KEY}` +
    `&fields=files(id,name,description,createdTime,videoMediaMetadata)` +
    `&orderBy=createdTime desc`;

  try {
    const data = await fetchFromDrive(url);
    console.log(`✅ Found ${data.files?.length || 0} videos`);
    return data.files || [];
  } catch (error) {
    console.error("❌ Error fetching videos:", error.message);
    return [];
  }
}

async function main() {
  // Validate API key
  if (!GOOGLE_DRIVE_API_KEY) {
    console.error("❌ GOOGLE_DRIVE_API_KEY environment variable is required!");
    process.exit(1);
  }

  try {
    // Fetch both images and videos
    const [images, videos] = await Promise.all([fetchImages(), fetchVideos()]);

    // Create the media data object
    const mediaData = {
      images: {
        files: images,
        count: images.length,
      },
      videos: {
        files: videos,
        count: videos.length,
      },
      lastUpdated: new Date().toISOString(),
    };

    // Write to media.json
    fs.writeFileSync("media.json", JSON.stringify(mediaData, null, 2));
    console.log("✅ media.json generated successfully!");
    console.log(`📊 Summary: ${images.length} images, ${videos.length} videos`);
    console.log(`🕐 Last updated: ${mediaData.lastUpdated}`);
  } catch (error) {
    console.error("❌ Error generating media.json:", error);
    process.exit(1);
  }
}

// Run the script
main();
