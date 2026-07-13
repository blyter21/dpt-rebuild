import { permanentRedirect } from 'next/navigation';

export default function LegacyEventDetail({ params }: { params: { alias: string } }) {
  permanentRedirect(`/events/${params.alias}`);
}
