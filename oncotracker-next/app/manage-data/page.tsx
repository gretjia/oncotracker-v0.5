'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Save, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DataSpreadsheet } from '@/components/DataSpreadsheet';
import { loadDataset } from '@/lib/data-loader'; // We'll need a client-side friendly way or server action
import { FormalDataset } from '@/lib/types';

import { uploadData } from '@/app/actions/upload-data';

export default function ManageDataPage() {
    const [dataset, setDataset] = useState<FormalDataset | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch initial data
        // Since loadDataset is server-side, we should probably fetch via an API or Server Action.
        // For now, let's assume we fetch from an API route we'll create, or pass initial data from a Server Component wrapper.
        // To keep it simple for this step, I'll fetch from a new API endpoint.
        fetch('/api/data/current')
            .then(res => res.json())
            .then(data => {
                setDataset(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load data", err);
                setIsLoading(false);
            });
    }, []);



    // ... inside component

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const result = await uploadData(formData);
            console.log("Upload Result:", result);
            // TODO: Handle mapping result (show confirmation dialog?)
            // For now, just update the dataset view
            // Note: The result.dataset structure might need adjustment to match FormalDataset exactly
            // But for the spreadsheet view, it should be fine if we cast it or ensure structure.
            setDataset(result.dataset as any);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Upload failed: " + String(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        // TODO: Implement save logic
        console.log("Saving data...");
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Top Bar */}
            <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/journey" className="text-slate-500 hover:text-slate-900 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white shadow-sm">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <h1 className="font-bold text-slate-800">Data Manager</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                        />
                        <Button variant="outline" className="gap-2">
                            <Upload className="w-4 h-4" />
                            Upload Dataset
                        </Button>
                    </div>
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                        <Save className="w-4 h-4" />
                        Save Changes
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden p-4">
                <Card className="h-full flex flex-col overflow-hidden border-slate-300 shadow-sm">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            Loading dataset...
                        </div>
                    ) : dataset ? (
                        <DataSpreadsheet initialData={dataset} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
                            <FileSpreadsheet className="w-12 h-12 opacity-20" />
                            <p>No dataset loaded.</p>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
}
