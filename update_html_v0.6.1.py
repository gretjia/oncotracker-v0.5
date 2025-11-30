import pandas as pd
import json
import os
import re

def update_html_data():
    base_dir = "/Users/zephryj/Documents/oncotracker/oncotracker v0.5"
    excel_file = os.path.join(base_dir, "dataset251130.xlsx")
    html_file = os.path.join(base_dir, "oncotracker v0.6.1.html")
    
    print(f"Reading {excel_file}...")
    try:
        # Read Excel file without header to preserve "Unnamed: X" structure logic
        # or rather, to match the existing JSON structure which seems to be raw rows
        df = pd.read_excel(excel_file, header=None)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    data_list = []
    
    # Iterate through rows and convert to dictionary with "Unnamed: X" keys
    for idx, row in df.iterrows():
        row_dict = {}
        for col_idx, value in enumerate(row):
            if pd.notna(value):
                # Handle dates
                if isinstance(value, pd.Timestamp):
                    row_dict[f"Unnamed: {col_idx}"] = value.isoformat().replace('T', ' ')
                    # Ensure it looks like "2024-06-06 00:00:00" if it was a date
                    if len(str(row_dict[f"Unnamed: {col_idx}"])) == 10:
                         row_dict[f"Unnamed: {col_idx}"] += " 00:00:00"
                else:
                    row_dict[f"Unnamed: {col_idx}"] = str(value)
        
        # Only add non-empty rows? Or keep all to preserve structure?
        # The existing JSON has some empty dicts or sparse dicts.
        # Let's keep it if it has any data.
        if row_dict:
            data_list.append(row_dict)
        else:
            data_list.append({}) # Keep empty rows as empty dicts if that matches structure

    # Construct the new JSON object
    new_data = {"FormalDataset": data_list}
    new_json_str = json.dumps(new_data, ensure_ascii=False, indent=4)
    
    print(f"Reading {html_file}...")
    with open(html_file, 'r') as f:
        html_content = f.read()
    
    # Regex to find the sourceData block
    # const sourceData = { ... }
    # We need to be careful to match the closing brace correctly.
    # Since it's a variable assignment, we can look for `const sourceData =` and then find the matching object.
    # Or simpler: replace the specific block if we can identify it reliably.
    
    # Let's try a regex that captures `const sourceData = {` until the next `const` or `//` or end of script?
    # The existing file has:
    # // --- 2. FULL DATASET ---
    # const sourceData = {
    #     "FormalDataset": [
    # ...
    #     ]
    # }
    
    # We can construct the replacement string
    replacement = f"const sourceData = {new_json_str}"
    
    # Use regex to replace. 
    # Pattern: const sourceData\s*=\s*\{[\s\S]*?\}\s*(?=const|function|<\/script>|\/\/ ---)
    # This might be risky if there are nested braces. 
    
    # Alternative: Find the start index, find the matching closing brace (counting braces).
    start_marker = "const sourceData ="
    start_idx = html_content.find(start_marker)
    
    if start_idx == -1:
        print("Could not find 'const sourceData =' in HTML file.")
        return

    # Find the opening brace
    open_brace_idx = html_content.find("{", start_idx)
    if open_brace_idx == -1:
         print("Could not find opening brace for sourceData.")
         return

    # Find matching closing brace
    brace_count = 0
    end_idx = -1
    for i in range(open_brace_idx, len(html_content)):
        if html_content[i] == '{':
            brace_count += 1
        elif html_content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i + 1
                break
    
    if end_idx == -1:
        print("Could not find matching closing brace for sourceData.")
        return
        
    print(f"Found sourceData block from index {start_idx} to {end_idx}.")
    
    # Replace
    new_html_content = html_content[:start_idx] + replacement + html_content[end_idx:]
    
    print(f"Writing updated content to {html_file}...")
    with open(html_file, 'w') as f:
        f.write(new_html_content)
        
    print("Update complete.")

if __name__ == "__main__":
    update_html_data()
