// SurrealDB client for molecule data queries
import Surreal from "surrealdb.js";

export interface MoleculeData {
  id?: string;
  name: string;
  formula?: string;
  smiles?: string;
  atoms: Array<{
    element: string;
    x: number;
    y: number;
    z: number;
  }>;
  bonds: Array<{
    atom1_idx: number;
    atom2_idx: number;
    bond_type: number;
  }>;
}

export class MoleculeDB {
  private db: Surreal;
  private connected: boolean = false;

  constructor(private endpoint: string = "ws://localhost:8000/rpc") {
    this.db = new Surreal();
  }

  async connect(namespace: string = "mol3d", database: string = "molecules") {
    try {
      await this.db.connect(this.endpoint);
      await this.db.use({ namespace, database });
      this.connected = true;
      console.log("Connected to SurrealDB");
    } catch (error) {
      console.error("Failed to connect to SurrealDB:", error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connected) {
      await this.db.close();
      this.connected = false;
    }
  }

  async createMolecule(molecule: MoleculeData): Promise<MoleculeData[]> {
    if (!this.connected) throw new Error("Not connected to database");
    
    const result = await this.db.create("molecule", molecule);
    return result as MoleculeData[];
  }

  async getMoleculeByName(name: string): Promise<MoleculeData | null> {
    if (!this.connected) throw new Error("Not connected to database");
    
    const results = await this.db.query<MoleculeData[]>(
      "SELECT * FROM molecule WHERE name = $name LIMIT 1",
      { name }
    );
    
    return results[0]?.[0] || null;
  }

  async getMoleculeById(id: string): Promise<MoleculeData | null> {
    if (!this.connected) throw new Error("Not connected to database");
    
    const result = await this.db.select<MoleculeData>(id);
    return result || null;
  }

  async searchMolecules(query: string): Promise<MoleculeData[]> {
    if (!this.connected) throw new Error("Not connected to database");
    
    const results = await this.db.query<MoleculeData[]>(
      `SELECT * FROM molecule WHERE 
       name ~ $query OR 
       formula ~ $query OR 
       smiles ~ $query`,
      { query }
    );
    
    return results[0] || [];
  }

  async listAllMolecules(): Promise<MoleculeData[]> {
    if (!this.connected) throw new Error("Not connected to database");
    
    const results = await this.db.select<MoleculeData[]>("molecule");
    return results || [];
  }

  async updateMolecule(id: string, data: Partial<MoleculeData>): Promise<MoleculeData> {
    if (!this.connected) throw new Error("Not connected to database");
    
    const result = await this.db.merge(id, data);
    return result as MoleculeData;
  }

  async deleteMolecule(id: string): Promise<void> {
    if (!this.connected) throw new Error("Not connected to database");
    await this.db.delete(id);
  }
}
