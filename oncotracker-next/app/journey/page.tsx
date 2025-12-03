import { JourneyPageClient } from '@/components/JourneyPageClient';
import { loadDataset } from '@/lib/data-loader';
import { Metadata } from 'next';

interface PageProps {
    searchParams: Promise<{ patientId?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
    const params = await searchParams;
    const dataset = await loadDataset(params.patientId);
    const title = dataset.patientName
        ? `${dataset.patientName}'s Patient Journey`
        : 'Patient Journey';

    return {
        title: title,
    };
}

export default async function JourneyPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const dataset = await loadDataset(params.patientId);

    return (
        <JourneyPageClient dataset={dataset} />
    );
}
