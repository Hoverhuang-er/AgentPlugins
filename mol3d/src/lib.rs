use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{console, HtmlCanvasElement};

/// Represents an atom in 3D space
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Atom {
    pub element: String,
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub color: [u8; 3],
}

/// Represents a bond between two atoms
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bond {
    pub atom1_idx: usize,
    pub atom2_idx: usize,
    pub bond_type: u8, // 1=single, 2=double, 3=triple
}

/// Molecule structure containing atoms and bonds
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Molecule {
    pub name: String,
    pub atoms: Vec<Atom>,
    pub bonds: Vec<Bond>,
}

impl Molecule {
    /// Create a new empty molecule
    pub fn new(name: String) -> Self {
        Self {
            name,
            atoms: Vec::new(),
            bonds: Vec::new(),
        }
    }

    /// Add an atom to the molecule
    pub fn add_atom(&mut self, element: String, x: f64, y: f64, z: f64) {
        let color = Self::element_to_color(&element);
        self.atoms.push(Atom {
            element,
            x,
            y,
            z,
            color,
        });
    }

    /// Add a bond between two atoms
    pub fn add_bond(&mut self, atom1_idx: usize, atom2_idx: usize, bond_type: u8) {
        self.bonds.push(Bond {
            atom1_idx,
            atom2_idx,
            bond_type,
        });
    }

    /// Get color for element (CPK coloring scheme)
    fn element_to_color(element: &str) -> [u8; 3] {
        match element {
            "H" => [255, 255, 255],  // White
            "C" => [144, 144, 144],  // Gray
            "N" => [48, 80, 248],    // Blue
            "O" => [255, 13, 13],    // Red
            "S" => [255, 255, 48],   // Yellow
            "P" => [255, 128, 0],    // Orange
            "F" => [144, 224, 80],   // Light green
            "Cl" => [31, 240, 31],   // Green
            "Br" => [166, 41, 41],   // Brown
            _ => [255, 20, 147],     // Deep pink (default)
        }
    }

    /// Convert molecule to JSON string
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }

    /// Parse molecule from JSON string
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
}

/// WASM interface for the molecule viewer
#[wasm_bindgen]
pub struct MolViewer {
    molecule: Option<Molecule>,
    canvas_id: String,
}

#[wasm_bindgen]
impl MolViewer {
    /// Create a new molecule viewer
    #[wasm_bindgen(constructor)]
    pub fn new(canvas_id: String) -> Self {
        console::log_1(&"MolViewer initialized".into());
        Self {
            molecule: None,
            canvas_id,
        }
    }

    /// Load molecule from JSON string
    #[wasm_bindgen]
    pub fn load_molecule(&mut self, json: String) -> Result<(), JsValue> {
        match Molecule::from_json(&json) {
            Ok(mol) => {
                console::log_1(&format!("Loaded molecule: {}", mol.name).into());
                self.molecule = Some(mol);
                Ok(())
            }
            Err(e) => Err(JsValue::from_str(&format!("Failed to parse molecule: {}", e))),
        }
    }

    /// Create a sample water molecule
    #[wasm_bindgen]
    pub fn create_water_molecule(&mut self) {
        let mut mol = Molecule::new("Water (H2O)".to_string());
        
        // Add atoms
        mol.add_atom("O".to_string(), 0.0, 0.0, 0.0);
        mol.add_atom("H".to_string(), 0.96, 0.0, 0.0);
        mol.add_atom("H".to_string(), -0.24, 0.93, 0.0);
        
        // Add bonds
        mol.add_bond(0, 1, 1); // O-H single bond
        mol.add_bond(0, 2, 1); // O-H single bond
        
        self.molecule = Some(mol);
        console::log_1(&"Created water molecule".into());
    }

    /// Render the molecule to canvas
    #[wasm_bindgen]
    pub fn render(&self) -> Result<(), JsValue> {
        let window = web_sys::window().ok_or("No window found")?;
        let document = window.document().ok_or("No document found")?;
        
        let canvas = document
            .get_element_by_id(&self.canvas_id)
            .ok_or("Canvas not found")?
            .dyn_into::<HtmlCanvasElement>()?;
        
        let context = canvas
            .get_context("2d")?
            .ok_or("Failed to get 2d context")?
            .dyn_into::<web_sys::CanvasRenderingContext2d>()?;
        
        // Clear canvas
        context.clear_rect(0.0, 0.0, canvas.width() as f64, canvas.height() as f64);
        
        if let Some(mol) = &self.molecule {
            let center_x = canvas.width() as f64 / 2.0;
            let center_y = canvas.height() as f64 / 2.0;
            let scale = 100.0;
            
            // Draw bonds first
            context.set_line_width(2.0);
            context.set_stroke_style(&JsValue::from_str("#666666"));
            
            for bond in &mol.bonds {
                if let (Some(atom1), Some(atom2)) = 
                    (mol.atoms.get(bond.atom1_idx), mol.atoms.get(bond.atom2_idx)) {
                    context.begin_path();
                    context.move_to(center_x + atom1.x * scale, center_y + atom1.y * scale);
                    context.line_to(center_x + atom2.x * scale, center_y + atom2.y * scale);
                    context.stroke();
                }
            }
            
            // Draw atoms
            for atom in &mol.atoms {
                let color = format!(
                    "rgb({}, {}, {})",
                    atom.color[0], atom.color[1], atom.color[2]
                );
                context.set_fill_style(&JsValue::from_str(&color));
                
                context.begin_path();
                context.arc(
                    center_x + atom.x * scale,
                    center_y + atom.y * scale,
                    20.0,
                    0.0,
                    2.0 * std::f64::consts::PI,
                )?;
                context.fill();
                
                // Draw element label
                context.set_fill_style(&JsValue::from_str("#000000"));
                context.set_font("14px Arial");
                context.fill_text(
                    &atom.element,
                    center_x + atom.x * scale - 5.0,
                    center_y + atom.y * scale + 5.0,
                )?;
            }
        }
        
        Ok(())
    }

    /// Get molecule as JSON string
    #[wasm_bindgen]
    pub fn get_molecule_json(&self) -> Result<String, JsValue> {
        match &self.molecule {
            Some(mol) => mol
                .to_json()
                .map_err(|e| JsValue::from_str(&format!("Failed to serialize: {}", e))),
            None => Err(JsValue::from_str("No molecule loaded")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_molecule() {
        let mut mol = Molecule::new("Test".to_string());
        mol.add_atom("C".to_string(), 0.0, 0.0, 0.0);
        assert_eq!(mol.atoms.len(), 1);
    }

    #[test]
    fn test_json_serialization() {
        let mut mol = Molecule::new("Test".to_string());
        mol.add_atom("C".to_string(), 1.0, 2.0, 3.0);
        
        let json = mol.to_json().unwrap();
        let mol2 = Molecule::from_json(&json).unwrap();
        
        assert_eq!(mol.name, mol2.name);
        assert_eq!(mol.atoms.len(), mol2.atoms.len());
    }
}
