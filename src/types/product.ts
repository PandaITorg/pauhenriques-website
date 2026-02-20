
export interface Product {
  id: string; // El ID del documento de Firestore
  name: string;
  description: string;
  images: string[];
  brand: 'carico' | 'wellme'; // Diferenciador clave para la lógica de negocio
  stock: number; // Esencial para productos 'wellme'
  price?: number; // Opcional, solo para productos 'wellme'
}
