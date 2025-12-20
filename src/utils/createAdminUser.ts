import { supabase } from '../lib/supabase';

export async function createAdminUser() {
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
      console.error('Error creating admin user:', error);
      return { success: false, error };
    }

    console.log('Admin user created successfully:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Failed to create admin user:', err);
    return { success: false, error: err };
  }
}
