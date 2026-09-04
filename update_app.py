import re

content = open('App.tsx').read()
if "import LegalPanel from './components/LegalPanel';" not in content:
    content = content.replace("import ContactPanel from './components/ContactPanel';", "import ContactPanel from './components/ContactPanel';\nconst LegalPanel = lazy(() => import('./components/LegalPanel'));")

if "currentView === ViewState.LEGAL && <LegalPanel />" not in content:
    content = content.replace("{currentView === ViewState.CONTACT && <ContactPanel />}", "{currentView === ViewState.CONTACT && <ContactPanel />}\n            {currentView === ViewState.LEGAL && <LegalPanel />}")
    
# also pass onNotificationOpen to BottomNav
if "onNotificationOpen={() => setIsNotificationOpen(true)}" not in content:
    content = content.replace("<BottomNav \n            currentView={currentView}", "<BottomNav \n            currentView={currentView}\n            onNotificationOpen={() => setIsNotificationOpen(true)}")
    # handle both formats
    content = content.replace("<BottomNav \n            currentView={currentView} \n            onNavigate={handleNavigateView}", "<BottomNav \n            currentView={currentView} \n            onNotificationOpen={() => setIsNotificationOpen(true)}\n            onNavigate={handleNavigateView}")

open('App.tsx', 'w').write(content)
