@echo off
chcp 65001 >nul
cd /d "D:\Projects\14-MobileRepairs myDATA Helper"

echo ========================================
echo MobileRepairs myDATA Helper - Start
echo ========================================
echo.

echo [1/4] Cleaning .next...
if exist .next rmdir /s /q .next

echo [2/4] Generating Prisma Client...
npx prisma generate

echo [3/4] Building production...
npm run build

echo [4/4] Starting server on port 3000...
npm run start

pause