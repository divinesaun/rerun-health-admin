import { Medicine } from "@/types/pharmacy";

export const MEDICINE_SUGGESTIONS = [
  "Paracetamol 500mg",
  "Amoxicillin 250mg",
  "Amoxicillin 500mg",
  "Norvasc 5mg",
  "Metformin 500mg",
  "Ibuprofen 400mg",
  "Ciprofloxacin 500mg",
  "Omeprazole 20mg",
  "Atenolol 50mg",
  "Losartan 50mg",
  "Diclofenac 50mg",
  "Azithromycin 500mg",
  "Doxycycline 100mg",
  "Fluconazole 150mg",
  "Cetirizine 10mg",
  "Hydrochlorothiazide 25mg",
  "Amlodipine 5mg",
  "Simvastatin 20mg",
  "Salbutamol Inhaler",
  "Prednisolone 5mg",
];

export const INITIAL_MEDICINES: Medicine[] = [
  { id: "1", name: "Paracetamol 500mg", genericName: "Acetaminophen", price: 1.5, inStock: true, quantity: "50+", searches: 47, updatedAt: new Date(Date.now() - 2 * 86400000) },
  { id: "2", name: "Amoxicillin 250mg", genericName: "Amoxicillin", price: 5.0, inStock: false, quantity: "0", searches: 23, updatedAt: new Date(Date.now() - 18000000) },
  { id: "3", name: "Norvasc 5mg", genericName: "Amlodipine", price: 7.5, inStock: true, quantity: "20+", searches: 18, updatedAt: new Date(Date.now() - 3600000) },
  { id: "4", name: "Metformin 500mg", genericName: "Metformin", price: 3.0, inStock: true, quantity: "30+", searches: 15, updatedAt: new Date(Date.now() - 7200000) },
  { id: "5", name: "Ibuprofen 400mg", genericName: "Ibuprofen", price: 2.0, inStock: true, quantity: "10+", searches: 12, updatedAt: new Date(Date.now() - 86400000) },
  { id: "6", name: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin", price: 6.0, inStock: false, quantity: "0", searches: 11, updatedAt: new Date(Date.now() - 4 * 86400000) },
  { id: "7", name: "Omeprazole 20mg", genericName: "Omeprazole", price: 4.5, inStock: true, quantity: "5", searches: 9, updatedAt: new Date(Date.now() - 10800000) },
  { id: "8", name: "Losartan 50mg", genericName: "Losartan", price: 5.5, inStock: true, quantity: "10+", searches: 8, updatedAt: new Date(Date.now() - 2 * 86400000) },
  { id: "9", name: "Azithromycin 500mg", genericName: "Azithromycin", price: 8.0, inStock: false, quantity: "0", searches: 7, updatedAt: new Date(Date.now() - 5 * 86400000) },
  { id: "10", name: "Salbutamol Inhaler", genericName: "Salbutamol", price: 12.0, inStock: true, quantity: "10+", searches: 6, updatedAt: new Date(Date.now() - 3 * 86400000) },
];

export const QUANTITY_OPTIONS = ["0", "1-5", "5", "10+", "20+", "30+", "50+", "100+"];
