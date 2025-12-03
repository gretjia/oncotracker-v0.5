import { JourneyPageClient } from '@/components/JourneyPageClient';
import { loadDataset } from '@/lib/data-loader';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const dataset = await loadDataset();
    const title = dataset.patientName
        ? `${dataset.patientName}'s Patient Journey`
        : 'Patient Journey';

    return {
        title: title,
    };
}

export default async function JourneyPage() {
    const dataset = await loadDataset();

    return (
        <JourneyPageClient dataset={dataset} />
    );
}
