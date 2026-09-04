content = open('components/Header.tsx').read()
old = """<span className="text-xs font-serif italic text-[#00D1FF] font-bold">@{handle || 'User'}</span>"""
new = """<Bell className="w-4 h-4 text-[#00D1FF]" />"""
content = content.replace(old, new)
open('components/Header.tsx', 'w').write(content)
