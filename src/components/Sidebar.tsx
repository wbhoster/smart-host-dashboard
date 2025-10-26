import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Server, 
  MessageSquare, 
  Send,
  LogOut,
  Monitor,
  Moon,
  Sun,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { storage } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/hosts', icon: Server, label: 'Host URLs' },
  { to: '/templates', icon: MessageSquare, label: 'Templates' },
  { to: '/whatsapp-api', icon: Settings, label: 'WhatsApp API' },
  { to: '/send-message', icon: Send, label: 'Send Message' },
];

const Sidebar = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    storage.setAuthenticated(false);
    toast({
      title: 'Logged out',
      description: 'See you next time!',
    });
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Monitor className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">IPTV Admin</h1>
            <p className="text-xs text-muted-foreground">Management Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-primary text-primary-foreground hover:bg-primary/90'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-5 h-5 mr-3" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 mr-3" />
              Dark Mode
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;