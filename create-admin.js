import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://stvzpemfziwjbwkezdrv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0dnpwZW1meml3amJ3a2V6ZHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTExNDksImV4cCI6MjA4MDUyNzE0OX0.yA3SWcobCEyQgcOrO2sZndJMwpBAwGWURuT6we0ahpI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  console.log('Creating admin user...');

  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'sunilsu0@gmail.com',
      password: 'Astroid@12',
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✓ User already exists! You can login with the credentials.');
      } else {
        console.error('Error creating user:', error.message);
      }
    } else {
      console.log('✓ Admin user created successfully!');
      console.log('  Email: sunilsu0@gmail.com');
      console.log('  Password: Astroid@12');
      console.log('\nYou can now login to the application with these credentials.');
    }
  } catch (err) {
    console.error('Failed to create user:', err);
  }
}

createAdminUser();
