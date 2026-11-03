import time,json,sys
from playwright.sync_api import sync_playwright
U='http://127.0.0.1:8811/'
CIHAZ=[('telefon',390,844,True),('tablet-dikey',820,1180,True),('tablet-yatay',1180,820,True),('masaustu',1440,900,False)]
errs=[]
metin=json.load(open('public/katalog/kurk-mantolu-madonna.json',encoding='utf-8'))['metin']
with sync_playwright() as p:
    b=p.chromium.launch(channel='chrome')
    for ad,w,h,touch in CIHAZ:
        ctx=b.new_context(viewport={'width':w,'height':h},has_touch=touch,is_mobile=touch and w<900,device_scale_factor=2 if touch else 1)
        pg=ctx.new_page()
        pg.on('pageerror',lambda e,ad=ad:errs.append(ad+' PAGEERR '+str(e)))
        pg.on('console',lambda m,ad=ad:errs.append(ad+' CONSOLE '+m.text) if m.type=='error' and '404' not in m.text else None)
        pg.goto(U); pg.wait_for_function('libraryReady===true',timeout=30000); time.sleep(.8)
        pg.screenshot(path=f'test/shots/{ad}-1-ana.png')
        pg.evaluate('(t)=>addBookFromText("Kürk Mantolu Madonna — Sabahattin Ali",t,{source:"test"}).then(m=>openBook(m.id,0)).then(()=>{hideLanding();beginReading();})',metin)
        time.sleep(2.5)
        if pg.evaluate('waitingCard'): pg.evaluate('dismissChapterCard()')
        time.sleep(1.5)
        pg.screenshot(path=f'test/shots/{ad}-2-okuma.png')
        if w<700:
            pg.evaluate('togglePeekSheet()'); time.sleep(.8); pg.screenshot(path=f'test/shots/{ad}-3-sayfa.png'); pg.evaluate("document.body.classList.remove('peek-sheet')")
        if w<1200:
            pg.evaluate("document.body.classList.add('sb-open')"); time.sleep(.5); pg.screenshot(path=f'test/shots/{ad}-4-panel.png'); pg.evaluate("document.body.classList.remove('sb-open')")
        info=pg.evaluate("({bar:getComputedStyle(document.getElementById('mobile-bar')).display,peek:getComputedStyle(document.getElementById('page-peek')).display,sidebar:getComputedStyle(document.getElementById('sidebar')).position,overflowX:document.documentElement.scrollWidth>innerWidth,idx})")
        print(ad,info)
        ctx.close()
    b.close()
print('\n'.join(errs) or 'HATA YOK')
