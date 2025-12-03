'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createPatientAction, parseAndMapUpload } from '../../../actions/patient-actions';

export default function AddPatientPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [mappingResult, setMappingResult] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setMappingResult(null); // Reset previous result

        // Trigger analysis
        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const result = await parseAndMapUpload(formData);
            if (result.success) {
                setMappingResult(result);
            } else {
                console.error('Analysis failed:', result.error);
                // Don't block upload, just show warning or ignore
            }
        } catch (err) {
            console.error('Analysis error:', err);
        } finally {
            setIsAnalyzing(false);
        }
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError('');

        try {
            // If we have a mapping result, we should ideally pass it to the create action
            // For now, we just pass the file as before, assuming the backend will handle it
            // or we might need to update createPatientAction to accept the mapping.
            // But the plan says "The Code uses this schema to actually read and parse the file."
            // So we should probably pass the mapping as a hidden field or separate argument.

            if (mappingResult) {
                formData.append('mapping', JSON.stringify(mappingResult.mapping));
            }

            const result = await createPatientAction(formData);
            if (result.success) {
                router.push('/dashboard/doctor');
            } else {
                setError(result.error || 'Failed to create patient');
            }
        } catch (e) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6 flex items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/dashboard/doctor">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <CardTitle>Add New Patient</CardTitle>
                    </div>
                    <CardDescription>
                        Register a new patient. Upload a file to automatically map data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name (姓名)</Label>
                            <Input id="fullName" name="fullName" placeholder="e.g. Zhang Li" required />
                        </div>

                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <Label htmlFor="dataset">Upload Initial Dataset (Optional)</Label>
                            <Input
                                id="dataset"
                                name="dataset"
                                type="file"
                                accept=".xlsx, .xls, .csv, .json"
                                onChange={handleFileChange}
                            />
                            <p className="text-xs text-slate-500">
                                Supported formats: .xlsx, .csv, .json.
                            </p>
                        </div>

                        {isAnalyzing && (
                            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing file structure with AI...
                            </div>
                        )}

                        {mappingResult && (
                            <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded border border-emerald-100">
                                <p className="font-bold mb-1">AI Analysis Complete:</p>
                                <ul className="list-disc pl-4 space-y-0.5 text-xs">
                                    <li>Date Column: <strong>{mappingResult.mapping.date_col}</strong></li>
                                    <li>Metrics Found: <strong>{Object.keys(mappingResult.mapping.metrics || {}).length}</strong></li>
                                    <li>Events Found: <strong>{mappingResult.mapping.events?.length || 0}</strong></li>
                                </ul>
                                <p className="mt-2 text-xs italic">Mapping will be applied on save.</p>
                            </div>
                        )}

                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading || isAnalyzing}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                                </>
                            ) : (
                                'Create Patient Account'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
