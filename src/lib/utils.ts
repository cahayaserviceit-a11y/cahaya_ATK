export function terbilang(n: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  
  function toWords(num: number): string {
    if (num < 12) return bilangan[num];
    if (num < 20) return toWords(num - 10) + ' Belas';
    if (num < 100) return toWords(Math.floor(num / 10)) + ' Puluh ' + toWords(num % 10);
    if (num < 200) return 'Seratus ' + toWords(num - 100);
    if (num < 1000) return toWords(Math.floor(num / 100)) + ' Ratus ' + toWords(num % 100);
    if (num < 2000) return 'Seribu ' + toWords(num - 1000);
    if (num < 1000000) return toWords(Math.floor(num / 1000)) + ' Ribu ' + toWords(num % 1000);
    if (num < 1000000000) return toWords(Math.floor(num / 1000000)) + ' Juta ' + toWords(num % 1000000);
    if (num < 1000000000000) return toWords(Math.floor(num / 1000000000)) + ' Miliar ' + toWords(num % 1000000000);
    return '';
  }

  return toWords(Math.floor(Math.abs(n))).replace(/\s+/g, ' ').trim();
}
