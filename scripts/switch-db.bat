@echo off
REM Switch Prisma schema between SQLite (dev) and PostgreSQL (prod)
REM Usage: switch-db.bat [sqlite|postgres]

set SCHEMA_DIR=prisma
set SQLITE_SCHEMA=%SCHEMA_DIR%\schema.sqlite.prisma
set POSTGRES_SCHEMA=%SCHEMA_DIR%\schema.postgres.prisma
set ACTIVE_SCHEMA=%SCHEMA_DIR%\schema.prisma

if "%1"=="" (
    echo Usage: %0 [sqlite^|postgres]
    echo.
    echo   sqlite   - Use SQLite for local development (no PostgreSQL needed)
    echo   postgres - Use PostgreSQL for production
    echo.
    echo Current active schema:
    if exist %ACTIVE_SCHEMA% (
        findstr /C:"provider = " %ACTIVE_SCHEMA% >nul 2>&1 && (
            findstr /C:"provider = \"sqlite\"" %ACTIVE_SCHEMA% >nul && echo   ^> SQLite
            findstr /C:"provider = \"postgresql\"" %ACTIVE_SCHEMA% >nul && echo   ^> PostgreSQL
        ) || echo   ^> Unknown
    ) else (
        echo   ^> None
    )
    exit /b 1
)

if "%1"=="sqlite" (
    if not exist %SQLITE_SCHEMA% (
        echo Error: SQLite schema not found at %SQLITE_SCHEMA%
        exit /b 1
    )
    copy /Y %SQLITE_SCHEMA% %ACTIVE_SCHEMA% >nul
    echo ✓ Switched to SQLite schema
    echo   Run: npx prisma migrate dev --name init
    echo   Or:  npx prisma db push
) else if "%1"=="postgres" (
    if not exist %POSTGRES_SCHEMA% (
        REM Create postgres schema from current if not exists
        copy /Y %ACTIVE_SCHEMA% %POSTGRES_SCHEMA% >nul 2>&1
        REM Ensure it uses postgresql
        powershell -Command "(Get-Content %POSTGRES_SCHEMA%) -replace 'provider = \"sqlite\"', 'provider = \"postgresql\"' | Set-Content %POSTGRES_SCHEMA%"
        powershell -Command "(Get-Content %POSTGRES_SCHEMA%) -replace 'url      = env\(\"DATABASE_URL\"\)', 'url      = env(\"DATABASE_URL\")`n  schemas  = [\"accounting\"]' | Set-Content %POSTGRES_SCHEMA%"
    )
    copy /Y %POSTGRES_SCHEMA% %ACTIVE_SCHEMA% >nul
    echo ✓ Switched to PostgreSQL schema
    echo   Run: npx prisma migrate deploy
) else (
    echo Unknown option: %1
    echo Usage: %0 [sqlite^|postgres]
    exit /b 1
)

echo   Regenerating Prisma Client...
npx prisma generate