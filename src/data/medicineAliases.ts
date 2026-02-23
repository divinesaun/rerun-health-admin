/**
 * Medicine alias mapping for search expansion (client-side).
 *
 * Maps generic names to their brand/regional equivalents.
 * Used to help pharmacy owners find medicines when adding to inventory.
 */

export const MEDICINE_ALIASES: Record<string, string[]> = {
  // Pain / Fever
  paracetamol: ["panado", "tylenol", "acetaminophen", "calpol", "panadol"],
  ibuprofen: ["brufen", "advil", "nurofen", "motrin", "ibupain"],
  aspirin: ["disprin", "ecotrin", "bayer aspirin"],
  diclofenac: ["voltaren", "cataflam", "voltarol", "diclac"],
  naproxen: ["naprosyn", "aleve"],
  tramadol: ["tramal", "ultram", "zydol"],

  // Antibiotics
  amoxicillin: ["amoxil", "augmentin", "clavamox"],
  azithromycin: ["zithromax", "azithral"],
  ciprofloxacin: ["cipro", "ciproxin"],
  metronidazole: ["flagyl", "metrogyl"],
  doxycycline: ["vibramycin", "doryx"],
  flucloxacillin: ["floxapen", "fluclox"],
  erythromycin: ["erythrocin", "eryc"],
  cephalexin: ["keflex", "cefalexin"],
  cotrimoxazole: ["bactrim", "septrin"],

  // Stomach / GI
  omeprazole: ["losec", "prilosec", "nexium"],
  ranitidine: ["zantac", "rantec"],
  loperamide: ["imodium", "lomotil"],
  buscopan: ["hyoscine"],
  metoclopramide: ["maxolon", "plasil"],
  domperidone: ["motilium", "vomistop"],

  // Allergy
  cetirizine: ["zyrtec", "allertec"],
  loratadine: ["claritin", "clarityn"],
  chlorphenamine: ["piriton", "chlorpheniramine"],

  // Blood Pressure / Heart
  amlodipine: ["norvasc", "amlopress"],
  atenolol: ["tenormin"],
  losartan: ["cozaar"],
  enalapril: ["renitec", "vasotec"],
  simvastatin: ["zocor", "simvacor"],
  atorvastatin: ["lipitor", "atorva"],

  // Diabetes
  metformin: ["glucophage", "glycomet"],
  glibenclamide: ["daonil", "glyburide"],
  insulin: ["humulin", "novorapid", "lantus"],

  // Respiratory
  salbutamol: ["ventolin", "airomir", "albuterol"],
  bromhexine: ["bisolvon"],
  montelukast: ["singulair"],
  prednisolone: ["prelone", "deltacortril"],

  // Skin
  hydrocortisone: ["cortaid", "locoid"],
  clotrimazole: ["canesten"],
  fluconazole: ["diflucan"],
  acyclovir: ["zovirax", "aciclovir"],

  // Vitamins
  "vitamin c": ["ascorbic acid", "redoxon"],
  "folic acid": ["folate"],
  calcium: ["caltrate", "oscal"],
};

// Build reverse map: alias → generic
const reverseMap = new Map<string, string>();
for (const [generic, aliases] of Object.entries(MEDICINE_ALIASES)) {
  reverseMap.set(generic, generic);
  for (const alias of aliases) {
    reverseMap.set(alias.toLowerCase(), generic);
  }
}

/**
 * Expand a search query to include all known aliases.
 * e.g. "panado" → ["panado", "paracetamol", "tylenol", ...]
 */
export function expandMedicineSearch(query: string): string[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  // Check if it's a generic name
  if (MEDICINE_ALIASES[normalized]) {
    return [normalized, ...MEDICINE_ALIASES[normalized]];
  }

  // Check if it's an alias
  const generic = reverseMap.get(normalized);
  if (generic) {
    return [normalized, generic, ...(MEDICINE_ALIASES[generic] ?? []).filter((a) => a !== normalized)];
  }

  return [normalized];
}
