'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Activity, Users, Search, Plus, LogOut, FileSpreadsheet } from 'lucide-react';

export default function DoctorDashboard() {
    // Mock Data
    const patients = [
        { id: 1, name: "Jane Doe", mrn: "MRN-8821", status: "Active Treatment", lastVisit: "Nov 28, 2024" },
        { id: 2, name: "John Smith", mrn: "MRN-9932", status: "Observation", lastVisit: "Oct 15, 2024" },
        { id: 3, name: "Emily Chen", mrn: "MRN-1102", status: "Post-Op", lastVisit: "Nov 30, 2024" },
    ];

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
                    <span className="text-slate-600 text-sm">Dr. Smith</span>
                    <Link href="/">
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
                    <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                        <Plus className="w-4 h-4" /> Add Patient
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search by name or MRN..." className="pl-10" />
                </div>

                {/* Patient List */}
                <div className="grid gap-4">
                    {patients.map((patient) => (
                        <Card key={patient.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                                        {patient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{patient.name}</h3>
                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                            <span>{patient.mrn}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span>{patient.status}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right mr-4 hidden md:block">
                                        <div className="text-xs text-slate-400">Last Visit</div>
                                        <div className="text-sm font-medium text-slate-700">{patient.lastVisit}</div>
                                    </div>
                                    <Link href="/journey">
                                        <Button variant="outline" className="gap-2">
                                            <Activity className="w-4 h-4" /> View Journey
                                        </Button>
                                    </Link>
                                    <Link href="/manage-data">
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                                            <FileSpreadsheet className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
