// Main integration with LangChain Chat UI and WASM mol3d viewer
import init, { MolViewer } from "../pkg/mol3d.js";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { MoleculeDB, type MoleculeData } from "./database";

// Initialize WASM module
let wasmInitialized = false;

async function initWasm() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
    console.log("WASM module initialized");
  }
}

// Molecule viewer manager
export class Mol3DViewer {
  private viewer: MolViewer | null = null;
  private db: MoleculeDB;
  private llm: ChatOpenAI;

  constructor(
    canvasId: string,
    dbEndpoint: string = "ws://localhost:8000/rpc",
    openaiApiKey?: string
  ) {
    this.db = new MoleculeDB(dbEndpoint);
    this.llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: openaiApiKey || process.env.OPENAI_API_KEY,
    });
  }

  async initialize() {
    await initWasm();
    await this.db.connect();
    // Initialize viewer on client side only
    if (typeof window !== "undefined") {
      const { MolViewer } = await import("../pkg/mol3d.js");
      this.viewer = new MolViewer("mol3d-canvas");
    }
    console.log("Mol3DViewer initialized");
  }

  async cleanup() {
    await this.db.disconnect();
  }

  // Generate molecule data from natural language prompt using LangChain
  async generateMoleculeFromPrompt(prompt: string): Promise<MoleculeData> {
    const template = PromptTemplate.fromTemplate(`
You are a chemistry expert. Generate a JSON representation of a molecule based on the user's description.
The JSON should have this structure:
{{
  "name": "Molecule Name",
  "formula": "Chemical Formula",
  "smiles": "SMILES notation (optional)",
  "atoms": [
    {{"element": "C", "x": 0.0, "y": 0.0, "z": 0.0}},
    ...
  ],
  "bonds": [
    {{"atom1_idx": 0, "atom2_idx": 1, "bond_type": 1}},
    ...
  ]
}}

User request: {prompt}

Generate the molecule JSON:
`);

    const formattedPrompt = await template.format({ prompt });
    const response = await this.llm.invoke(formattedPrompt);
    
    try {
      // Extract JSON from response (handling markdown code blocks)
      let jsonStr = response.content as string;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      const moleculeData = JSON.parse(jsonStr) as MoleculeData;
      return moleculeData;
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      throw new Error("Failed to generate molecule from prompt");
    }
  }

  // Load and display molecule from database
  async loadMoleculeByName(name: string) {
    const molecule = await this.db.getMoleculeByName(name);
    if (!molecule) {
      throw new Error(`Molecule "${name}" not found in database`);
    }
    
    if (this.viewer) {
      const jsonStr = JSON.stringify(molecule);
      this.viewer.load_molecule(jsonStr);
      this.viewer.render();
    }
    
    return molecule;
  }

  // Save molecule to database
  async saveMolecule(molecule: MoleculeData) {
    return await this.db.createMolecule(molecule);
  }

  // Process user prompt: generate molecule and save to DB
  async processPrompt(prompt: string): Promise<MoleculeData> {
    console.log("Processing prompt:", prompt);
    
    // Generate molecule from prompt
    const molecule = await this.generateMoleculeFromPrompt(prompt);
    
    // Save to database
    await this.saveMolecule(molecule);
    
    // Render if viewer is available
    if (this.viewer) {
      const jsonStr = JSON.stringify(molecule);
      this.viewer.load_molecule(jsonStr);
      this.viewer.render();
    }
    
    console.log("Molecule generated and saved:", molecule.name);
    return molecule;
  }

  // Search molecules in database
  async searchMolecules(query: string) {
    return await this.db.searchMolecules(query);
  }

  // Render current molecule
  render() {
    if (this.viewer) {
      this.viewer.render();
    }
  }

  // Create example water molecule for testing
  createWaterExample() {
    if (this.viewer) {
      this.viewer.create_water_molecule();
      this.viewer.render();
    }
  }
}

// Example usage in LangChain chat UI integration
export async function createMol3DChat() {
  const viewer = new Mol3DViewer("mol3d-canvas");
  await viewer.initialize();

  return {
    viewer,
    
    // Handler for chat messages
    async handleMessage(message: string): Promise<string> {
      try {
        // Check if message is a molecule request
        if (
          message.toLowerCase().includes("molecule") ||
          message.toLowerCase().includes("show") ||
          message.toLowerCase().includes("create")
        ) {
          const molecule = await viewer.processPrompt(message);
          return `Generated and displaying molecule: ${molecule.name} (${molecule.formula})`;
        }
        
        // Check if message is a search request
        if (message.toLowerCase().includes("search")) {
          const results = await viewer.searchMolecules(message);
          return `Found ${results.length} molecules: ${results
            .map((m) => m.name)
            .join(", ")}`;
        }
        
        return "Please describe a molecule you'd like to visualize or search for.";
      } catch (error) {
        console.error("Error processing message:", error);
        return `Error: ${(error as Error).message}`;
      }
    },
    
    cleanup: () => viewer.cleanup(),
  };
}

// Export for browser usage
if (typeof window !== "undefined") {
  (window as any).Mol3DViewer = Mol3DViewer;
  (window as any).createMol3DChat = createMol3DChat;
}
