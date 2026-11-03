from PIL import Image, ImageDraw, ImageFont
import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'));os.makedirs('public/icons',exist_ok=True)
BG=(15,15,15); W=(240,240,240); G=(29,158,117)
F='C:/Windows/Fonts/segoeuib.ttf'
def make(size,pad_ratio,rounded,path):
    s=size*4
    im=Image.new('RGBA',(s,s),(0,0,0,0)); d=ImageDraw.Draw(im)
    if rounded: d.rounded_rectangle([0,0,s-1,s-1],radius=int(s*0.22),fill=BG)
    else: d.rectangle([0,0,s,s],fill=BG)
    inner=s*(1-2*pad_ratio)
    font=ImageFont.truetype(F,int(inner*0.62))
    t,o='h','k'
    bt=d.textbbox((0,0),t,font=font); bo=d.textbbox((0,0),o,font=font)
    gap=int(inner*0.02)
    wt=bt[2]-bt[0]; wo=bo[2]-bo[0]; total=wt+gap+wo
    x=(s-total)/2; base=s*0.5
    # dikey hizalama: iki harfin birleşik kutusunu ortala
    top=min(bt[1],bo[1]); bot=max(bt[3],bo[3]); y=(s-(bot-top))/2-top
    d.text((x-bt[0],y),t,font=font,fill=W)
    d.text((x+wt+gap-bo[0],y),o,font=font,fill=G)
    # alt çizgi (okuma satırı)
    lw=int(inner*0.42); lh=max(2,int(inner*0.035)); ly=int(y+bot+inner*0.06)
    d.rounded_rectangle([ (s-lw)//2, ly, (s+lw)//2, ly+lh ],radius=lh//2,fill=G)
    im=im.resize((size,size),Image.LANCZOS)
    if not rounded: im=im.convert('RGB')
    im.save(path)
make(192,0.12,False,'public/icons/icon-192.png')
make(512,0.12,False,'public/icons/icon-512.png')
make(512,0.22,False,'public/icons/icon-maskable-512.png')
make(180,0.12,False,'public/icons/apple-touch-icon.png')
make(64,0.08,True,'public/icons/favicon.png')
print('ok')
