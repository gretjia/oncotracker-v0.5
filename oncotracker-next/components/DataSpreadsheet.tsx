'use client';

import React from 'react';
import { FormalDatasetRow } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CANONICAL_HEADERS } from '@/lib/schema/index';

interface DataSpreadsheetProps {
    data: FormalDatasetRow[];
    columns: string[];
    onDataChange: (newData: FormalDatasetRow[]) => void;
}

export function DataSpreadsheet({ data, columns, onDataChange }: DataSpreadsheetProps) {
    
    const handleCellChange = (rowIndex: number, column: string, value: string) => {
        const newData = [...data];
        newData[rowIndex] = { ...newData[rowIndex], [column]: value };
        onDataChange(newData);
    };

    const getHeaderLabel = (colKey: string) => {
        // Try to find the friendly name from the canonical headers
        // @ts-ignore
        const friendly = CANONICAL_HEADERS[colKey];
        if (friendly) return `${friendly} (${colKey})`;

        // If it's a metric column, try to get name from Row 2 (index 2) if available
        // Row 2 is the Header Row in canonical schema
        if (data && data.length > 2 && data[2] && data[2][colKey]) {
            return data[2][colKey] as string;
        }

        return colKey;
    };

    return (
        <div className="flex-1 overflow-auto relative bg-white border rounded-md">
            <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm ring-1 ring-slate-200">
                    <tr>
                        <th className="w-12 border-r border-b border-slate-300 bg-slate-200 text-slate-500 p-2 text-center select-none text-xs font-medium sticky left-0 z-30">
                            #
                        </th>
                        {columns.map((col, idx) => (
                            <th 
                                key={idx} 
                                className="border-r border-b border-slate-300 px-3 py-2 text-left font-semibold text-slate-700 min-w-[120px] whitespace-nowrap bg-slate-100"
                            >
                                {getHeaderLabel(col)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rIdx) => {
                        // Row highlighting for header rows (0-3)
                        const isHeaderRow = rIdx < 4;
                        const rowClass = isHeaderRow 
                            ? "bg-slate-50 font-medium text-slate-600" 
                            : "hover:bg-blue-50";

                        return (
                            <tr key={rIdx} className={cn("border-b border-slate-200 transition-colors", rowClass)}>
                                <td className="border-r border-slate-200 bg-slate-100 text-slate-400 text-center text-xs select-none sticky left-0 z-10">
                                    {rIdx + 1}
                                </td>
                                {columns.map((col, cIdx) => (
                                    <td
                                        key={cIdx}
                                        className="border-r border-slate-200 p-0 min-w-[120px]"
                                    >
                                        <input
                                            type="text"
                                            className={cn(
                                                "w-full h-full px-3 py-2 bg-transparent border-none outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 font-mono text-xs",
                                                isHeaderRow && "font-sans font-semibold"
                                            )}
                                            value={row[col] || ''}
                                            onChange={(e) => handleCellChange(rIdx, col, e.target.value)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
