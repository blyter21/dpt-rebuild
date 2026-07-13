import { permanentRedirect } from 'next/navigation';

export default function LegacyTournamentDetail({ params }: { params: { alias: string } }) {
  permanentRedirect(`/tournaments/${params.alias}`);
}
