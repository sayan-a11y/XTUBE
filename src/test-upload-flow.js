const { writeFileSync, existsSync } = require('fs');

async function testFlow() {
  console.log("Starting End-to-End Chunked Upload Flow Test...");
  const base_url = "http://localhost:3000/api/upload";

  // 1. Initialize upload session
  console.log("\n1. Initializing upload session...");
  const initRes = await fetch(base_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'init',
      fileName: 'test-antigravity.mp4',
      fileSize: 7 * 1024 * 1024, // 7MB video
      mimeType: 'video/mp4'
    })
  });

  if (!initRes.ok) {
    throw new Error(`Init failed: ${initRes.status} ${await initRes.text()}`);
  }

  const initData = await initRes.json();
  console.log("Session Initialized:", initData);

  const { sessionId, chunkSize, totalChunks, chunkUrls } = initData;

  // 2. Upload chunks in loop
  console.log(`\n2. Uploading ${totalChunks} chunks of size ${chunkSize} bytes...`);
  
  for (let i = 0; i < totalChunks; i++) {
    const startBytes = i * chunkSize;
    const endBytes = Math.min(7 * 1024 * 1024, (i + 1) * chunkSize);
    const size = endBytes - startBytes;
    
    console.log(`Uploading chunk ${i} (${size} bytes)...`);
    
    // Create random test bytes
    const buffer = Buffer.alloc(size, i);
    
    // Prepare FormData
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    formData.append('chunk', blob, `chunk_${i}`);

    const putUrl = `http://localhost:3000${chunkUrls[i].uploadUrl}`;
    const putRes = await fetch(putUrl, {
      method: 'PUT',
      body: formData
    });

    if (!putRes.ok) {
      throw new Error(`Chunk ${i} upload failed: ${putRes.status} ${await putRes.text()}`);
    }

    console.log(`Chunk ${i} response:`, await putRes.json());
  }

  // 3. Complete the upload
  console.log("\n3. Completing upload and assembling video...");
  const completeRes = await fetch(base_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'complete',
      sessionId,
      title: 'Test Antigravity Video',
      description: 'An end-to-end test of the robust chunked upload mechanism.',
      category: 'Test & Debug',
      duration: '0:10',
      resolution: '1080p'
    })
  });

  if (!completeRes.ok) {
    throw new Error(`Complete failed: ${completeRes.status} ${await completeRes.text()}`);
  }

  const completeData = await completeRes.json();
  console.log("Upload completed successfully!");
  console.log("Complete Response:", JSON.stringify(completeData, null, 2));
}

testFlow().catch(err => {
  console.error("Test Flow Failed:", err);
});
