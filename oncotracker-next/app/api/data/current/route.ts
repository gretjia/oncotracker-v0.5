import { NextResponse } from 'next/server';
import { loadDataset } from '@/lib/data-loader';

export async function GET() {
    try {
        const dataset = await loadDataset();
        return NextResponse.json(dataset);
    } catch (error) {
        console.error("Error loading dataset:", error);
        return NextResponse.json({ error: "Failed to load dataset" }, { status: 500 });
    }
}
