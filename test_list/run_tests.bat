@echo off
echo.
echo ===============================================================
echo           自動APIテストツール実行スクリプト
echo ===============================================================
echo.

:menu
echo 実行方法を選択してください:
echo.
echo [1] Rust版 (最高性能) - 推奨
echo [2] Python版 (実行簡単)
echo [3] 両方実行して性能比較
echo [4] 終了
echo.
set /p choice="選択 (1-4): "

if "%choice%"=="1" goto rust_version
if "%choice%"=="2" goto python_version
if "%choice%"=="3" goto both_versions
if "%choice%"=="4" goto end
echo 無効な選択です。
goto menu

:rust_version
echo.
echo 🦀 Rust版APIテストランナーを実行中...
echo ===============================================================
where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Rust がインストールされていません。
    echo Python版を代わりに実行しますか？ (y/n)
    set /p fallback="選択: "
    if /i "%fallback%"=="y" goto python_version
    goto menu
)

echo 🔨 Release buildをコンパイル中...
cargo build --release
if %ERRORLEVEL% NEQ 0 (
    echo ❌ コンパイルに失敗しました。
    goto menu
)

echo.
echo 🚀 テスト実行中...
cargo run --release -- --verbose --output rust_api_results.csv
echo.
echo ✅ Rust版テスト完了! 結果: rust_api_results.csv
goto end

:python_version
echo.
echo 🐍 Python版APIテストランナーを実行中...
echo ===============================================================
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python がインストールされていません。
    goto menu
)

echo 📦 依存関係をインストール中...
python -m pip install aiohttp --quiet

echo.
echo 🚀 テスト実行中...
python api_test_runner.py --verbose --output python_api_results.csv
echo.
echo ✅ Python版テスト完了! 結果: python_api_results.csv
goto end

:both_versions
echo.
echo 🔥 性能比較モード - Rust版とPython版を実行...
echo ===============================================================

REM Rust version
echo.
echo === Rust版実行 ===
where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Rust未インストール。Python版のみ実行します。
    goto python_only
)

cargo build --release --quiet
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Rustコンパイル失敗。Python版のみ実行します。
    goto python_only
)

echo ⏱️ Rust版実行時間を測定中...
powershell -Command "Measure-Command { cargo run --release -- --output rust_comparison.csv } | Select-Object TotalSeconds"

:python_only
REM Python version
echo.
echo === Python版実行 ===
python -m pip install aiohttp --quiet
echo ⏱️ Python版実行時間を測定中...
powershell -Command "Measure-Command { python api_test_runner.py --output python_comparison.csv } | Select-Object TotalSeconds"

echo.
echo 📊 比較完了! 結果ファイル:
echo   - rust_comparison.csv (Rust版結果)
echo   - python_comparison.csv (Python版結果)
goto end

:end
echo.
echo ===============================================================
echo テスト実行完了
echo ===============================================================
echo.
echo 生成されたファイル:
dir /b *.csv 2>nul
echo.
echo 結果を確認するには:
echo   type api_test_results.csv
echo   または Excel/LibreOfficeで開いてください
echo.
pause
exit /b 0