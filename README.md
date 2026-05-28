# Mess Ketering

Angular + Lumen catering management system.

## Requirements

- XAMPP with MySQL running
- PHP 8.1 or newer
- Composer dependencies installed in `MS_backend`
- Node.js and npm installed
- Angular dependencies installed in `messketeringg`

## Project Folders

```text
MS_backend      Lumen API backend
messketeringg   Angular frontend
```

## Database

Default database:

```text
mess_ketering_db
```

Copy the backend environment file:

```powershell
cd C:\xampp\htdocs\MessKetering\MS_backend
copy .env.example .env
```

Check these database values in `MS_backend/.env`:

```text
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mess_ketering_db
DB_USERNAME=root
DB_PASSWORD=
```

Create the database in XAMPP MySQL if it does not exist:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS mess_ketering_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Run migrations and seeders:

```powershell
cd C:\xampp\htdocs\MessKetering\MS_backend
php artisan migrate --seed
```

## Run Backend

Start Lumen:

```powershell
cd C:\xampp\htdocs\MessKetering\MS_backend
php -S localhost:8000 -t public
```

Backend URL:

```text
http://localhost:8000
```

## Run Frontend

Open a second terminal:

```powershell
cd C:\xampp\htdocs\MessKetering\messketeringg
npm start
```

Frontend URL:

```text
http://localhost:4200
```

Angular proxies `/api` requests to:

```text
http://localhost:8000
```

Proxy config is in:

```text
messketeringg/proxy.conf.json
```

## Default Admin Login

```text
Email: admin@example.com
Password: admin123
```

Change the password after logging in.

## Gmail Inbox Setup (Dashboard)

The admin dashboard now includes an Inbox page at:

```text
/admin/inbox
```

To enable Gmail access, set these values in `MS_backend/.env`:

```text
GMAIL_CLIENT_ID=your-google-oauth-client-id
GMAIL_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_REDIRECT_URI=http://localhost:4200/admin/inbox
```

Google Cloud Console requirements:

- Enable Gmail API
- Create OAuth 2.0 Web application credentials
- Add `http://localhost:4200/admin/inbox` as an authorized redirect URI

After setting env values, restart backend (`php -S localhost:8000 -t public`) and use the **Connect Gmail** button in Inbox.

## Useful Commands

Run backend smoke test:

```powershell
cd C:\xampp\htdocs\MessKetering\MS_backend
php artisan api:smoke-test
```

Reset admin password:

```powershell
cd C:\xampp\htdocs\MessKetering\MS_backend
php artisan admin:reset-password admin@example.com newpassword123
```

Build Angular:

```powershell
cd C:\xampp\htdocs\MessKetering\messketeringg
npm run build
```

## Main Features

- Admin login/logout
- Change password
- Dashboard summary
- Menu item CRUD
- Order creation
- Order status tracking
- Payments and balance tracking
- Order filters
- Printable receipts
- Backend validation
- Protected API routes
- Backend smoke test

## Troubleshooting

Blank Angular screen:

```text
Open browser DevTools > Console and check the red error.
Run npm run build to catch compile errors.
Restart npm start after code changes.
```

401 Unauthorized:

```text
Login again.
If needed, reset the admin password with php artisan admin:reset-password.
```

Database errors:

```text
Make sure XAMPP MySQL is running.
Check MS_backend/.env database settings.
Run php artisan migrate --seed.
```

Backend not reachable:

```text
Make sure this is running:
php -S localhost:8000 -t public
```

Frontend cannot reach backend:

```text
Make sure messketeringg/proxy.conf.json points /api to http://localhost:8000.
Restart npm start after changing proxy settings.
```
