content = open('components/Header.tsx').read()
content = content.replace("onNavigateView: (view: ViewState) => void;", "onNavigateView: (view: ViewState) => void;\n  onNotificationOpen: () => void;")
content = content.replace("onNavigateView,\n  currentPage", "onNavigateView,\n  onNotificationOpen,\n  currentPage")
content = content.replace("onClick={() => onNavigateView(ViewState.PROFILE)}", "onClick={onNotificationOpen}")
content = content.replace("currentView === ViewState.PROFILE", "false /* notifications don't change view state usually */")
content = content.replace("title=\"Profile\"", "title=\"Notifications\"")
content = content.replace("<User className=\"w-4 h-4\" />", "<Bell className=\"w-4 h-4\" />")

if "Bell" not in content:
    content = content.replace("ShoppingCart, Search, User, Heart", "ShoppingCart, Search, Bell, Heart")

open('components/Header.tsx', 'w').write(content)
