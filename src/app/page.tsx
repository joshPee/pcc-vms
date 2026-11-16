import { redirect } from 'next/navigation';

export default function Home() {
  // Default route points directly to guard station portal
  redirect('/guard');
}
