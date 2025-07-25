@echo off
setlocal enabledelayedexpansion

echo.
echo ===============================================================
echo           全テスト自動実行スクリプト
echo ===============================================================
echo.
echo 📋 テスト実行順序:
echo    1. 単体テスト (Unit Tests)
echo    2. 結合テスト (Integration Tests)  
echo    3. 総合テスト (System Tests)
echo.

set start_time=%time%
set total_tests=0
set passed_tests=0
set failed_tests=0

REM Python環境チェック
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python がインストールされていません。
    echo Python 3.7以上をインストールしてください。
    pause
    exit /b 1
)

echo ✅ Python環境確認済み
echo.

REM 必要な依存関係インストール
echo 📦 依存関係をインストール中...
python -m pip install aiohttp --quiet

echo.
echo ===============================================================
echo 🧪 STEP 1: 単体テスト実行中...
echo ===============================================================

python run_unit_tests.py
set unit_result=%ERRORLEVEL%

if %unit_result% EQU 0 (
    echo ✅ 単体テスト: 合格
    set /a passed_tests+=1
) else (
    echo ❌ 単体テスト: 不合格
    set /a failed_tests+=1
)
set /a total_tests+=1

echo.
echo ===============================================================
echo 🔗 STEP 2: 結合テスト実行中...
echo ===============================================================

python run_integration_tests.py
set integration_result=%ERRORLEVEL%

if %integration_result% EQU 0 (
    echo ✅ 結合テスト: 合格
    set /a passed_tests+=1
) else (
    echo ❌ 結合テスト: 不合格
    set /a failed_tests+=1
)
set /a total_tests+=1

echo.
echo ===============================================================
echo 🌐 STEP 3: 総合テスト実行中...
echo ===============================================================

python run_system_tests.py
set system_result=%ERRORLEVEL%

if %system_result% EQU 0 (
    echo ✅ 総合テスト: 合格
    set /a passed_tests+=1
) else (
    echo ❌ 総合テスト: 不合格
    set /a failed_tests+=1
)
set /a total_tests+=1

REM 実行時間計算
set end_time=%time%

echo.
echo ===============================================================
echo 📊 全テスト結果サマリー
echo ===============================================================
echo.
echo 🏁 テスト実行完了
echo.
echo 📋 結果概要:
echo    合計テスト区分: %total_tests%
echo    合格: %passed_tests%
echo    不合格: %failed_tests%

set /a success_rate=(%passed_tests% * 100) / %total_tests%
echo    成功率: %success_rate%%%
echo.

echo 📂 生成されたレポートファイル:
dir /b *test_results_*.csv 2>nul | findstr . >nul
if %ERRORLEVEL% EQU 0 (
    echo    CSV結果ファイル:
    for %%f in (*test_results_*.csv) do echo      - %%f
) else (
    echo    ⚠️  CSVファイルが見つかりません
)

echo.
echo 📋 各テスト区分の詳細結果:
if %unit_result% EQU 0 (
    echo    ✅ 単体テスト: 合格 ^(≥90%% 成功率^)
) else (
    echo    ❌ 単体テスト: 不合格 ^(<90%% 成功率^)
)

if %integration_result% EQU 0 (
    echo    ✅ 結合テスト: 合格 ^(≥85%% 成功率^)
) else (
    echo    ❌ 結合テスト: 不合格 ^(<85%% 成功率^)
)

if %system_result% EQU 0 (
    echo    ✅ 総合テスト: 合格 ^(≥80%% 成功率^)
) else (
    echo    ❌ 総合テスト: 不合格 ^(<80%% 成功率^)
)

echo.
echo ===============================================================

REM 総合判定
if %passed_tests% EQU %total_tests% (
    echo 🎉 全テスト区分合格！システムリリース準備完了
    echo.
    echo 📈 品質指標:
    echo    - 単体テスト: 個別機能品質確認
    echo    - 結合テスト: コンポーネント連携確認  
    echo    - 総合テスト: システム全体品質確認
    echo.
    echo ✨ システムは本番環境展開可能な品質レベルです
    set final_result=0
) else (
    echo ⚠️ 一部テストが不合格です
    echo.
    echo 🔧 推奨アクション:
    if %unit_result% NEQ 0 echo    - 単体テスト結果を確認し、基本機能を修正
    if %integration_result% NEQ 0 echo    - 結合テスト結果を確認し、連携部分を修正
    if %system_result% NEQ 0 echo    - 総合テスト結果を確認し、システム全体を調整
    echo.
    echo 📋 修正後、再度テストを実行してください:
    echo    run_all_tests.bat
    set final_result=1
)

echo.
echo ===============================================================
echo 🕐 開始時刻: %start_time%
echo 🕐 終了時刻: %end_time%
echo ===============================================================
echo.

if %final_result% EQU 0 (
    echo 🚀 テスト完了: システム品質確認済み
) else (
    echo 🔄 テスト完了: 品質改善が必要
)

echo.
pause
exit /b %final_result%