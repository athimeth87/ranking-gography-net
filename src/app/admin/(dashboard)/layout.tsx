import { Sidebar } from './Sidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Admin Dashboard | GOGRAPHY',
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  // Check if they have admin privileges in the database
  const { data: userData } = await supabase
    .from('users')
    .select('is_admin, is_super_admin')
    .eq('email', user.email)
    .single();

  if (!userData || (!userData.is_admin && !userData.is_super_admin)) {
    // Alternatively, you could redirect to a 403 Forbidden page or the home page
    redirect('/admin/login');
  }

  return (
    <div data-theme="light" className="flex min-h-screen w-full bg-neutral-50 text-neutral-900">
      {/* Desktop Sidebar */}
      <div className="hidden sm:block">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col w-full sm:pl-72">
        <AdminHeader />
        
        <main className="flex-1 p-6 sm:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
