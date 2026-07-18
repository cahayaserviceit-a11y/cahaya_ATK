export const LOGO_SVG = `
<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="200" cy="460" rx="140" ry="15" fill="#000" opacity="0.05"/>
  <path d="M100 160 Q200 130 300 160 L335 400 Q200 460 65 400 Z" fill="#0071BC"/>
  <path d="M155 160 V125 C155 90 245 90 245 125 V160" fill="none" stroke="#0071BC" stroke-width="24" stroke-linecap="round"/>
  <path d="M155 160 V135 C155 110 245 110 245 135 V160" fill="none" stroke="#005A96" stroke-width="24" stroke-linecap="round" opacity="0.3"/>
  <g transform="rotate(10, 270, 150)">
    <rect x="250" y="60" width="50" height="150" rx="4" fill="#FFC107"/>
    <line x1="260" y1="85" x2="290" y2="85" stroke="#E6A700" stroke-width="3"/>
    <line x1="260" y1="110" x2="290" y2="110" stroke="#E6A700" stroke-width="3"/>
    <line x1="260" y1="135" x2="290" y2="135" stroke="#E6A700" stroke-width="3"/>
  </g>
  <g transform="rotate(-5, 130, 150)">
    <path d="M115 110 L135 110 L140 160 L110 160 Z" fill="#FFCCBC"/>
    <path d="M115 110 L125 70 L135 110 Z" fill="#0071BC"/>
    <rect x="110" y="150" width="30" height="60" fill="#2E7D32"/>
    <rect x="117" y="150" width="16" height="60" fill="#4CAF50"/>
  </g>
  <path d="M60 175 L200 200 V445 L60 405 Z" fill="#4CAF50"/>
  <path d="M200 200 L340 175 L340 405 L200 445 Z" fill="#2E7D32"/>
  <path d="M60 175 Q200 210 340 175 L340 185 Q200 220 60 185 Z" fill="#FFFFFF"/>
  <g transform="translate(10, 10)">
    <path d="M90 255 Q145 230 190 255 Q235 230 290 255 L290 380 Q235 355 190 380 Q145 355 90 380 Z" fill="none" stroke="#FFFFFF" stroke-width="18" stroke-linejoin="round"/>
    <line x1="190" y1="265" x2="190" y2="380" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
    <path d="M175 385 Q190 370 205 385" fill="#FFFFFF" />
  </g>
</svg>
`;

export const getLogoDataUrl = async (width = 400, height = 500): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svg = new Blob([LOGO_SVG], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svg);
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
};
