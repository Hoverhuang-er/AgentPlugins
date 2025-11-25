// Development server with Bun
const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Handle API endpoints
    if (url.pathname === "/api/chat") {
      if (req.method === "POST") {
        try {
          const body = await req.json();
          const { message } = body;
          
          // For now, return a simple response
          // In production, this would call the actual LangChain handler
          return new Response(
            JSON.stringify({
              response: `Processing: ${message}`,
              success: true
            }),
            {
              headers: { "Content-Type": "application/json" }
            }
          );
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "Failed to process request" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
    
    // Serve static files
    const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    
    try {
      const file = Bun.file(`.${filePath}`);
      
      if (await file.exists()) {
        return new Response(file);
      }
      
      // Try to serve from src directory
      const srcFile = Bun.file(`./src${filePath}`);
      if (await srcFile.exists()) {
        return new Response(srcFile);
      }
      
      return new Response("Not Found", { status: 404 });
    } catch (error) {
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`🚀 Mol3D Server running at http://localhost:${server.port}`);
console.log(`📖 Open http://localhost:${server.port} in your browser`);
