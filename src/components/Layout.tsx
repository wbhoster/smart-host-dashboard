import { Outlet, Navigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import Sidebar from './Sidebar';

const Layout = () => {
  if (!storage.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 hidden lg:block">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;