'use client';

import React, { useState } from 'react';
import { PatientJourneyVisualizer } from '@/components/PatientJourneyVisualizer';
import { ChatInterface } from '@/components/ChatInterface';
import { FormalDataset } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';

interface JourneyPageClientProps {
    dataset: FormalDataset;
}

export function JourneyPageClient({ dataset }: JourneyPageClientProps) {
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [highlightedMetric, setHighlightedMetric] = useState<string | null>(null);

    return (
        <div className="h-screen w-screen overflow-hidden flex relative">
            {/* Main Chart Area */}
            <div className="flex-1 h-full relative">
                <PatientJourneyVisualizer
                    dataset={dataset}
                    highlightMetric={highlightedMetric}
                />

                {/* Floating Toggle Button */}
                {!isChatOpen && (
                    <Button
                        onClick={() => setIsChatOpen(true)}
                        className="absolute bottom-6 right-6 rounded-full shadow-lg w-12 h-12 p-0"
                    >
                        <MessageSquare className="w-6 h-6" />
                    </Button>
                )}
            </div>

            {/* Chat Sidebar */}
            {isChatOpen && (
                <div className="h-full relative border-l shadow-xl z-20 transition-all duration-300 ease-in-out">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-30 h-6 w-6"
                        onClick={() => setIsChatOpen(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    <ChatInterface dataset={dataset} onHighlightMetric={setHighlightedMetric} />
                </div>
            )}
        </div>
    );
}
