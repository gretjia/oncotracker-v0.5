import pandas as pd
import os

def inspect_excel(file_path):
    print(f"--- Searching for 2024-05-10 in {os.path.basename(file_path)} ---")
    try:
        df = pd.read_excel(file_path, header=None)
        # Convert all to string and search
        mask = df.apply(lambda x: x.astype(str).str.contains('2024-05-10', na=False))
        results = df[mask.any(axis=1)]
        print(results.to_string())
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

base_dir = "/Users/zephryj/Documents/oncotracker/oncotracker v0.5"
update_file = os.path.join(base_dir, "dataset_update.xlsx")
inspect_excel(update_file)
