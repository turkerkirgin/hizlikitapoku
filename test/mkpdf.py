import fitz, random
random.seed(3)
F='C:/Windows/Fonts/arial.ttf'
doc=fitz.open()
W,H=420,620; L,R=50,370
words=("Türk milleti bağımsızlığını kazanmak için büyük bir mücadele verdi ve sonunda zafere ulaştı "
 "ordular Anadolu'nun dört bir yanından toplanarak cepheye koştu köylüler kadınlar çocuklar herkes "
 "elinden geleni yaptı mermiler kağnılarla taşındı sabahın erken saatlerinde yola çıkan kafileler "
 "akşam karanlığında hedeflerine vardılar kumandanlar planlarını dikkatle hazırladılar").split()
def para(n): 
    s=' '.join(random.choice(words) for _ in range(n)); return s[0].upper()+s[1:]+'.'
chapters=[('BİRİNCİ BÖLÜM: SAMSUN',3),('İKİNCİ BÖLÜM: ERZURUM',3),('ÜÇÜNCÜ BÖLÜM: SİVAS',2)]
pageno=[0]; toc=[]
def newpage():
    p=doc.new_page(width=W,height=H); p.insert_font(fontname='ar',fontfile=F)
    pageno[0]+=1
    if pageno[0]>2:
        p.insert_text((L,30),'Deneme Kitabı — Kurtuluş Destanı',fontname='ar',fontsize=8)
        p.insert_text((W/2-5,H-25),str(pageno[0]),fontname='ar',fontsize=9)
    return p
# kapak
p=newpage(); p.insert_text((80,250),'KURTULUŞ DESTANI',fontname='ar',fontsize=26)
# içindekiler
p=newpage(); p.insert_text((L,70),'İçindekiler',fontname='ar',fontsize=16)
for i,(t,_) in enumerate(chapters): p.insert_text((L,110+i*22),t+' ........ '+str(3+i*2),fontname='ar',fontsize=11)
p.insert_text((L,180),'Önsöz ........ 3',fontname='ar',fontsize=11)
p.insert_text((L,202),'Sonsöz ........ 9',fontname='ar',fontsize=11)
fs=11; lh=15
def wrap(text,first_indent):
    out=[]; cur=''; x0=first_indent
    for w in text.split():
        cand=(cur+' '+w).strip()
        width=fitz.get_text_length(cand,fontname='helv',fontsize=fs)*1.02
        if width>R-L-x0:
            if len(w)>6 and random.random()<0.5:
                k=len(w)//2; a=(cur+' '+w[:k]+'-').strip()
                if fitz.get_text_length(a,fontname='helv',fontsize=fs)*1.02<=R-L-x0:
                    out.append((x0,a)); cur=w[k:]; x0=0; continue
            out.append((x0,cur)); cur=w; x0=0
        else: cur=cand
    out.append((x0,cur)); return out
y=[0]; page=[None]
def ensure(h):
    if page[0] is None or y[0]+h>H-60:
        page[0]=newpage(); y[0]=60
for ci,(title,np) in enumerate(chapters):
    page[0]=newpage(); y[0]=80
    toc.append([1,title.split(':')[1].strip().title(),pageno[0]])
    page[0].insert_text((L,y[0]),title,fontname='ar',fontsize=17); y[0]+=34
    for k in range(np*3):
        for x0,ln in wrap(para(random.randint(40,90)),18):
            ensure(lh); page[0].insert_text((L+x0,y[0]),ln,fontname='ar',fontsize=fs); y[0]+=lh
        y[0]+=4
        if k==1:
            page[0].insert_text((L,H-48),'1 Bu bir dipnottur, kaynak: Arşiv belgeleri, s. 12.',fontname='ar',fontsize=7)
doc.set_toc(toc)
doc.save('test/deneme-kitap.pdf'); print('pages',len(doc))
