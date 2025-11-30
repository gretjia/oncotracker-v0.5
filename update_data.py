import pandas as pd
import json
import os
import sys
import argparse

def update_html_data(excel_file, html_file):
    print(f"Reading {excel_file}...")
    try:
        # Read Excel file without header to preserve "Unnamed: X" structure logic
        df = pd.read_excel(excel_file, header=None)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return False

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
        
        if row_dict:
            data_list.append(row_dict)
        else:
            data_list.append({}) 

    # Construct the new JSON object
    new_data = {"FormalDataset": data_list}
    new_json_str = json.dumps(new_data, ensure_ascii=False, indent=4)
    
    print(f"Reading {html_file}...")
    with open(html_file, 'r') as f:
        html_content = f.read()
    
    # Find the start index
    start_marker = "const sourceData ="
    start_idx = html_content.find(start_marker)
    
    if start_idx == -1:
        print("Could not find 'const sourceData =' in HTML file.")
        return False

    # Find the opening brace
    open_brace_idx = html_content.find("{", start_idx)
    if open_brace_idx == -1:
         print("Could not find opening brace for sourceData.")
         return False

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
        return False
        
    print(f"Found sourceData block from index {start_idx} to {end_idx}.")
    
    # Replace
    new_html_content = html_content[:start_idx] + f"const sourceData = {new_json_str}" + html_content[end_idx:]
    
    print(f"Writing updated content to {html_file}...")
    with open(html_file, 'w') as f:
        f.write(new_html_content)
        
    print("Update complete.")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Update HTML with Excel data.')
    parser.add_argument('excel_file', help='Path to the input Excel file')
    parser.add_argument('html_file', help='Path to the target HTML file')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.excel_file):
        print(f"Error: Excel file '{args.excel_file}' not found.")
        sys.exit(1)
        
    if not os.path.exists(args.html_file):
        print(f"Error: HTML file '{args.html_file}' not found.")
        sys.exit(1)

    success = update_html_data(args.excel_file, args.html_file)
    if not success:
        sys.exit(1)
