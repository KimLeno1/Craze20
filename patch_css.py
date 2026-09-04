import re

content = open('index.css').read()
# Replace the specific block
old_block = """/* User Focus Mode: sapphire blue liquid glass morphism 85% transparent */
div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) {
  background: rgba(15, 82, 186, 0.15) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border: 1px solid rgba(15, 82, 186, 0.3) !important;
  box-shadow: 0 8px 32px 0 rgba(15, 82, 186, 0.2), inset 0 0 20px rgba(15, 82, 186, 0.1) !important;
  border-radius: 1.5rem !important;
}"""

new_block = """/* User Focus Mode: sapphire blue liquid glass morphism 85% transparent */
div#root:nth-of-type(1) > div:nth-of-type(1) > nav:nth-of-type(1) > div:nth-of-type(2) > button:nth-of-type(2) {
  background: rgba(15, 82, 186, 0.15) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border: 1px solid rgba(15, 82, 186, 0.3) !important;
  box-shadow: 0 8px 32px 0 rgba(15, 82, 186, 0.2), inset 0 0 20px rgba(15, 82, 186, 0.1) !important;
  border-radius: 1.5rem !important;
}"""

if old_block in content:
    content = content.replace(old_block, new_block)
else:
    # Just append if not found (though it should be)
    content += "\n" + new_block

open('index.css', 'w').write(content)
