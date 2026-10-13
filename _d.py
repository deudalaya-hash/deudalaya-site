txt = open('C:/deudalaya/index.html', encoding='utf-8').read()
print('disk hasGate:', 'id="installGate"' in txt)
print('disk firstVisit:', "deudalaya-entered" in txt)
print('disk len:', len(txt))
