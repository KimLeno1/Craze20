import re

content = open('components/BottomNav.tsx').read()

content = content.replace('interface BottomNavProps {', 'interface BottomNavProps {\n  onNotificationOpen: () => void;')
content = content.replace('onLogout\n}) => {', 'onLogout,\n  onNotificationOpen\n}) => {')
content = content.replace('onNavigate(ViewState.PROFILE); setIsMoreOpen(false);', 'onNotificationOpen(); setIsMoreOpen(false);')
content = content.replace(
    '<span className="text-white text-sm md:text-base font-bold uppercase tracking-wider">My Profile</span>\n                <span className="text-zinc-400 text-[8px] md:text-[9px] uppercase tracking-widest font-mono mt-1 group-hover:text-cyan-300 transition-colors">Identity Profile</span>',
    '<span className="text-white text-sm md:text-base font-bold uppercase tracking-wider">Notifications</span>\n                <span className="text-zinc-400 text-[8px] md:text-[9px] uppercase tracking-widest font-mono mt-1 group-hover:text-cyan-300 transition-colors">Intelligence Feed</span>'
)
content = content.replace('<User ', '<Bell ')

if 'Bell,' not in content:
    content = content.replace('User,', 'User, Bell,')

# Now add Legal button to grid
# Let's find button 5 and add button 7 after button 6
legal_button = """
              {/* Button 7: Legal */}
              <button 
                onClick={() => { onNavigate(ViewState.LEGAL); setIsMoreOpen(false); }}
                className="glass-panel-futuristic rounded-[2rem] aspect-square flex flex-col items-center justify-center transition-transform active:scale-95 group col-span-2 md:col-span-1"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                  boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37), inset 0 0 20px rgba(255,255,255,0.15)'
                }}
              >
                <div className="mb-3">
                  <Shield 
                    size={40} 
                    className="text-cyan-300 opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" 
                    style={{ filter: 'drop-shadow(0 0 12px rgba(103, 232, 249, 1))' }}
                  />
                </div>
                <span className="text-white text-sm md:text-base font-bold uppercase tracking-wider">Legal</span>
                <span className="text-zinc-400 text-[8px] md:text-[9px] uppercase tracking-widest font-mono mt-1 group-hover:text-cyan-300 transition-colors">Compliance & Privacy</span>
              </button>
"""

if 'Button 7: Legal' not in content:
    content = content.replace('            </div>\n          </main>', legal_button + '            </div>\n          </main>')

if 'Shield,' not in content:
    content = content.replace('User,', 'User, Shield,')

open('components/BottomNav.tsx', 'w').write(content)
