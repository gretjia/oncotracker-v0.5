'use client';

import React, { useState } from 'react';
import { FormalDataset, FormalDatasetRow } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DataSpreadsheetProps {
    initialData: FormalDataset;
}

export function DataSpreadsheet({ initialData }: DataSpreadsheetProps) {
    const [data, setData] = useState<FormalDatasetRow[]>(initialData.FormalDataset);

    // Get all unique keys (columns) from the dataset to ensure we render all columns
    // We'll use the first few rows (headers) to establish the column order if possible
    const getColumns = () => {
        if (data.length === 0) return [];
        // Use the first row keys as a baseline, but merge with others if needed
        return Object.keys(data[0]);
    };

    const columns = getColumns();

    return (
        <div className="flex-1 overflow-auto relative bg-white">
            <table className="w-full border-collapse text-xs font-mono">
                <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                    <tr>
                        <th className="w-10 border border-slate-300 bg-slate-200 text-slate-500 p-1 text-center select-none">
                            #
                        </th>
                        {columns.map((col, idx) => (
                            <th key={idx} className="border border-slate-300 px-2 py-1 text-left font-normal text-slate-600 min-w-[100px] whitespace-nowrap">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rIdx) => (

                        <tr key={rIdx} className={cn("transition-colors hover:bg-blue-100", rIdx % 2 === 0 ? "bg-white" : "bg-slate-100")}>
                            <td className="border border-slate-300 bg-slate-50 text-slate-400 text-center select-none">
                                {rIdx + 1}
                            </td>
                            {columns.map((col, cIdx) => (
                                <td
                                    key={cIdx}
                                    className="border border-slate-300 px-2 py-1 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:z-10 relative truncate max-w-[200px]"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        // TODO: Update state on blur
                                        // const newVal = e.currentTarget.textContent;
                                        // updateCell(rIdx, col, newVal);
                                    }}
                                >
                                    {row[col] || ''}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
