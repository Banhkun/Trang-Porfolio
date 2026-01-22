// netlify/functions/sync-media.js
// const fetch = require('node-fetch');

// Fetch files from Google Drive folder
async function fetchDriveFiles(folderId, apiKey) {
  const url = `https://www.googleapis.com/drive/v3/files?` +
    `q='${folderId}'+in+parents+and+trashed=false&` +
    `fields=files(id,name,mimeType,thumbnailLink,createdTime,description)&` +
    `orderBy=createdTime desc&` +
    `key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Drive API error: ${response.status}`);
  }

  const data = await response.json();
  return data.files || [];
}

// Convert Drive file to usable format
function formatDriveFile(file, type) {
  const baseUrl = 'https://drive.google.com';

  return {
    id: file.id,
    title: file.name.replace(/\.[^/.]+$/, ''),
    url: type === 'image'
      ? `${baseUrl}/uc?export=view&id=${file.id}`
      : `${baseUrl}/file/d/${file.id}/preview`,
    thumbnail: file.thumbnailLink || null,
    description: file.description || '',
    createdTime: file.createdTime,
    type: type
  };
}

// Main handler
exports.handler = async (event, context) => {
  console.log('🔄 Starting media sync...');

  try {
    const apiKey = process.env.DRIVE_API_KEY;
    const galleryFolderId = process.env.GALLERY_FOLDER_ID;
    const videoFolderId = process.env.VIDEO_FOLDER_ID;

    // Validate environment variables
    if (!apiKey || !galleryFolderId || !videoFolderId) {
      throw new Error('Missing environment variables');
    }

    // Fetch from both folders in parallel
    const [galleryFiles, videoFiles] = await Promise.all([
      fetchDriveFiles(galleryFolderId, apiKey),
      fetchDriveFiles(videoFolderId, apiKey)
    ]);

    // Format the data
    const gallery = galleryFiles
      .filter(f => f.mimeType && f.mimeType.startsWith('image/'))
      .map(f => formatDriveFile(f, 'image'));

    const videos = videoFiles
      .filter(f => f.mimeType && f.mimeType.startsWith('video/'))
      .map(f => formatDriveFile(f, 'video'));

    const result = {
      gallery,
      videos,
      lastSync: new Date().toISOString(),
      counts: {
        gallery: gallery.length,
        videos: videos.length
      }
    };

    console.log(`✅ Synced ${gallery.length} images and ${videos.length} videos`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('❌ Sync error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        gallery: [],
        videos: []
      })
    };
  }
};
