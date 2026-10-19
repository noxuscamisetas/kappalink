"""Generate the public sample directly from Ana's versioned recipe data."""
import json, subprocess
from pathlib import Path
from decimal import Decimal
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads(subprocess.check_output(['node','-e',"const a=require('./public/anabeatriznutricao/assets/cozinha');console.log(JSON.stringify({recipes:a.recipes,items:a.buildList(a.recipes.map(r=>r.id),4)}))"],cwd=ROOT,text=True))
OUTPUT=ROOT/'public/anabeatriznutricao/amostra.pdf'
FONT=Path('/usr/share/fonts/truetype/dejavu')
for name,file in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Serif','DejaVuSerif.ttf')]:pdfmetrics.registerFont(TTFont(name,str(FONT/file)))
W,H=595.276,841.89
INK=HexColor('#243c32'); MUTED=HexColor('#6a756a'); GREEN=HexColor('#355c45'); ORANGE=HexColor('#ba5737'); LINE=HexColor('#dedfd1'); PAPER=HexColor('#faf7ef')
c=canvas.Canvas(str(OUTPUT),pagesize=(W,H));c.setTitle('Ana - Uma lista. Três receitas.');c.setAuthor('MindKappa');c.setSubject('Amostra do organizador de receitas. Rendimento culinário de quatro porções por receita.')

def text(t,x,y,size=10,font='Body',color=INK):
 c.setFillColor(color);c.setFont(font,size);c.drawString(x,y,t)
def para(t,x,y,width,size=10,leading=16,color=INK,font='Body'):
 p=Paragraph(t,ParagraphStyle('p',fontName=font,fontSize=size,leading=leading,textColor=color));_,height=p.wrap(width,H);p.drawOn(c,x,y-height);return y-height

def page(number,label):
 c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
 text('ana.',42,H-47,27,'Serif',GREEN);text('SUA ASSISTENTE VIRTUAL DE COZINHA',118,H-41,8,'Bold',MUTED)
 c.setStrokeColor(LINE);c.line(42,54,W-42,54)
 text('AMOSTRA DEMONSTRATIVA  /  '+label,42,37,7,'Bold',MUTED)
 text('MindKappa',W-136,37,7,'Body',MUTED);text(str(number)+' / 4',W-66,37,7,'Body',MUTED)

def qty(value,unit):
 if value is None:return unit
 n=format(Decimal(str(value)).normalize(),'f').replace('.',',')
 if value>1:unit={'unidade':'unidades','colher de sopa':'colheres de sopa','xícara':'xícaras'}.get(unit,unit)
 return n+' '+unit

def line_item(name,value,y,check=True):
 if check:
  c.setStrokeColor(LINE);c.roundRect(48,y-1,8,8,1,stroke=1,fill=0)
 text(name,66 if check else 42,y,9)
 c.setFont('Body',9);c.setFillColor(MUTED);c.drawRightString(W-47,y,value)
 c.setStrokeColor(HexColor('#eeeee4'));c.line(48,y-8,W-47,y-8)
 return y-24

page(1,'LISTA DE COMPRAS')
text('UMA ESCOLHA SIMPLES. UMA LISTA SÓ.',42,752,8,'Bold',ORANGE)
text('Uma lista.',42,711,37,'Serif');text('Três receitas.',42,668,37,'Serif')
y=para('Macarrão com tomate, arroz com cenoura e panqueca de banana.<br/>Exemplo com <b>4 porções culinárias por receita</b>.',43,642,W-86,10,16)
c.setFillColor(HexColor('#e7eddf'));c.roundRect(42,558,W-84,43,9,fill=1,stroke=0)
para('Antes de comprar, risque o que já tem. Os ingredientes repetidos nas três receitas já foram somados abaixo.',54,588,W-108,9,13)
y=537;section=None
for item in DATA['items']:
 if item['section']!=section:
  section=item['section'];text(section.upper(),48,y,8,'Bold',ORANGE);y-=22
 y=line_item(item['name'],qty(item['amount'],item['unit']),y)
assert y>95, y
para('A água está indicada em “Em casa”, para o preparo. Rendimento aproximado; não é uma sugestão de consumo nem um plano alimentar. Confira os ingredientes para quem vai comer.',43,99,W-86,8,12,MUTED)
c.showPage()

for num,r in enumerate(DATA['recipes'],2):
 page(num,'RECEITA '+str(num-1))
 text('RECEITA '+str(num-1)+'  /  4 PORÇÕES',42,752,8,'Bold',ORANGE)
 y=para(r['title'],42,728,W-84,30,37,font='Serif')
 text(r['time'],43,y-18,10,'Body',MUTED)
 y-=62
 text('PARA SEPARAR',42,y,8,'Bold',ORANGE);y-=26
 for name,amount,unit,section in r['ingredients']:
  y=line_item(name,qty(None if amount is None else amount*2,unit),y,False)
 y-=22;text('PARA PREPARAR',42,y,8,'Bold',ORANGE);y-=23
 for i,step in enumerate(r['steps'],1):
  text(str(i).zfill(2),43,y-11,10,'Bold',ORANGE)
  y=para(step,75,y,W-118,11,18)-18
 assert y>160,(r['id'],y)
 note='Use as quantidades como ponto de partida culinário. O rendimento depende do tamanho dos ingredientes e das porções servidas. Para esta amostra, xícara = 240 ml e colher de sopa = 15 ml.'
 c.setFillColor(HexColor('#e7eddf'));c.roundRect(42,99,W-84,64,9,fill=1,stroke=0)
 para(note,55,148,W-110,9,14,MUTED)
 c.showPage()
c.save()
# Check the specific shared amounts promised in the sample.
byname={i['name']:i for i in DATA['items']}
assert byname['Cebola']['amount']==2 and byname['Azeite']['amount']==5
assert byname['Macarrão seco']['amount']==400 and byname['Aveia em flocos finos']['amount']==120
print(OUTPUT)
