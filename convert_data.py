import pandas as pd
import json
import os

def convert_excel_to_json(file_path):
    try:
        # Read the Excel file without header to preserve structure
        df = pd.read_excel(file_path, header=None)
        
        # Convert to list of dictionaries with "Unnamed: X" keys to match existing format
        # The existing format uses "Unnamed: 0", "Unnamed: 1", etc.
        # Pandas to_dict('records') does this if columns are integers, but we need "Unnamed: X"
        
        data_list = []
        for _, row in df.iterrows():
            row_dict = {}
            for col_idx, value in enumerate(row):
                if pd.notna(value):
                    # Convert timestamps to ISO string if needed, or keep as string
                    if isinstance(value, pd.Timestamp):
                        row_dict[f"Unnamed: {col_idx}"] = value.isoformat()
                    else:
                        row_dict[f"Unnamed: {col_idx}"] = str(value)
            data_list.append(row_dict)

        # Wrap in the project name key (assuming filename or fixed key)
        # The original used "张莉医疗项目", we can use "FormalDataset" or keep the old key if generic
        # Let's use "FormalDataset" as the root key
        final_json = {"FormalDataset": data_list}
        
        # Print JSON to stdout
        print(json.dumps(final_json, ensure_ascii=False, indent=4))
        
    except Exception as e:
        print(f"Error converting {file_path}: {e}")

base_dir = "/Users/zephryj/Documents/oncotracker/oncotracker v0.5"
formal_file = os.path.join(base_dir, "formal_dataset.xlsx")

convert_excel_to_json(formal_file)
