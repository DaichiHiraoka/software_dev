@echo off
echo Starting E-commerce Services...
echo.

echo Building and starting all services...
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo.
echo Waiting for services to start...
timeout /t 10 /nobreak > nul

echo.
echo Service Status:
docker-compose ps

echo.
echo Services should be available at:
echo - Customer Frontend: http://localhost:3000
echo - Order Management: http://localhost:3001  
echo - Accounting Management: http://localhost:3002
echo - Shipping Management: http://localhost:3003
echo - Admin Management: http://localhost:3004
echo - Backend API: http://localhost:3005
echo.

echo To view logs: docker-compose logs -f [service-name]
echo To stop services: docker-compose down
pause