import time
from playwright.sync_api import sync_playwright
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(channel='chrome')
    ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    pg=ctx.new_page()
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.goto('https://hizlikitapoku.netlify.app/'); pg.wait_for_function('libraryReady===true',timeout=30000)
    pg.wait_for_function("navigator.serviceWorker.controller!==null || navigator.serviceWorker.ready.then(()=>true)",timeout=20000)
    time.sleep(3); pg.reload(); pg.wait_for_function('libraryReady===true',timeout=30000)
    print('SW kontrol:',pg.evaluate('!!navigator.serviceWorker.controller'))
    # bir kitap ekle (çevrimiçi)
    pg.evaluate("showKatDetail('os-kasagi')"); pg.wait_for_selector('#kat-modal.visible'); pg.click('#kat-d-add')
    pg.wait_for_function("library.some(b=>b.catalogId==='os-kasagi')",timeout=30000)
    ctx.set_offline(True); pg.reload(); pg.wait_for_function('libraryReady===true',timeout=30000)
    print('çevrimdışı açıldı, kütüphane:',pg.evaluate("library.map(b=>b.title)"))
    pg.evaluate("openBook(library.find(b=>b.catalogId==='os-kasagi').id,0).then(()=>{hideLanding();beginReading();})"); time.sleep(2)
    print('çevrimdışı okuma idx:',pg.evaluate('idx'),'running',pg.evaluate('running'))
    pg.screenshot(path='test/shots/canli-cevrimdisi.png')
    b.close()
print('\n'.join(errs) or 'HATA YOK')
