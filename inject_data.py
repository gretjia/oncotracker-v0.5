import json
import os

def inject_data():
    base_dir = "/Users/zephryj/Documents/oncotracker/oncotracker v0.5"
    html_file = os.path.join(base_dir, "oncotracker v0.5.7.html")
    json_file = os.path.join(base_dir, "updated_data.json")
    
    with open(json_file, 'r') as f:
        new_data = json.load(f)
    
    with open(html_file, 'r') as f:
        html_lines = f.readlines()
    
    start_idx = -1
    end_idx = -1
    
    # Find the start of sourceData
    for i, line in enumerate(html_lines):
        if "const sourceData = {" in line:
            start_idx = i
            break
            
    # Find the start of AppState, which follows sourceData
    for i, line in enumerate(html_lines):
        if "const AppState = {" in line:
            end_idx = i
            break
    
    if start_idx != -1 and end_idx != -1:
        # We want to replace from start_idx up to end_idx - 1 (or -2 if there are empty lines)
        # Let's look at the file content again.
        # Line 1024: };
        # Line 1025: 
        # Line 1026: const AppState = {
        
        # So we replace from start_idx to end_idx (exclusive) if we want to keep AppState line.
        # But we need to make sure we don't eat the empty line if we want to preserve formatting, or just replace it all.
        
        # Construct new data string
        new_data_str = "        const sourceData = " + json.dumps(new_data, ensure_ascii=False, indent=4) + ";\n\n"
        
        # New content
        new_html_lines = html_lines[:start_idx] + [new_data_str] + html_lines[end_idx:]
        
        with open(html_file, 'w') as f:
            f.writelines(new_html_lines)
        print("Successfully injected data into HTML.")
    else:
        print("Could not find sourceData or AppState markers.")

if __name__ == "__main__":
    inject_data()
