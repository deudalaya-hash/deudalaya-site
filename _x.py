txt = open('C:/deudalaya/index.html', encoding='utf-8').read()
i = txt.find('<div class="actions">')
j = txt.find('</div>', i)
print(txt[i:i+2200])
