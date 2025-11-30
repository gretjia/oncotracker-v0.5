import { JourneyPageClient } from '@/components/JourneyPageClient';
import { loadDataset } from '@/lib/data-loader';

export default async function JourneyPage() {
    const dataset = await loadDataset();

    return (
        <JourneyPageClient dataset={dataset} />
    );
}
