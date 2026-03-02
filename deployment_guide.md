# cPanel Deployment Guide: MLS Project

This guide outlines the steps to deploy the MLS project (Django + React/Vite) on a cPanel-based hosting environment.

## 1. Frontend Build (Local Machine)

Before uploading, you must build the frontend on your local machine.

1.  Navigate to the `frontend` directory.
2.  Run `npm install`.
3.  Run `npm run build`.
4.  This will create a `dist` folder.
5.  Compress the contents of the `dist` folder into a `.zip` file.

## 2. cPanel: Databases

1.  Log in to **cPanel**.
2.  Navigate to **MySQL Database Wizard**.
3.  Create a new database (e.g., `youruser_mls_db`).
4.  Create a new database user and provide a strong password.
5.  Assign the user to the database with **All Privileges**.

## 3. cPanel: Python Application Setup

1.  Navigate to **Setup Python App**.
2.  Click **Create Application**.
3.  **Python Version**: Choose 3.9 or higher.
4.  **Application Root**: Enter a name (e.g., `mls_portal`).
5.  **Application URL**: Choose your domain/subdomain.
6.  **Application startup file**: Enter `passenger_wsgi.py`.
7.  Click **Create**.
8.  Copy the command to enter the virtual environment (provided at the top of the app page).

## 4. Backend Upload & Configuration

1.  Navigate to **File Manager**.
2.  Upload the `backend` folder contents into your application root (`mls_portal`).
3.  **Environment Variables**: In the "Setup Python App" interface, add the following variables:
    *   `SECRET_KEY`: Your private Django secret key.
    *   `ALLOWED_HOSTS`: `yourdomain.com,www.yourdomain.com`
    *   `DATABASE_URL`: `mysql://youruser_dbuser:password@localhost/youruser_mls_db`
    *   `DJANGO_DEBUG`: `False`

## 5. Installing Dependencies & Migrations (via SSH)

### 5a. Connect via SSH
Open your terminal (cmd, PowerShell, or any SSH client like PuTTY) and connect to your server:
```bash
ssh your_cpanel_username@yourdomain.com -p 22
```
Enter your cPanel password when prompted.

### 5b. Activate the Virtual Environment
cPanel Python apps create an isolated virtual environment. Activate it using the path shown in your "Setup Python App" page. It typically looks like:
```bash
source /home/your_cpanel_username/virtualenv/mls_portal/3.x/bin/activate
```
> Your prompt will change to show `(mls_portal)` confirming the environment is active.

### 5c. Navigate to the App Directory
```bash
cd /home/your_cpanel_username/mls_portal
```

### 5d. Install Python Dependencies
```bash
pip install -r requirements.txt
```
> If `mysqlclient` fails to install, run `pip install mysqlclient --no-binary :all:` or ask your host to install `libmysqlclient-dev`.

### 5e. Apply Database Migrations
```bash
python manage.py migrate
```

### 5f. Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### 5g. Create a Superuser (Optional — first time only)
```bash
python manage.py createsuperuser
```
Follow the prompts to create your admin account.

### 5h. Restart the Application
```bash
touch tmp/restart.txt
```
> This tells Passenger to reload the application without a full server restart.

### 5i. Deactivate the Virtual Environment
```bash
deactivate
```

## 6. Porting Frontend to Public HTML

1.  Navigate to **File Manager**.
2.  Go to `public_html`.
3.  Upload and extract the `dist.zip` you created in Step 1.
4.  Ensure that the `.htaccess` file (if present) allows the frontend to route requests to the backend `/api/` or handles client-side routing.

### Note on Static Files:
The backend static files will be collected into the `staticfiles` folder in your app root. You may need to create a symbolic link from `public_html/static` to `mls_portal/staticfiles` if they are not being served.

## 7. Troubleshooting

*   **500 Errors**: Check the `stderr` logs in the "Setup Python App" page.
*   **CORS Issues**: Ensure `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` are correctly set in `settings.py`.
*   **Database connection**: Double-check the `DATABASE_URL` format.
