export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  category: string;
  price: number;
  description?: string;
}
