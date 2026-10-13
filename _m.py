txt = open('C:/deudalaya/index.html', encoding='utf-8').read()
i = txt.find('mobile-nav')
print(txt[i-50:i+1800])
