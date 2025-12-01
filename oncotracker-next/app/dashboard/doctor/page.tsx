'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Plus, LogOut, FileSpreadsheet, Search, Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DoctorDashboard() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const [supabase] = useState(() => createClient());

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setUser(user);

            console.log('Fetching patients for doctor:', user.id);
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('assigned_doctor_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching patients:', JSON.stringify(error, null, 2));
                // Also log the raw error object just in case
                console.error('Raw error:', error);
            } else {
                setPatients(data || []);
            }
            setLoading(false);
        }

        loadData();
    }, [router, supabase]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navbar */}
            <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center text-white">
                        <Activity className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-slate-800 text-lg">OncoTracker <span className="text-emerald-600 text-xs ml-1 bg-emerald-100 px-2 py-0.5 rounded-full">Provider</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-slate-600 text-sm">Dr. {user?.user_metadata?.full_name || 'SciX'}</span>
                    <Link href="/auth/logout">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600">
                            <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-900">My Patients</h1>
                    <Link href="/dashboard/doctor/add-patient">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                            <Plus className="w-4 h-4" /> Add Patient
                        </Button>
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search by name or MRN..." className="pl-10" />
                </div>

                {/* Patient List */}
                <div className="grid gap-4">
                    {patients && patients.length > 0 ? (
                        patients.map((patient) => (
                            <Card key={patient.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                            {patient.family_name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">
                                                {patient.family_name} {patient.given_name}
                                            </h3>
                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <span>{patient.mrn}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span>{patient.active ? 'Active' : 'Inactive'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="text-right mr-4 hidden md:block">
                                            <div className="text-xs text-slate-400">Date Added</div>
                                            <div className="text-sm font-medium text-slate-700">
                                                {new Date(patient.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Link href={`/journey?patientId=${patient.id}`}>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Activity className="w-4 h-4" /> View Journey
                                            </Button>
                                        </Link>
                                        <Link href={`/manage-data?patientId=${patient.id}`}>
                                            <Button variant="outline" size="sm" className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
                                                <FileSpreadsheet className="w-4 h-4" /> Edit Data
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
                                                    // Optimistic update or reload
                                                    const { deletePatientAction } = await import('@/app/actions/patient-actions');
                                                    const result = await deletePatientAction(patient.id);
                                                    if (result.success) {
                                                        // Refresh data
                                                        setPatients(prev => prev.filter(p => p.id !== patient.id));
                                                    } else {
                                                        alert('Failed to delete patient: ' + result.error);
                                                    }
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
                            <p className="text-slate-500 mb-4">No patients found.</p>
                            <Link href="/dashboard/doctor/add-patient">
                                <Button variant="outline">Add your first patient</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
