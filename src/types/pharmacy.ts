export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  price: number;
  inStock: boolean;
  quantity: string;
  searches: number;
  updatedAt: Date;
}

export type TabType = "dashboard" | "inventory" | "profile" | "analytics" | "inquiries" | "account" | "help";
