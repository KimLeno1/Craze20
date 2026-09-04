import re

content = open('components/ContactPanel.tsx').read()
content = content.replace("['FAQ', 'FEEDBACK', 'ABOUT', 'TERMS', 'PRIVACY', 'REFUND_SHIPPING'] as SupportTab[]", "['FAQ', 'FEEDBACK', 'ABOUT'] as SupportTab[]")
content = content.replace("'TERMS' | 'PRIVACY' | 'REFUND_SHIPPING' | ", "")

# We need to remove the rendering parts. 
# They are inside {activeTab === 'TERMS' && ( ... )}
# Instead of regex matching, it's easier to use sed or just replace blocks since we know the content.
import sys

# Remove blocks
start1 = content.find("{activeTab === 'TERMS' && (")
if start1 != -1:
    end1 = content.find("{activeTab === 'PRIVACY' && (", start1)
    end2 = content.find("{activeTab === 'REFUND_SHIPPING' && (", end1)
    end3 = content.find("</AnimatePresence>", end2)
    
    if end1 != -1 and end2 != -1 and end3 != -1:
        content = content[:start1] + content[end3:]

open('components/ContactPanel.tsx', 'w').write(content)
