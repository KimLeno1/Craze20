const fs = require('fs');
let code = fs.readFileSync('components/BottomNav.tsx', 'utf8');
code = code.replace(
  'interface BottomNavProps {',
  'interface BottomNavProps {\n  onNotificationOpen: () => void;'
);
code = code.replace(
  '  onLogout\n}) => {',
  '  onLogout,\n  onNotificationOpen\n}) => {'
);
code = code.replace(
  'onNavigate(ViewState.PROFILE); setIsMoreOpen(false);',
  'onNotificationOpen(); setIsMoreOpen(false);'
);
code = code.replace(
  '<span className="text-white text-sm md:text-base font-bold uppercase tracking-wider">My Profile</span>\n                <span className="text-zinc-400 text-[8px] md:text-[9px] uppercase tracking-widest font-mono mt-1 group-hover:text-cyan-300 transition-colors">Identity Profile</span>',
  '<span className="text-white text-sm md:text-base font-bold uppercase tracking-wider">Notifications</span>\n                <span className="text-zinc-400 text-[8px] md:text-[9px] uppercase tracking-widest font-mono mt-1 group-hover:text-cyan-300 transition-colors">Intelligence Feed</span>'
);
code = code.replace(
  '<User ',
  '<Bell '
);
// Import Bell if not present
if (!code.includes('Bell,')) {
  code = code.replace('User,', 'User, Bell,');
}
fs.writeFileSync('components/BottomNav.tsx', code);
