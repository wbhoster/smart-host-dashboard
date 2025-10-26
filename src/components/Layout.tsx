import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { storage } from '@/lib/storage';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import Sidebar from './Sidebar';

const Layout = () => {
  const [open, setOpen] = useState(false);

  if (!storage.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden w-full">
      <aside className="w-64 hidden lg:block border-r border-border">
        <Sidebar />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="lg:hidden sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;