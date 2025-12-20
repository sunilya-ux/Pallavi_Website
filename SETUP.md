# Admin User Setup Instructions

## Creating the Admin User

To use the login system, you need to first create the admin user in Supabase. There are two ways to do this:

### Method 1: Using setup-admin.html (Recommended)

1. Open the `setup-admin.html` file in your web browser
2. Click the "Create Admin User" button
3. Wait for the success message
4. You can now login with the credentials below

### Method 2: Using Browser Console

1. Open your deployed website in a browser
2. Open the browser's Developer Console (F12)
3. Paste and run the following code:

```javascript
const { createClient } = window.supabase || await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
const supabase = createClient(
  'https://stvzpemfziwjbwkezdrv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0dnpwZW1meml3amJ3a2V6ZHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTExNDksImV4cCI6MjA4MDUyNzE0OX0.yA3SWcobCEyQgcOrO2sZndJMwpBAwGWURuT6we0ahpI'
);

const { data, error } = await supabase.auth.signUp({
  email: 'sunilsu0@gmail.com',
  password: 'Astroid@12',
  options: { data: { role: 'admin' } }
});

console.log(error ? 'Error: ' + error.message : 'Success! Admin user created.');
```

## Login Credentials

**Email:** sunilsu0@gmail.com
**Password:** Astroid@12

## How It Works

1. **Landing Page**: When users visit the site, they see the main landing page with all the coaching information
2. **Login Button**: Click the "Login" button in the header to open the login modal
3. **Authentication**: Enter the credentials above to login
4. **Dashboard**: After successful login, you'll be redirected to the admin dashboard
5. **Sidebar Panel**: The dashboard has a left sidebar with a link to "Passion Coaching SMM"

## Features

- **Secure Authentication**: Uses Supabase authentication for secure login
- **Persistent Sessions**: Users stay logged in across page refreshes
- **Dashboard**: Clean admin dashboard with sidebar navigation
- **Logout**: Users can logout from the dashboard

## Troubleshooting

If you get an error saying "User already registered", that means the user has already been created and you can proceed to login directly.

If you encounter any authentication errors, make sure:
1. The Supabase credentials in `.env` are correct
2. The Supabase project is active
3. Email authentication is enabled in your Supabase project settings
