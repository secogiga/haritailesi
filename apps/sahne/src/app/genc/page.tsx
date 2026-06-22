import { redirect } from 'next/navigation';

// Haritailesi Genç sayfası esas olarak web'de (haritailesi.org/genc) yayınlanır.
// Sahne'deki /genc isteği oraya yönlendirilir.
const WEB_URL = process.env['NEXT_PUBLIC_WEB_URL'] ?? 'https://haritailesi.org';

export default function GencRedirect() {
  redirect(`${WEB_URL}/genc`);
}
