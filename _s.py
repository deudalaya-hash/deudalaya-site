txt = open('C:/deudalaya/index.html', encoding='utf-8').read()
soc = open('C:/deudalaya/social.js', encoding='utf-8').read() if __import__('os').path.exists('C:/deudalaya/social.js') else '(missing)'
print('index len:', len(txt))
print('handleAuthAction:', 'function handleAuthAction' in txt)
print('postTotal in index:', 'postTotal' in txt)
print('social len:', len(soc))
print('social postTotal:', "getElementById('postTotal')" in soc)
print('social discFix:', 'const disc = document.getElementById' in soc)
print('version meta:', __import__('re').search(r'deudalaya-version" content="([^"]+)"', txt).group(1) if __import__('re').search(r'deudalaya-version" content="([^"]+)"', txt) else 'none')
