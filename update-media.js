const fs = require("fs");
const fetch = require("node-fetch"); // We'll install this in the workflow

async function fetchFromDrive(folderId, mimeType) {
  const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
  if (!API_KEY || !folderId) {
    throw new Error("Missing API key or folder ID");
  }

  const url =
    `https://www.googleapis.com/drive/v3/files?` +
    `q='${folderId}'+in+parents+and+(mimeType+contains+'${mimeType}/')` +
    `&key=${API_KEY}` +
    `&fields=files(id,name,description,createdTime,${mimeType === "image" ? "imageMediaMetadata" : "videoMediaMetadata"})` +
    `&orderBy=createdTime desc`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch from Drive: ${response.status} - ${errorText}`,
    );
  }

  const data = await response.json();
  return data.files || [];
}

async function main() {
  try {
    const images = await fetchFromDrive(process.env.IMAGES_FOLDER_ID, "image");
    const videos = await fetchFromDrive(process.env.VIDEOS_FOLDER_ID, "video");

    const media = {
      images,
      videos,
      lastUpdated: new Date().toISOString(),
      counts: { images: images.length, videos: videos.length },
    };

    fs.writeFileSync("media.json", JSON.stringify(media, null, 2));
    console.log(
      `✅ Generated media.json: ${media.counts.images} images, ${media.counts.videos} videos`,
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
