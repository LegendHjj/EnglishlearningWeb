"""Convert the three learning workbooks into optional website packs (stdlib only).

Usage: python scripts/convert-practice-workbooks.py SOURCE_FOLDER [--inspect]
"""
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def read_book(path):
    with zipfile.ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            shared = [''.join(t.text or '' for t in si.iterfind('.//m:t', NS))
                      for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS)]
        result = {}
        for sheet in ET.fromstring(z.read('xl/workbook.xml')).find('m:sheets', NS):
            rows = []
            for row in ET.fromstring(z.read(f"xl/worksheets/sheet{sheet.attrib['sheetId']}.xml")).findall('m:sheetData/m:row', NS):
                values = [''] * 12
                for cell in row:
                    col = 0
                    for ch in re.match('[A-Z]+', cell.attrib['r'])[0]:
                        col = col * 26 + ord(ch) - 64
                    value = cell.find('m:v', NS)
                    text = value.text or '' if value is not None else ''
                    if cell.attrib.get('t') == 's':
                        text = shared[int(text)]
                    elif cell.attrib.get('t') == 'inlineStr':
                        text = ''.join(t.text or '' for t in cell.findall('.//m:t', NS))
                    if col > len(values): values.extend([''] * (col-len(values)))
                    values[col-1] = text
                rows.append((int(row.attrib['r']), values))
            result[sheet.attrib['name']] = rows
        return result

def data(book, sheet):
    return [v for r,v in book[sheet] if r >= 6 and v[0]]

def item(id, kind, title, topic, cue, model, **extra):
    return dict(id=id, kind=kind, title=title, topic=topic, cue=cue, model=model,
                examples=[], keywords=[], expressions=[], **extra)

def resources(book, sheet, title_col=0, fields=None):
    rows = data(book, sheet)
    headers = next(v for r,v in book[sheet] if r == 5)
    return [dict(title=f'{sheet}: {r[title_col]}', body='\n\n'.join(
        f'{headers[i]}\n{r[i]}' for i in (fields or range(len(headers))) if headers[i] and r[i])) for r in rows]

def convert(folder):
    chunks = read_book(folder/'Everyday_English_600_Chunks_Practice_Library.xlsx')
    big = read_book(folder/'Big_30_Questions_120_Example_Answers.xlsx')
    conv = read_book(folder/'Everyday_English_120_Conversations_and_Reply_Practice.xlsx')
    chunk_items = []
    for r in data(chunks,'Chunk library'):
        v=item(r[0],'chunk',r[1],r[5],r[2],r[3],meaning=r[2],note=r[7])
        v['examples']=[r[4]];v['expressions']=[r[1]];chunk_items.append(v)
    for r in data(chunks,'Speaking prompts'):
        chunk_items.append(item(r[0],'prompt',f'{r[2]}: {r[1]}',r[1],r[3],r[4]))
    answer_items=[]
    guides={r[0]:r for r in data(big,'Question guide')}
    for i,r in enumerate(data(big,'Example answers')):
        v=item(f'{r[0]}-example-{i%4+1}','answer',f'{r[2]} — {r[3]}','Big 30',r[2],r[4],questionId=r[0])
        v['keywords']=r[6].splitlines() if r[6] else [re.sub(r'^\d+\. ', '', x) for x in guides[r[0]][3].splitlines()]
        v['expressions']=r[7].splitlines() if r[7] else guides[r[0]][4].splitlines()
        v['challenge']=dict(cue=r[8],model=r[9],followUp='')
        answer_items.append(v)
    challenges={r[0]:r for r in data(conv,'Reply challenges')}
    conversation_items=[]
    for r in data(conv,'Conversations'):
        v=item(r[0],'conversation',r[2],r[1],f'Practise this situation: {r[2]}. Respond to the other person and keep the conversation going.',r[3])
        v['expressions']=[r[4]];v['keywords']=r[2].split()
        c=challenges[r[0]];v['challenge']=dict(cue=c[2],model=c[4],followUp=c[5]);conversation_items.append(v)
    for i,r in enumerate(data(conv,'Sentence builder')):
        v=item(f'pattern-{i+1}','pattern',f'Sentence building: {r[0]}',r[0],r[5],r[2],note=r[6])
        v['expressions']=[r[1]];v['keywords']=r[0].split();v['tasks']=dict(tight=r[3],loose=r[4],free=r[5]);conversation_items.append(v)
    assert len(chunk_items)==660 and len(answer_items)==120 and len(conversation_items)==140
    packs=[
        dict(id='everyday-600-chunks',name='600 everyday chunks',description='600 chunks with 1,200 sentence examples, 60 speaking prompts and an optional 180-session practice plan.',items=chunk_items,resources=resources(chunks,'Practice plan',1,[0,1,2,3,4])),
        dict(id='big30-120-answers',name='Big 30: 120 example answers',description='Four answers for each original question, with recall cues, useful chunks, follow-up replies and reusable prompts.',items=answer_items,resources=resources(big,'Question guide',1)+resources(big,'AI prompts',1)),
        dict(id='everyday-120-conversations',name='120 everyday conversations',description='720 dialogue turns, 120 reply challenges and 20 sentence-building patterns with 60 examples.',items=conversation_items,resources=[dict(title=v[0],body=v[1]) for r,v in conv['Start here'] if 6<=r<=17 and v[0] and v[1]]),
    ]
    output=Path(__file__).resolve().parents[1]/'public'/'practice-packs'
    output.mkdir(parents=True,exist_ok=True)
    for pack in packs:
        pack.update(app='fluency-reset-practice-pack',version=1)
        path=output/(pack['id']+'.json')
        path.write_text(json.dumps(pack,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(f'{path.name}: {len(pack["items"])} items, {path.stat().st_size:,} bytes')

if __name__ == '__main__':
    folder = Path(sys.argv[1])
    if '--inspect' in sys.argv:
        for path in folder.glob('*.xlsx'):
            print(path.name)
            for name, rows in read_book(path).items():
                print(name, [v for r,v in rows if r in (5,6)])
    else:
        convert(folder)
