@echo off
echo.
echo ===============================================================
echo         シンプルAPIテストツール (依存関係なし)
echo ===============================================================
echo.

echo 🐍 Python標準ライブラリのみを使用してテストを実行します...
echo.

REM Check if Python is available
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python がインストールされていません。
    echo Python 3.6以上をインストールしてください。
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Check if backend server is running
echo 🔍 バックエンドサーバーの動作確認中...
python -c "import urllib.request; urllib.request.urlopen('http://localhost:3005/health', timeout=3)" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ バックエンドサーバーが起動しています
) else (
    echo ⚠️  バックエンドサーバーが起動していない可能性があります
    echo    別のターミナルで以下を実行してください:
    echo    cd backend
    echo    node server2.js
    echo.
    echo 続行しますか？ (y/n)
    set /p continue="選択: "
    if /i not "%continue%"=="y" exit /b 0
)

echo.
echo 🚀 APIテスト実行中...
echo ===============================================================

python simple_api_test.py --output simple_results.csv

echo.
echo ===============================================================
echo テスト完了
echo ===============================================================
echo.

if exist "simple_results.csv" (
    echo 📄 結果ファイル: simple_results.csv
    echo.
    echo 最初の5行を表示:
    powershell -Command "Get-Content simple_results.csv | Select-Object -First 5"
    echo.
    echo 全結果を確認するには:
    echo   type simple_results.csv
    echo   または Excel で simple_results.csv を開いてください
) else (
    echo ❌ 結果ファイルが生成されませんでした
)

echo.
pause