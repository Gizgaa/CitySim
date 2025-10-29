import os
from pathlib import Path

# Расширения, которые нужно собрать
EXTENSIONS = {'.py', '.js', '.css', '.html'}

# Имя выходного файла
OUTPUT_FILE = 'project_dump.txt'

def collect_files(root_dir: str = '.', output_file: str = OUTPUT_FILE):
    root_path = Path(root_dir).resolve()
    output_path = root_path / output_file

    with open(output_path, 'w', encoding='utf-8') as out_f:
        for file_path in sorted(root_path.rglob('*')):
            if file_path.is_file() and file_path.suffix.lower() in EXTENSIONS:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        rel_path = file_path.relative_to(root_path)
                        out_f.write(f'=== {rel_path} ===\n')
                        out_f.write(f.read())
                        out_f.write('\n\n')
                    print(f'Добавлен: {rel_path}')
                except Exception as e:
                    print(f'Ошибка чтения {file_path}: {e}')

    print(f'\n✅ Сбор завершён. Результат сохранён в: {output_path}')

if __name__ == '__main__':
    collect_files()