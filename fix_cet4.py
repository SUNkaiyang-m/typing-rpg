import pandas as pd
import math
import os

excel_path = r'c:\Users\Sunky\Desktop\typing-rpg\四级高频词汇2000.xlsx'
df = pd.read_excel(excel_path)
df = df.dropna(subset=['单词', '释义'])

lines = []
for _, row in df.iterrows():
    word = str(row.get('单词', '')).strip().replace('"', '\\"')
    uk_phonetic = str(row.get('英音', '')).strip()
    us_phonetic = str(row.get('美音', '')).strip()
    ch_meaning = str(row.get('释义', '')).replace('\n', ' ').replace('\r', '').replace('"', '\\"').strip()
    
    if word and word != 'nan' and ch_meaning and ch_meaning != 'nan':
        phonos = ""
        if uk_phonetic and uk_phonetic != 'nan':
            phonos = f"[{uk_phonetic.strip('[]')}] "
        elif us_phonetic and us_phonetic != 'nan':
            phonos = f"[{us_phonetic.strip('[]')}] "
            
        full_meaning = f"{phonos}{ch_meaning}"
        lines.append(f'        {{ word: "{word}", meaning: "{full_meaning}" }},')

with open('dictionary.js', 'r', encoding='utf-8') as f:
    content = f.read()

header = '    cet4: ['
kaoyan_header = '    kaoyan: ['

cet4_start = content.find(header)
kaoyan_start = content.find(kaoyan_header)

if cet4_start != -1 and kaoyan_start != -1:
    cet4_end = content.rfind(']', cet4_start, kaoyan_start)
    new_cet4_content = '\n'.join(lines)
    new_content = content[:cet4_start + len(header)] + '\n' + new_cet4_content + '\n    ' + content[cet4_end:]
    
    with open('dictionary.js', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully updated dictionary.js with {len(lines)} words!")
else:
    print("Could not find dictionary structure in dictionary.js")
