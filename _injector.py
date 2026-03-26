import re

with open(r'c:\Users\Sunky\Desktop\typing-rpg\cet4_imports.txt', 'r', encoding='utf-8') as f:
    import_lines = f.read()

with open(r'c:\Users\Sunky\Desktop\typing-rpg\dictionary.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the insertion point for cet4
# It should be after disaster
target1 = r'{ word: "disaster", meaning: "n. 灾难", sentence: "A natural ___." },'
if target1 in content:
    content = content.replace(target1, target1 + '\n' + import_lines)

# Restore kaoyan boundary
# It should be before abrupt
target2 = r'{ word: "abrupt", meaning: "adj. 突然的", sentence: "An ___ change." },'
if target2 in content:
    content = content.replace(target2, '],\n    kaoyan: [\n        ' + target2.lstrip())

with open(r'c:\Users\Sunky\Desktop\typing-rpg\dictionary.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Dictionary updated successfully!")
