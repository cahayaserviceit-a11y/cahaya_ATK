import { Order, Profile } from '../../types';

export interface DocumentData {
  order: Order;
  seller: Profile;
  buyer: Profile | null;
}

export interface DocumentGenerator {
  generate: (data: DocumentData) => Promise<any>;
}

export const formatCurrency = (num: number) => `Rp. ${num.toLocaleString('id-ID')}`;
export const formatDate = (date: string | Date) => new Date(date).toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

export const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};
