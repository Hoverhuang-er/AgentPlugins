// LangChain Chat Handler with Mol3D Integration
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

export interface MoleculeData {
  name: string;
  formula: string;
  smiles?: string;
  atoms: Array<{
    element: string;
    x: number;
    y: number;
    z: number;
    color: [number, number, number];
  }>;
  bonds: Array<{
    atom1_idx: number;
    atom2_idx: number;
    bond_type: number;
  }>;
}

export class MoleculeAI {
  private llm: ChatOpenAI;

  constructor(apiKey?: string) {
    this.llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
      openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async generateMolecule(prompt: string): Promise<MoleculeData> {
    const template = PromptTemplate.fromTemplate(`
You are a chemistry expert. Generate a JSON representation of a molecule based on the user's description.

The JSON must have this exact structure:
{{
  "name": "Molecule Name",
  "formula": "Chemical Formula",
  "smiles": "SMILES notation (optional)",
  "atoms": [
    {{"element": "C", "x": 0.0, "y": 0.0, "z": 0.0, "color": [144, 144, 144]}},
    {{"element": "O", "x": 1.2, "y": 0.0, "z": 0.0, "color": [255, 13, 13]}}
  ],
  "bonds": [
    {{"atom1_idx": 0, "atom2_idx": 1, "bond_type": 1}}
  ]
}}

Color guide (CPK):
- H: [255, 255, 255] (white)
- C: [144, 144, 144] (gray)
- N: [48, 80, 248] (blue)
- O: [255, 13, 13] (red)
- S: [255, 255, 48] (yellow)
- P: [255, 128, 0] (orange)

User request: {prompt}

Generate only the JSON, no other text:
`);

    const formattedPrompt = await template.format({ prompt });
    const response = await this.llm.invoke(formattedPrompt);

    // Extract JSON from response
    let jsonStr = response.content as string;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    try {
      const moleculeData = JSON.parse(jsonStr) as MoleculeData;
      return moleculeData;
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      throw new Error("Failed to generate molecule from prompt");
    }
  }

  async chatAboutMolecule(
    molecule: MoleculeData,
    question: string
  ): Promise<string> {
    const template = PromptTemplate.fromTemplate(`
You are a chemistry expert. Answer questions about the following molecule:

Molecule: {name}
Formula: {formula}
${molecule.smiles ? `SMILES: ${molecule.smiles}` : ""}
Number of atoms: {atomCount}
Number of bonds: {bondCount}

Question: {question}

Provide a clear, concise answer:
`);

    const formattedPrompt = await template.format({
      name: molecule.name,
      formula: molecule.formula,
      atomCount: molecule.atoms.length,
      bondCount: molecule.bonds.length,
      question,
    });

    const response = await this.llm.invoke(formattedPrompt);
    return response.content as string;
  }
}

// Pre-built molecule examples
export const EXAMPLE_MOLECULES: Record<string, MoleculeData> = {
  water: {
    name: "Water",
    formula: "H2O",
    smiles: "O",
    atoms: [
      { element: "O", x: 0, y: 0, z: 0, color: [255, 13, 13] },
      { element: "H", x: 0.96, y: 0, z: 0, color: [255, 255, 255] },
      { element: "H", x: -0.24, y: 0.93, z: 0, color: [255, 255, 255] },
    ],
    bonds: [
      { atom1_idx: 0, atom2_idx: 1, bond_type: 1 },
      { atom1_idx: 0, atom2_idx: 2, bond_type: 1 },
    ],
  },
  
  phenytoin: {
    name: "Phenytoin (Diphenylhydantoin)",
    formula: "C15H12N2O2",
    smiles: "CN1C(=NC(C1=O)(c2ccccc2)c3ccccc3)N",
    atoms: [
      { element: "C", x: 0, y: 0, z: 0, color: [144, 144, 144] },
      { element: "N", x: 1.2, y: 0.5, z: 0, color: [48, 80, 248] },
      { element: "C", x: 2.0, y: -0.5, z: 0, color: [144, 144, 144] },
      { element: "N", x: 1.5, y: -1.7, z: 0, color: [48, 80, 248] },
      { element: "C", x: 0.2, y: -1.4, z: 0, color: [144, 144, 144] },
      { element: "O", x: -0.8, y: -2.2, z: 0, color: [255, 13, 13] },
      { element: "C", x: 3.5, y: -0.3, z: 0, color: [144, 144, 144] },
      { element: "C", x: 4.3, y: -1.4, z: 0, color: [144, 144, 144] },
      { element: "C", x: -1.0, y: 0.8, z: 0, color: [144, 144, 144] },
      { element: "C", x: -1.8, y: -0.3, z: 0, color: [144, 144, 144] },
      { element: "C", x: 2.0, y: -2.9, z: 0, color: [144, 144, 144] },
    ],
    bonds: [
      { atom1_idx: 0, atom2_idx: 1, bond_type: 1 },
      { atom1_idx: 1, atom2_idx: 2, bond_type: 2 },
      { atom1_idx: 2, atom2_idx: 3, bond_type: 1 },
      { atom1_idx: 3, atom2_idx: 4, bond_type: 1 },
      { atom1_idx: 4, atom2_idx: 0, bond_type: 1 },
      { atom1_idx: 4, atom2_idx: 5, bond_type: 2 },
      { atom1_idx: 2, atom2_idx: 6, bond_type: 1 },
      { atom1_idx: 6, atom2_idx: 7, bond_type: 1 },
      { atom1_idx: 0, atom2_idx: 8, bond_type: 1 },
      { atom1_idx: 8, atom2_idx: 9, bond_type: 1 },
      { atom1_idx: 3, atom2_idx: 10, bond_type: 1 },
    ],
  },

  caffeine: {
    name: "Caffeine",
    formula: "C8H10N4O2",
    smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    atoms: [
      { element: "C", x: 0, y: 0, z: 0, color: [144, 144, 144] },
      { element: "N", x: 1.3, y: 0, z: 0, color: [48, 80, 248] },
      { element: "C", x: 2.0, y: 1.2, z: 0, color: [144, 144, 144] },
      { element: "N", x: 1.2, y: 2.3, z: 0, color: [48, 80, 248] },
      { element: "C", x: -0.1, y: 1.8, z: 0, color: [144, 144, 144] },
      { element: "C", x: -0.5, y: 0.5, z: 0, color: [144, 144, 144] },
      { element: "O", x: -1.8, y: 0.2, z: 0, color: [255, 13, 13] },
      { element: "N", x: 3.3, y: 1.3, z: 0, color: [48, 80, 248] },
      { element: "C", x: 3.8, y: 2.6, z: 0, color: [144, 144, 144] },
      { element: "O", x: 5.0, y: 2.8, z: 0, color: [255, 13, 13] },
    ],
    bonds: [
      { atom1_idx: 0, atom2_idx: 1, bond_type: 1 },
      { atom1_idx: 1, atom2_idx: 2, bond_type: 1 },
      { atom1_idx: 2, atom2_idx: 3, bond_type: 2 },
      { atom1_idx: 3, atom2_idx: 4, bond_type: 1 },
      { atom1_idx: 4, atom2_idx: 5, bond_type: 2 },
      { atom1_idx: 5, atom2_idx: 0, bond_type: 1 },
      { atom1_idx: 5, atom2_idx: 6, bond_type: 1 },
      { atom1_idx: 2, atom2_idx: 7, bond_type: 1 },
      { atom1_idx: 7, atom2_idx: 8, bond_type: 1 },
      { atom1_idx: 8, atom2_idx: 9, bond_type: 2 },
    ],
  },
};
