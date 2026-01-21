// Dosya: lib/shopier.ts
import { Shopier } from 'shopier-api';

// Hazır bir değişken (const) yerine, her çağrıldığında
// yeni bir Shopier örneği döndüren bir fonksiyon yazıyoruz.
export const createShopier = () => {
  return new Shopier(
    process.env.SHOPIER_API_KEY!,
    process.env.SHOPIER_API_SECRET!
  );
};