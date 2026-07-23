import { redirect } from 'next/navigation';

/** Deutsche URL-Alias für DSBs — kanonische Seite ist `/privacy`. */
export default function DatenschutzAliasPage() {
  redirect('/privacy');
}
