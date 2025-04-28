# Пример: создание words.js из wordlist.txt
with open('words.txt', 'r') as file:
    words = file.read().splitlines()

js_content = 'const WORDS = [\n'
js_content += ',\n'.join(f'  "{word}"' for word in words)
js_content += '\n];'

with open('words.js', 'w') as js_file:
    js_file.write(js_content)