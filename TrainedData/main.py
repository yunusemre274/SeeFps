import pandas as pd
import numpy as np

# Read both CSV files
df_a = pd.read_csv('a.csv')
df_b = pd.read_csv('b.csv')

# Standardize column names
def standardize_columns(df):
    new_columns = []
    for col in df.columns:
        standardized = col.strip().lower()
        standardized = standardized.replace(' ', '_').replace('__', '_').replace('.', '_')
        new_columns.append(standardized)
    df.columns = new_columns
    return df

df_a = standardize_columns(df_a)
df_b = standardize_columns(df_b)

# Handle missing values - drop columns with 80%+ NaN
missing_percent_a = (df_a.isnull().sum() / len(df_a)) * 100
missing_percent_b = (df_b.isnull().sum() / len(df_b)) * 100

df_a = df_a.loc[:, ~(missing_percent_a >= 80)]
df_b = df_b.loc[:, ~(missing_percent_b >= 80)]

# Clean and convert numeric columns
object_cols_a = df_a.select_dtypes(include=['object']).columns.tolist()
object_cols_b = df_b.select_dtypes(include=['object']).columns.tolist()

for col in object_cols_a:
    if len(df_a[col].dropna()) > 0:
        sample_values = df_a[col].dropna().head(10)
        converted_count = pd.to_numeric(sample_values, errors='coerce').notna().sum()
        total_count = len(sample_values)
        if converted_count / total_count > 0.8:
            df_a[col] = df_a[col].astype(str)
            df_a[col] = df_a[col].str.replace(r'[^\d\.\-]', '', regex=True)
            df_a[col] = df_a[col].replace(['unknown', 'N/A', 'n/a', 'null', ''], np.nan)
            df_a[col] = pd.to_numeric(df_a[col], errors='coerce')

for col in object_cols_b:
    if len(df_b[col].dropna()) > 0:
        sample_values = df_b[col].dropna().head(10)
        converted_count = pd.to_numeric(sample_values, errors='coerce').notna().sum()
        total_count = len(sample_values)
        if converted_count / total_count > 0.8:
            df_b[col] = df_b[col].astype(str)
            df_b[col] = df_b[col].str.replace(r'[^\d\.\-]', '', regex=True)
            df_b[col] = df_b[col].replace(['unknown', 'N/A', 'n/a', 'null', ''], np.nan)
            df_b[col] = pd.to_numeric(df_b[col], errors='coerce')

# Perform merge
df_a['gpuname'] = df_a['gpuname'].astype(str).str.strip().str.lower()
df_b['name'] = df_b['name'].astype(str).str.strip().str.lower()
merged_df = pd.merge(df_a, df_b, left_on='gpuname', right_on='name', how='left', suffixes=('_a', '_b'))

# Save final dataset
merged_df.to_csv('main_merged.csv', index=False)
merged_df.info()