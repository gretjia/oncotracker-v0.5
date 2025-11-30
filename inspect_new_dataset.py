import pandas as pd
import os

file_path = "/Users/zephryj/Documents/oncotracker/oncotracker v0.5/dataset251130.xlsx"
print(f"--- Inspecting {os.path.basename(file_path)} ---")
try:
    df = pd.read_excel(file_path, header=None, nrows=10)
    print(df.to_string())
except Exception as e:
    print(f"Error reading {file_path}: {e}")
