// Complete Bun Server with LangChain Chat UI
import { MoleculeAI, EXAMPLE_MOLECULES, type MoleculeData } from "./langchain";

const ai = new MoleculeAI();

// In-memory chat history
const chatHistory: Array<{ role: string; content: string }> = [];

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // API: Generate molecule from prompt
    if (url.pathname === "/api/generate" && req.method === "POST") {
      try {
        const { prompt } = await req.json();
        const molecule = await ai.generateMolecule(prompt);
        
        return new Response(JSON.stringify({ success: true, molecule }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: (error as Error).message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // API: Chat about molecule
    if (url.pathname === "/api/chat" && req.method === "POST") {
      try {
        const { message, molecule } = await req.json();
        
        // Check for example molecules
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes("water") || lowerMessage.includes("h2o")) {
          return new Response(
            JSON.stringify({
              success: true,
              response: "Here's a water molecule!",
              molecule: EXAMPLE_MOLECULES.water,
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
        
        if (lowerMessage.includes("phenytoin") || 
            lowerMessage.includes("cn1c(=nc(c1=o)(c2ccccc2)c3ccccc3)n")) {
          return new Response(
            JSON.stringify({
              success: true,
              response: "Here's the Phenytoin molecule! It's an anticonvulsant medication used to treat epilepsy.",
              molecule: EXAMPLE_MOLECULES.phenytoin,
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
        
        if (lowerMessage.includes("caffeine")) {
          return new Response(
            JSON.stringify({
              success: true,
              response: "Here's the Caffeine molecule! It's a central nervous system stimulant.",
              molecule: EXAMPLE_MOLECULES.caffeine,
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }

        // If molecule is provided, chat about it
        if (molecule) {
          const response = await ai.chatAboutMolecule(molecule, message);
          return new Response(
            JSON.stringify({ success: true, response }),
            { headers: { "Content-Type": "application/json" } }
          );
        }

        // Try to generate from prompt
        try {
          const generatedMolecule = await ai.generateMolecule(message);
          return new Response(
            JSON.stringify({
              success: true,
              response: `Generated ${generatedMolecule.name}!`,
              molecule: generatedMolecule,
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch {
          return new Response(
            JSON.stringify({
              success: true,
              response:
                "I can help you visualize molecules! Try: 'show me water', 'create caffeine', or 'phenytoin molecule'",
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: (error as Error).message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // API: Get example molecules
    if (url.pathname === "/api/examples") {
      return new Response(JSON.stringify({ examples: EXAMPLE_MOLECULES }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Serve static files
    const filePath = url.pathname === "/" ? "/index.html" : url.pathname;

    try {
      const file = Bun.file(`./public${filePath}`);
      if (await file.exists()) {
        return new Response(file);
      }

      // Try parent directory
      const parentFile = Bun.file(`../..${filePath}`);
      if (await parentFile.exists()) {
        return new Response(parentFile);
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`
========================================
🚀 LangChain Chat UI Server Running!
========================================
URL: http://localhost:${server.port}

📖 Copy the WASM files:
   cp -r ../../ui/pkg ./public/

Then open http://localhost:${server.port}
========================================
`);
