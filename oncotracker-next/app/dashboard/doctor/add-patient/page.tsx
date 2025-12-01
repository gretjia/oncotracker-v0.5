'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createPatientAction } from '../../../actions/patient-actions';

export default function AddPatientPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError('');

        try {
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
        <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
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
                        Register a new patient to your caseload. This will create a patient account.
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
                            <Input id="dataset" name="dataset" type="file" accept=".xlsx, .xls, .csv, .json" />
                            <p className="text-xs text-slate-500">
                                Supported formats: .xlsx, .csv, .json. This will be imported into the patient's record.
                            </p>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
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
