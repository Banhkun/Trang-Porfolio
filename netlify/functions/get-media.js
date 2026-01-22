// netlify/functions/get-media.js

// This function serves the cached media data
// It's faster than calling sync-media every time

exports.handler = async (event, context) => {
  try {
    // Import the sync function to get latest data
    const syncHandler = require('./sync-media').handler;

    // Call sync function
    const result = await syncHandler(event, context);

    return result;

  } catch (error) {
    console.error('Error getting media:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to fetch media',
        gallery: [],
        videos: []
      })
    };
  }
};