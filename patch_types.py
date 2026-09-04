content = open('types.ts').read()
if "LEGAL = 'LEGAL'" not in content:
    content = content.replace("CONTACT = 'CONTACT',", "CONTACT = 'CONTACT',\n  LEGAL = 'LEGAL',")
    open('types.ts', 'w').write(content)
