content = open('index.css').read()
new_css = """
div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1) {
  background: rgba(15, 82, 186, 0.15) !important;
  backdrop-filter: blur(16px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
  border: 1px solid rgba(15, 82, 186, 0.3) !important;
  box-shadow: 0 8px 32px 0 rgba(15, 82, 186, 0.2), inset 0 0 20px rgba(15, 82, 186, 0.1) !important;
  border-radius: 1.5rem !important;
}
"""
open('index.css', 'w').write(content + new_css)
