import pandas as pd
import json
import os
import re

def load_library_mappings(library_path):
    mappings = {}
    if not os.path.exists(library_path):
        return mappings
    
    with open(library_path, 'r') as f:
        lines = f.readlines()
    
    # Parse markdown tables
    # Looking for lines starting with |
    for line in lines:
        line = line.strip()
        if line.startswith('|') and '---' not in line and 'Original Term' not in line:
            parts = [p.strip() for p in line.split('|')]
            # parts[0] is empty (before first |), parts[1] is Original, parts[2] is Abbreviation
            if len(parts) >= 3:
                original = parts[1]
                abbr = parts[2]
                if original and abbr:
                    mappings[original] = abbr
    return mappings

def convert_and_update():
    base_dir = "/Users/zephryj/Documents/oncotracker/oncotracker v0.5"
    update_file = os.path.join(base_dir, "dataset_update.xlsx")
    formal_file = os.path.join(base_dir, "formal_dataset.xlsx")
    library_file = os.path.join(base_dir, "library.md")
    
    mappings = load_library_mappings(library_file)
    print(f"Loaded {len(mappings)} mappings from library.")
    
    # Read Excel files
    # We read without header to preserve structure for JSON output
    df_update_raw = pd.read_excel(update_file, header=None)
    df_formal_raw = pd.read_excel(formal_file, header=None)
    
    # We also need a version with headers to do the merging/mapping logic
    # Assuming header is at row index 3 (row 4 in excel)
    df_update_data = pd.read_excel(update_file, header=3)
    df_formal_data = pd.read_excel(formal_file, header=3)
    
    # Rename first column to Date for merging
    df_update_data.rename(columns={df_update_data.columns[0]: 'Date'}, inplace=True)
    df_formal_data.rename(columns={df_formal_data.columns[0]: 'Date'}, inplace=True)
    
    # Ensure Date is string
    df_update_data['Date'] = df_update_data['Date'].astype(str)
    df_formal_data['Date'] = df_formal_data['Date'].astype(str)
    
    # Create a lookup for Original Terms based on Date
    # Date -> { 'Scheme': val, 'Event': val }
    formal_lookup = {}
    for _, row in df_formal_data.iterrows():
        date = str(row['Date'])
        scheme = row.get('方案')
        event = row.get('处置') # or '事件' depending on file, let's check columns
        # In formal_dataset, it might be '方案' and '处置' or '事件'
        # Let's check columns from the dataframe
        
        # Fallback for event column name
        event_col = '处置' if '处置' in df_formal_data.columns else '事件'
        event = row.get(event_col)
        
        formal_lookup[date] = {
            'Scheme': scheme,
            'Event': event
        }

    # Now process the raw update dataframe to create the JSON list
    data_list = []
    
    # We need to identify which columns correspond to Scheme and Event in the raw dataframe
    # Based on previous analysis:
    # Scheme is likely column index 4 (Unnamed: 4)
    # Event is likely column index 5 (Unnamed: 5)
    # Date is column index 0
    
    # Iterate through raw rows
    for idx, row in df_update_raw.iterrows():
        row_dict = {}
        
        # Convert row to dict first
        for col_idx, value in enumerate(row):
            if pd.notna(value):
                if isinstance(value, pd.Timestamp):
                    row_dict[f"Unnamed: {col_idx}"] = value.isoformat()
                else:
                    row_dict[f"Unnamed: {col_idx}"] = str(value)
        
        # Apply mappings if this is a data row (index >= 5 usually)
        # We check if column 0 looks like a date
        col0 = row_dict.get("Unnamed: 0")
        
        # FIX: Correct known typo in dataset_update.xlsx
        if col0 and "2024-05-10" in str(col0):
            print("Fixing typo: 2024-05-10 -> 2025-05-10")
            col0 = col0.replace("2024-05-10", "2025-05-10")
            row_dict["Unnamed: 0"] = col0

        if col0 and (col0.startswith('202') or col0.startswith('19')): # Simple date check
            # Try to find matching formal data
            # Note: col0 might be ISO format string now
            # We need to match it with the keys in formal_lookup which are also strings
            
            # Normalize date string for lookup (remove time if present in one but not other?)
            # The lookup keys came from astype(str) on datetime objects, so they usually look like "2024-06-06 00:00:00"
            # The row_dict value came from isoformat() if it was timestamp, or str() if not.
            # Let's try to match.
            
            lookup_key = col0.replace('T', ' ') if 'T' in col0 else col0
            if lookup_key not in formal_lookup:
                 # Try adding time if missing
                 if len(lookup_key) == 10:
                     lookup_key += " 00:00:00"
            
            if lookup_key in formal_lookup:
                formal_info = formal_lookup[lookup_key]
                
                # Check Scheme (Col 4)
                current_scheme = row_dict.get("Unnamed: 4")
                original_scheme = formal_info.get('Scheme')
                
                if current_scheme and pd.notna(original_scheme):
                    # Split by &
                    parts = str(original_scheme).split('&')
                    new_parts = []
                    replaced = False
                    
                    # This is tricky because the current scheme might be already different/abbreviated
                    # We want to reconstruct the scheme using abbreviations for known terms
                    
                    # Actually, simpler approach:
                    # Iterate through the mappings. If the Original Term is found in the Original Scheme,
                    # ensure the corresponding part in the Current Scheme is the Abbreviation.
                    # BUT, the current scheme is a string.
                    
                    # Alternative: Rebuild the string from Original Scheme using mappings.
                    # If a part of Original Scheme has a mapping, use Abbreviation.
                    # If not, use the part from Current Scheme? No, that's hard to align.
                    # If not, use the part from Original Scheme? No, we want the Update's value if no mapping.
                    
                    # Let's try: Rebuild from Original Scheme.
                    # For each part in Original Scheme:
                    #   If part in mappings -> use Abbreviation
                    #   If not -> use the corresponding part from Update Scheme?
                    #   This requires 1:1 alignment.
                    
                    # Let's assume 1:1 alignment of parts split by '&'.
                    update_parts = str(current_scheme).split('&')
                    original_parts = [p.strip() for p in str(original_scheme).split('&')]
                    update_parts_clean = [p.strip() for p in update_parts]
                    
                    if len(original_parts) == len(update_parts_clean):
                        final_parts = []
                        for op, up in zip(original_parts, update_parts_clean):
                            # Check if op has a mapping
                            # We might need to handle dosage removal for matching?
                            # The library keys are full strings like "Nab-Paclitaxel" (no dosage) or "5-FU 500mg+ CIV46h" (full)
                            
                            # Try exact match first
                            if op in mappings:
                                final_parts.append(mappings[op])
                            else:
                                # Try matching drug name
                                op_name = extract_drug_name(op)
                                if op_name in mappings:
                                    final_parts.append(mappings[op_name])
                                else:
                                    # No mapping, keep the Update value
                                    final_parts.append(up)
                        
                        row_dict["Unnamed: 4"] = " & ".join(final_parts)

                # Check Event (Col 5)
                current_event = row_dict.get("Unnamed: 5")
                original_event = formal_info.get('Event')
                
                if current_event and pd.notna(original_event):
                     # Similar logic for events
                     if str(original_event) in mappings:
                         row_dict["Unnamed: 5"] = mappings[str(original_event)]
                     else:
                         # Try splitting if needed, but events are usually single
                         pass

        data_list.append(row_dict)

    final_json = {"FormalDataset": data_list}
    
    # Write to a file instead of print to avoid truncation issues
    with open("updated_data.json", "w") as f:
        json.dump(final_json, f, ensure_ascii=False, indent=4)
    print("JSON data written to updated_data.json")

def extract_drug_name(term):
    # Same helper as before
    parts = term.split()
    name_parts = []
    for part in parts:
        if not re.match(r'^\d+(\.\d+)?[a-zA-Z]+$', part) and not re.match(r'^\d+$', part):
            name_parts.append(part)
    return " ".join(name_parts)

if __name__ == "__main__":
    convert_and_update()
