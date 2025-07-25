#!/usr/bin/env python3
"""
Unicode文字修正スクリプト
Fix Unicode characters for Windows compatibility
"""

import re
import os

def fix_unicode_in_file(filename):
    """ファイル内のUnicode絵文字をテキストに置換"""
    
    # 絵文字と置換テキストのマッピング
    replacements = {
        # 基本絵文字
        '🚀': '[START]',
        '✅': '[OK]',
        '❌': '[ERROR]',
        '⚠️': '[WARNING]',
        '🔧': '[SETUP]',
        '📋': '[TESTS]',
        '📊': '[RESULTS]',
        '💾': '[SAVE]',
        '🏁': '[COMPLETED]',
        '🎉': '[SUCCESS]',
        '🛑': '[STOP]',
        '🔄': '[RUNNING]',
        '📅': 'Time:',
        '⏳': 'Remaining:',
        
        # テスト関連
        '🧪': '[UNIT]',
        '🔗': '[INTEGRATION]',
        '🌐': '[SYSTEM]',
        '📂': '[FILES]',
        '💡': '[INFO]',
        '🔍': '[CHECK]',
        '⏱️': 'Duration:',
        '📄': 'File:',
        '✨': '[QUALITY]',
        '📈': 'Metrics:',
        
        # システム関連
        '🖥️': '[SERVER]',
        '🔌': '[CONNECT]',
        '📡': '[API]',
        '💾': '[DATA]',
        '🔒': '[SECURITY]',
        '⚡': '[PERFORMANCE]',
        '🔄': '[PROCESS]',
        
        # Unicode variations
        '\U0001f9ea': '[UNIT]',      # 🧪
        '\U0001f517': '[INTEGRATION]', # 🔗  
        '\U0001f310': '[SYSTEM]',    # 🌐
        '\u2705': '[OK]',            # ✅
        '\u274c': '[ERROR]',         # ❌
        '\u26a0\ufe0f': '[WARNING]', # ⚠️
        '\u26a0': '[WARNING]',       # ⚠
        '\ud83d\ude80': '[START]',   # 🚀
        '\ud83d\udccb': '[TESTS]',   # 📋
        '\ud83d\udcca': '[RESULTS]', # 📊
        '\ud83d\udcbe': '[SAVE]',    # 💾
        '\ud83c\udfc1': '[COMPLETED]', # 🏁
        '\ud83c\udf89': '[SUCCESS]', # 🎉
        '\ud83d\uded1': '[STOP]',    # 🛑
        '\ud83d\udd27': '[SETUP]',   # 🔧
        '\ud83d\udcc5': 'Time:',     # 📅
        '\u23f3': 'Remaining:',      # ⏳
        '\u2728': '[QUALITY]',       # ✨
        '\ud83d\udcc2': '[FILES]',   # 📂
        '\ud83d\udca1': '[INFO]',    # 💡
        '\u23f1\ufe0f': 'Duration:', # ⏱️
        '\ud83d\udcc4': 'File:',     # 📄
        '\ud83d\udcc8': 'Metrics:',  # 📈
    }
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 置換実行
        modified = False
        for emoji, replacement in replacements.items():
            if emoji in content:
                content = content.replace(emoji, replacement)
                modified = True
        
        # 修正があった場合は保存
        if modified:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filename}")
            return True
        else:
            print(f"No changes needed: {filename}")
            return False
            
    except Exception as e:
        print(f"Error processing {filename}: {e}")
        return False

def main():
    """メイン実行関数"""
    test_files = [
        'run_unit_tests.py',
        'run_integration_tests.py', 
        'run_system_tests.py',
        'run_all_tests.py'
    ]
    
    print("Fixing Unicode characters for Windows compatibility...")
    print("=" * 60)
    
    fixed_count = 0
    for filename in test_files:
        if os.path.exists(filename):
            if fix_unicode_in_file(filename):
                fixed_count += 1
        else:
            print(f"File not found: {filename}")
    
    print("=" * 60)
    print(f"Fixed {fixed_count} files")
    print("Unicode fix completed!")

if __name__ == "__main__":
    main()