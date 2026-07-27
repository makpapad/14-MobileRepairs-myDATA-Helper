@echo off
chcp 65001 >nul
cd /d "D:\Projects\14-MobileRepairs myDATA Helper"

echo ========================================
echo MobileRepairs myDATA Helper - DEV Mode
echo ========================================
echo.

echo Cleaning .next...
if exist .next rmdir /s /q .next

echo Generating Prisma Client...
npx prisma generate

echo Starting dev server on port 3000...
npm run dev

pause