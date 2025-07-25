@echo off
echo Building API Test Runner...
echo.

REM Check if Rust is installed
where cargo >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Rust is not installed or not in PATH.
    echo Please install Rust from: https://rustup.rs/
    echo Then run: curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs ^| sh
    pause
    exit /b 1
)

echo Rust toolchain found.
echo Building optimized release version...
echo.

cargo build --release

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful!
    echo.
    echo Usage examples:
    echo   cargo run --release
    echo   cargo run --release -- --verbose
    echo   cargo run --release -- --base-url http://localhost:3001 --output my_results.csv
    echo.
) else (
    echo.
    echo ❌ Build failed!
    echo Please check the error messages above.
)

pause