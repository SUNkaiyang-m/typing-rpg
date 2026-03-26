import pandas as pd
import json

file_path = r'c:\Users\Sunky\Desktop\typing-rpg\四级高频词汇2000.xlsx'
try:
    df = pd.read_excel(file_path)
    
    # Check headers and extract words
    # Expected columns: Word, Translation, Sentence (optional)
    col_word = df.columns[0]
    col_meaning = df.columns[1]
    
    js_lines = []
    for _, row in df.iterrows():
        word = str(row[col_word]).strip()
        meaning = str(row[col_meaning]).strip()
        meaning = meaning.replace('"', '\\"') # escape quotes
        if pd.isna(row[col_word]) or not word:
            continue
        
        # we check if there's a 3rd column for sentence
        sentence_str = ''
        if len(df.columns) > 2 and not pd.isna(row[df.columns[2]]):
            s = str(row[df.columns[2]]).strip().replace('"', '\\"')
            if s:
                sentence_str = f', sentence: "{s}"'
                
        line = f'        {{ word: "{word}", meaning: "{meaning}"{sentence_str} }},'
        js_lines.append(line)
        
    out_path = r'c:\Users\Sunky\Desktop\typing-rpg\cet4_imports.txt'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(js_lines))
    print(f"Successfully exported {len(js_lines)} words to {out_path}")
except Exception as e:
    print(f"Error: {e}")
