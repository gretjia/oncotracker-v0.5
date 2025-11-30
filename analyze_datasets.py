import pandas as pd
import os
import re

def extract_drug_name(term):
    # Remove dosage info (e.g., "300mg", "130mg")
    # Assuming dosage is at the end or separated by space
    # Regex to remove numbers followed by mg/g/ml etc.
    # Or just take the first part if it looks like a name.
    
    # Strategy: Split by space, keep parts that are not dosage.
    parts = term.split()
    name_parts = []
    for part in parts:
        if not re.match(r'^\d+(\.\d+)?[a-zA-Z]+$', part) and not re.match(r'^\d+$', part):
            name_parts.append(part)
    
    return " ".join(name_parts)

def analyze():
    base_dir = "/Users/zephryj/Documents/oncotracker/oncotracker v0.5"
    formal_path = os.path.join(base_dir, "formal_dataset.xlsx")
    update_path = os.path.join(base_dir, "dataset_update.xlsx")

    print("Loading datasets...")
    # Read with header at row 3 (0-indexed)
    df_formal = pd.read_excel(formal_path, header=3)
    df_update = pd.read_excel(update_path, header=3)

    # The column with treatments is '方案'
    # The column with dates is likely the first one, named '子类' based on row 3, 
    # but it contains dates from row 5 onwards.
    
    # Let's align by index for now, assuming rows are 1:1.
    # To be safer, we can check if the 'Date' column matches.
    
    # Rename first column to Date for clarity
    df_formal.rename(columns={df_formal.columns[0]: 'Date'}, inplace=True)
    df_update.rename(columns={df_update.columns[0]: 'Date'}, inplace=True)

    # Drop the first row (row 4 in file, which is units)
    df_formal = df_formal.iloc[1:].reset_index(drop=True)
    df_update = df_update.iloc[1:].reset_index(drop=True)

    mappings = {}
    
    print("Merging datasets on Date...")
    # Ensure Date is string to avoid type mismatches
    df_formal['Date'] = df_formal['Date'].astype(str)
    df_update['Date'] = df_update['Date'].astype(str)
    
    # Merge on Date
    # We use inner join to only compare dates present in both
    # Also include '处置' (Event) column. In header=3, it is likely named '处置'.
    merged = pd.merge(df_formal[['Date', '方案', '处置']], df_update[['Date', '方案', '处置']], on='Date', suffixes=('_formal', '_update'))
    
    print(f"Merged {len(merged)} rows.")
    
    scheme_mappings = {}
    event_mappings = {}

    for i, row in merged.iterrows():
        # --- Analyze Schemes ---
        formal_scheme = str(row['方案_formal'])
        update_scheme = str(row['方案_update'])
        
        if not (pd.isna(formal_scheme) or pd.isna(update_scheme) or formal_scheme == 'nan' or update_scheme == 'nan'):
            if formal_scheme != update_scheme:
                formal_parts = [p.strip() for p in formal_scheme.split('&')]
                update_parts = [p.strip() for p in update_scheme.split('&')]
                
                if len(formal_parts) == len(update_parts):
                    for fp, up in zip(formal_parts, update_parts):
                        if fp != up:
                            fp_name = extract_drug_name(fp)
                            up_name = extract_drug_name(up)
                            
                            if len(up) > 20 and re.search(r'[\u4e00-\u9fff]', up):
                                continue

                            if fp_name and up_name and fp_name != up_name:
                                scheme_mappings[fp_name] = up_name
                            elif fp != up:
                                 scheme_mappings[fp] = up
        
        # --- Analyze Events ---
        formal_event = str(row['处置_formal'])
        update_event = str(row['处置_update'])

        if not (pd.isna(formal_event) or pd.isna(update_event) or formal_event == 'nan' or update_event == 'nan'):
            if formal_event != update_event:
                # Assuming events might also be separated by & or just single terms
                # We'll use the same split logic just in case
                formal_parts = [p.strip() for p in formal_event.split('&')]
                update_parts = [p.strip() for p in update_event.split('&')]
                
                if len(formal_parts) == len(update_parts):
                    for fp, up in zip(formal_parts, update_parts):
                        if fp != up:
                            # For events, we might not need extract_drug_name, but let's see.
                            # Events like "Laparoscopic exploration" don't have dosage.
                            # So just direct comparison.
                            
                            if len(up) > 20 and re.search(r'[\u4e00-\u9fff]', up):
                                continue
                            
                            event_mappings[fp] = up

    print(f"Found {len(scheme_mappings)} scheme mappings and {len(event_mappings)} event mappings.")
    
    # Generate library.md
    with open("library.md", "w") as f:
        f.write("# Treatment and Event Abbreviation Library\n\n")
        
        f.write("## Treatments\n")
        f.write("| Original Term | Abbreviation |\n")
        f.write("| --- | --- |\n")
        for original, abbr in sorted(scheme_mappings.items()):
            f.write(f"| {original} | {abbr} |\n")
        
        f.write("\n## Events\n")
        f.write("| Original Term | Abbreviation |\n")
        f.write("| --- | --- |\n")
        for original, abbr in sorted(event_mappings.items()):
            f.write(f"| {original} | {abbr} |\n")
    
    print("library.md created.")

if __name__ == "__main__":
    analyze()
