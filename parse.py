import re
content = open('App.tsx').read()
start = content.rfind('return (')
end = content.find('export default App', start)
print(content[start+1500:end])
