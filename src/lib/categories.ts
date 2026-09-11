export const CATEGORIES_TAXONOMY: Record<string, string[]> = {
  "Furniture": [
    "Office Desks",
    "Ergonomic Chairs",
    "Conference Tables",
    "Cupboards & Storage",
    "Workstations",
    "Reception & Lounge"
  ],
  "Construction": [
    "Cement & Concrete",
    "Steel & Rebar",
    "Tiles & Flooring",
    "Bricks & Blocks",
    "Electrical Materials",
    "Plumbing & Pipes",
    "Paints & Coatings"
  ],
  "IT Hardware & Electronics": [
    "Laptops & PCs",
    "Monitors & Displays",
    "Networking Gear",
    "Printers & Scanners",
    "Servers & Storage",
    "Cables & Accessories"
  ],
  "Office Supplies": [
    "Paper & Stationery",
    "Ink & Toner",
    "Breakroom & Pantry",
    "Janitorial & Cleaning"
  ],
  "Manufacturing & Raw Materials": [
    "Metals & Alloys",
    "Plastics & Polymers",
    "Packaging Materials",
    "Chemicals & Industrial Solvents"
  ],
  "Services": [
    "Logistics & Shipping",
    "Maintenance & Facility Management",
    "IT Services & Consulting",
    "Security & Surveillance"
  ]
};

export const CATEGORY_NAMES = Object.keys(CATEGORIES_TAXONOMY);

export const CATEGORY_GST_RATES: Record<string, number> = {
  "Furniture": 18,
  "Construction": 28,
  "IT Hardware & Electronics": 18,
  "Office Supplies": 12,
  "Manufacturing & Raw Materials": 18,
  "Services": 18,
};

export function getCategoryGstRate(category?: string | null): number {
  if (!category) return 18;
  return CATEGORY_GST_RATES[category] ?? 18;
}
