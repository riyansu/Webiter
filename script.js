let Main,toolsMenu
let CopyHistory = []
let PasteHistory = 0
const userAgent = window.navigator.userAgent.toLowerCase();
const isMac = userAgent.includes('mac os x')

window.onload=()=>{
    if (/(msie|trident)/i.test(userAgent) && !/edge/i.test(userAgent)) alert("WebitorはInternetExplorerに対応しておりません。\nInternetExplorerで使用したい場合は、\nOnlineWebEditor-LITEをご使用ください。");
    Main = new textarea("MainEditor")
    toolsMenu = document.getElementById("toolsMenu")
    if(localStorage.getItem('Code')==""){
        document.getElementById("keepLoadBtn").disabled=true
        document.getElementById("keepDeleteBtn").disabled=true
    }
    Main.elem.onkeydown=(event)=>{MainKeyDown(event)}
    document.onkeydown=(event)=>{ShortcutKey(event)}
    ReloadInfo()
}

function themeChange(val){
    Main.elem.focus()
    document.getElementById('theme').href=`Theme/theme${val}.css`
}

function FontSizeChange(){
    Main.elem.focus()
    const slider = document.getElementById('fontSizeSlider')
    if(slider.value == 80)slider.value = 16;
    else slider.value = Number(slider.value)+4;
    Main.elem.style.fontSize=slider.value
    SB_ToolsMenu()
}

function PreviewCode(newWin)
{
    Main.elem.focus()
    const Code = Main.value
    if(Code.includes("src=")||Code.includes("href"))alert("ローカル上のファイルは読み込むことができませんのでご了承ください。")
    if(newWin){
        let preview = window.open("", 'Preview', 'width='+screen.width+',height='+screen.width);
        preview.document.open();
        preview.document.write(Code);
        preview.document.close();
    }
    else{
        let preview = window.open();
        preview.document.open();
        preview.document.write(Code);
        preview.document.close();
    }
}

function CopyCode(){
    Main.elem.focus()
    navigator.clipboard.writeText(Main.value)
}

let KeepMenuVisible=false
function KeepMenu(){
    Main.elem.focus()
    KeepMenuVisible=!KeepMenuVisible
    const elem = document.getElementById("keepMenu")
    if(KeepMenuVisible){
        elem.style.display = "inline-block"
        let i = 0;
        const opacityLoop = setInterval(() => {
            elem.style.opacity = i/100
            i+=10;
            if(i == 100)clearInterval(opacityLoop);
        }, 0.015);
    }
    else{
        elem.style.opacity = 0
        setTimeout(() => {
            elem.style.display = "none"
        }, 150);
    }
}

function KeepCode(bool){
    Main.elem.focus()
    if(bool){
        localStorage.setItem('Code', Main.value);
        document.getElementById("keepLoadBtn").disabled=false
        document.getElementById("keepDeleteBtn").disabled=false
    }
    else if(bool==false){Main.value = localStorage.getItem('Code');ReloadInfo()}
    else{
        localStorage.removeItem('Code');
        document.getElementById("keepLoadBtn").disabled=true
        document.getElementById("keepDeleteBtn").disabled=true
    }
}

const OpenFile = () => {
    return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.html, .htm';
        input.onchange = event => { resolve(event.target.files[0]); };
        input.click();
    });
};
const readAsText = file => {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => { resolve(reader.result); };
    });
};
function ReadCode(){
    (async () => {
        const file = await OpenFile();
        const content = await readAsText(file);
        document.getElementById('MainEditor').value = content
        document.getElementById('fileName').value = file.name
        Main.elem.focus()
        ReloadInfo()
    })();
}
function WriteCode(){
    Main.elem.focus()
    const inputName = document.getElementById('fileName').value
    if(inputName != ""){
        const name = ((inputName.substring(inputName.length-5,inputName.length).toLowerCase()==".html")||(inputName.substring(inputName.length-4,inputName.length).toLowerCase()==".htm")) ? inputName : inputName+'.html'
        const a = document.createElement('a');
        a.href = 'data:html,' + encodeURIComponent(Main.value);
        a.download = name;
        a.click();
    }else{
        document.getElementById('fileName').style.backgroundColor="rgba(255,100,100,0.5)"
        setTimeout(() => {
            document.getElementById('fileName').style.removeProperty("background-color")
        }, 200);
    }
}

let backChar = ""
const doubleChar1 = [["{","[","("],["}","]",")"]]
const doubleChar2 = ['"','`']
const aloneTags = ["img","input","br","hr","link","meta","area","base","col","embed","menuitem","param","source","track","wbr","basefont","frame","bgsound","keygen"]
let emmet_caret_now = 0
let emmet_caret = []
let emmet_double = 0
let emmet_caret_executed = false
const emmet_multi_in = ["!","html:5","html","head","body","!!","doc","doc4","ri:art","ri:a","ri:type","ri:t","html:4t","html:4s","html:xt","html:xs","html:xxs","ol+","ul+","dl+","map+","table+","colgroup+","colg+","tr+","select+","optgroup+","optg+","pic+","cc:ie6","cc:ie","cc:noie"]
const emmet_multi_out = [
    '<html>\n¥\t<head>\n¥\t\t<meta charset="utf-8" />\n¥\t\t<title>|</title>\n¥\t</head>\n¥\t<body>\n¥\t\t|\n¥\t</body>\n¥</html>',
    '<html>\n¥\t<head>\n¥\t\t<meta charset="utf-8" />\n¥\t\t<title>|</title>\n¥\t</head>\n¥\t<body>\n¥\t\t|\n¥\t</body>\n¥</html>',
    "<html>\n¥\t|\n¥</html>",
    "<head>\n¥\t|\n¥</head>",
    "<body>\n¥\t|\n¥</body>",
    '<html>\n¥\t<head>\n¥\t\t<title>|</title>\n¥\t\t<meta charset="utf-8|" />\n¥\t\t<style>\n¥\t\t\t|\n¥\t\t</style>\n¥\t\t<script type="text/javascript|">\n¥\t\t\t|\n¥\t\t</script>\n¥\t</head>\n¥\t<body>\n¥\t\t|\n¥\t</body>\n¥</html>',
    '<html>\n¥\t<head>\n¥\t\t<meta charset="utf-8" />\n¥\t\t<title>|</title>\n¥\t</head>\n¥\t<body>\n¥\t\t|\n¥\t</body>\n¥</html>',
    '<html>\n¥\t<head>\n¥\t\t<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />\n¥\t\t<title>|</title>\n¥\t</head>\n¥\t<body>\n¥\t\t|\n¥\t</body>\n¥</html>',
    '<picture>\n¥\t<source media="(min-width: |)" srcset="|" />\n¥\t<img src="|" alt="|" />\n¥</picture>',
    '<picture>\n¥\t<source media="(min-width: |)" srcset="|" />\n¥\t<img src="|" alt="|" />\n¥</picture>',
    '<picture>\n¥\t<source srcset="|" type="image/|" />\n¥\t<img src="|" alt="|" />\n¥</picture>',
    '<picture>\n¥\t<source srcset="|" type="image/|" />\n¥\t<img src="|" alt="|" />\n¥</picture>',
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">\n¥<html lang="en">\n¥\t<head>\n¥\t\t<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />\n¥\t\t<title>|</title>\n¥\t</head>\n¥\t<body>\n¥\t\t|\n¥\t</body>\n¥</html>',
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n¥<html lang="en">\n¥\t<head>\n¥\t\t<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />\n¥\t\t<title>|</title>\n¥\t</head>\n¥\t<body>\n¥\t\t|\n¥\t</body>\n¥</html>',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\n¥<html lang="en">\n¥<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">\n¥\t<head>\n¥\t\t<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />\n¥\t\t<title>|</title>\n¥\t</head>\n¥\t<body>\n¥\t\t|\n¥\t</body>\n¥</html>',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">\n¥<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">\n¥\t<head>\n¥\t\t<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />\n¥\t\t<title>|</title>\n¥\t</head>\n¥\t<body>\n¥\t\t|\n¥\t</body>\n¥</html>',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">\n¥<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">\n¥\t<head>\n¥\t\t<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />\n¥\t\t<title>|</title>\n¥\t</head>\n¥\t<body>\n¥\t\t|\n¥\t</body>\n¥</html>',
    '<ol>\n¥\t<li>|</li>\n¥</ol>',
    '<ul>\n¥\t<li>|</li>\n¥</ul>',
    '<dl>\n¥\t<dt>|</dt>\n¥\t<dd>|</dd>\n¥</dl>',
    '<map name="|">\n¥\t<area shape="|" coords="|" href="|" alt="|" />\n</map>',
    '<table>\n¥\t<tr>\n¥\t\t<td>|</td>\n¥\t</tr>\n¥</table>',
    '<colgroup>\n¥\t<col />\n¥</colgroup>',
    '<colgroup>\n¥\t<col />\n¥</colgroup>',
    '<tr>\n¥\t<td>|</td>\n¥</tr>',
    '<select name="|" id="|">\n¥\t<option value="|">|</option>\n</select>',
    '<optgroup>\n¥\t<option value="|">|</option>\n</optgroup>',
    '<optgroup>\n¥\t<option value="|">|</option>\n</optgroup>',
    '<picture>\n¥\t<source srcset="|" />\n¥\t<img src="|" alt="|" />\n¥</picture>',
    '<!--[if lte IE 6]>\n¥\t|\n¥<![endif]-->',
    '<!--[if IE]>\n¥\t|\n¥<![endif]-->',
    '<!--[if !IE]><!-->\n¥\t|\n¥<!--<![endif]-->'
]
const emmet_line = ["a","abbr","acronym","address","applet","area","article","aside","audio","b","base","basefont","bdi","bdo","big","blockquote","br","button","canvas","caption","center","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","dialog","dir","div","dl","dt","em","embed","fieldset","figcaption","figure","font","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","header","hr","i","iframe","img","input","ins","kbd","label","legend","li","link","main","map","mark","meta","meter","nav","noframes","noscript","object","ol","optgroup","option","output","p","param","picture","pre","progress","q","rp","rt","ruby","s","samp","script","section","select","small","source","span","strike","strong","style","sub","summary","sup","svg","table","tbody","td","template","textarea","tfoot","th","thead","time","title","tr","track","tt","u","ul","var","video","wbr"]
const emmet_sp_in = [
    "!!!",
    "a","a:blank","a:mail","a:link","a:tel","abbr","acronym","acr",
    "base","bdo","bdo:r","bdo:l",
    "link","link:css","link:print","link:favicon","link:touch","link:rss","link:atom","link:import","link:im",
    "meta:utf","meta:win","meta:vp","meta:compat",
    "script:src",
    "src","source:src","src:sc","source:srcset","src:s","source:media","src:m","source:type","src:t",
    "source:sizes","src:z","source:media:type","src:mt","source:media:sizes","src:mz","source:sizes:type","src:zt",
    "iframe","embed","object","param","map",
    "img","img:s","img:z","img:sizes","img:srcset",
    "area","area:d","area:c","area:r","area:p",
    "form","form:get","form:post",
    "input","inp","input:hidden","input:h","input:text","input:t","input:search","input:email","input:url","input:password","input:p","input:datetime","input:date","input:datetime-local","input:month","input:week","input:time","input:tel","input:number","input:color","input:checkbox","input:c","input:radio","input:r","input:range","input:file","input:f","input:submit","input:s","input:image","input:i","input:button","input:b","isindex","input:reset",
    "select","select:disabled","select:d",
    "option","opt","textarea","marquee",
    "menu:context","menu:c","menu:toolbar","menu:t",
    "video","audio","html:xml","keygen","command",
    "button:submit","button:s","btn:s","button:reset","button:r","btn:r","button:disabled","button:d","btn:d",
    "fieldset:disabled","fieldset:d","fset:d","fst:d",
    "bq","fig","figc","pic","ifr","emb","obj","cap","colg","fst","fset","btn","optg","tarea","leg","sect","art","hdr","ftr","adr","dlg","str","prog","mn","tem","datag","datal","kg","out","det",
    "cmd","ri:dpr","ri:d","ri:viewport","ri:v","!!!4t","!!!4s","!!!xt","!!!xs","!!!xxs","c"
]
const emmet_sp_out = [
    "<!DOCTYPE html>|",
    '<a href="|" @>|</a>',
    '<a href="https://|" target="_blank" @>|</a>',
    '<a href="mailto:|" @>|</a>',
    '<a href="https://|" @>|</a>',
    '<a href="tel:+|" @>|</a>',
    '<abbr title="|" @>|</abbr>',
    '<acronym title="|" @>|</acronym>',
    '<acronym title="|" @>|</acronym>',
    '<base href="|" @ />',
    '<bdo dir="|" @>|</bdo>',
    '<bdo dir="rtl" @>|</bdo>',
    '<bdo dir="ltr" @>|</bdo>',
    '<link rel="stylesheet" href="|" @/>',
    '<link rel="stylesheet" href="style|.css" @/>',
    '<link rel="stylesheet" href="print|.css" media="print" @/>',
    '<link rel="shortcut icon" type="image/x-icon" href="favicon.ico|" @/>',
    '<link rel="apple-touch-icon" href="favicon.png|" @/>',
    '<link rel="alternate" type="application/rss+xml" title="RSS" href="rss.xml|" />',
    '<link rel="alternate" type="application/atom+xml" title="Atom" href="atom.xml|" />',
    '<link rel="import" href="component|.html" @/>',
    '<link rel="import" href="component|.html" @/>',
    '<meta http-equiv="Content-Type" content="text/html;charset=UTF-8" @/>',
    '<meta http-equiv="Content-Type" content="text/html;charset=windows-1251" @/>',
    '<meta name="viewport" content="width=device-width|, user-scalable=no|, initial-scale=1.0|, maximum-scale=1.0|, minimum-scale=1.0|" @/>',
    '<meta http-equiv="X-UA-Compatible" content="IE=7|" @/>',
    '<script src="|" @>|</script>',
    '<source @/>',
    '<source src="|" type="|" @/>',
    '<source src="|" type="|" @/>',
    '<source srcset="|" @/>',
    '<source srcset="|" @/>',
    '<source media="(min-width: |)" srcset="|" @/>',
    '<source media="(min-width: |)" srcset="|" @/>',
    '<source srcset="|" type="image/|" @/>',
    '<source srcset="|" type="image/|" @/>',
    '<source sizes="|" srcset="|" @/>',
    '<source sizes="|" srcset="|" @/>',
    '<source media="(min-width: |)" srcset="|" type="image/|" @/>',
    '<source media="(min-width: |)" srcset="|" type="image/|" @/>',
    '<source media="(min-width: |)" sizes="|" srcset="|" @/>',
    '<source media="(min-width: |)" sizes="|" srcset="|" @/>',
    '<source sizes="|" srcset="|" type="image/|" @/>',
    '<source sizes="|" srcset="|" type="image/|" @/>',
    '<iframe src="|" frameborder="0" @>|</iframe>',
    '<embed src="|" type="|" @/>',
    '<object data="|" type="|" @>|</object>',
    '<param name="|" value="|" @/>',
    '<map name="|" @>|</map>',
    '<img src="|" alt="|" @>',
    '<img src="|" alt="|" srcset="| @">',
    '<img src="|" alt="|" sizes="|" srcset="| @">',
    '<img src="|" alt="|" sizes="|" srcset="| @">',
    '<img src="|" alt="|" srcset="| @">',
    '<area shape="|" coords="|" href="|" alt="|" @/>',
    '<area shape="default" coords="|" href="|" alt="|" @/>',
    '<area shape="circle" coords="|" href="|" alt="|" @/>',
    '<area shape="rect" coords="|" href="|" alt="|" @/>',
    '<area shape="poly" coords="|" href="|" alt="|" @/>',
    '<form action="|" @>|</form>',
    '<form action="|" method="get" @>|</form>',
    '<form action="|" method="post" @>|</form>',
    '<input type="text|" @/>',
    '<input type="text|" name="|" id="|" @/>',
    '<input type="hidden" name="|" @/>',
    '<input type="hidden" name="|" @/>',
    '<input type="text|" name="|" id="|" @/>',
    '<input type="text|" name="|" id="|" @/>',
    '<input type="search" name="|" id="|" @/>',
    '<input type="email" name="|" id="|" @/>',
    '<input type="url" name="|" id="|" @/>',
    '<input type="password" name="|" id="|" @/>',
    '<input type="password" name="|" id="|" @/>',
    '<input type="datetime" name="|" id="|" @/>',
    '<input type="date" name="|" id="|" @/>',
    '<input type="datetime-local" name="|" id="|" @/>',
    '<input type="month" name="|" id="|" @/>',
    '<input type="week" name="|" id="|" @/>',
    '<input type="time" name="|" id="|" @/>',
    '<input type="tel" name="|" id="|" @/>',
    '<input type="number" name="|" id="|" @/>',
    '<input type="color" name="|" id="|" @/>',
    '<input type="checkbox" name="|" id="|" @/>',
    '<input type="checkbox" name="|" id="|" @/>',
    '<input type="radio" name="|" id="|" @/>',
    '<input type="radio" name="|" id="|" @/>',
    '<input type="range" name="|" id="|" @/>',
    '<input type="file" name="|" id="|" @/>',
    '<input type="file" name="|" id="|" @/>',
    '<input type="submit" value="|" @/>',
    '<input type="submit" value="|" @/>',
    '<input type="image" src="|" alt="|" @/>',
    '<input type="image" src="|" alt="|" @/>',
    '<input type="button" value="|" @/>',
    '<input type="button" value="|" @/>',
    '<isindex @/>',
    '<input type="reset" value="|" @/>',
    '<select name="|" id="|" @>|</select>',
    '<select name="|" id="|" disabled="disabled" @>|</select>',
    '<select name="|" id="|" disabled="disabled" @>|</select>',
    '<option value="|" @>|</option>',
    '<option value="|" @>|</option>',
    '<textarea name="|" id="|" cols="|" rows="|" @>|</textarea>',
    '<marquee behavior="|" direction="|" @>|</marquee>',
    '<menu type="context" @>|</menu>',
    '<menu type="context" @>|</menu>',
    '<menu type="toolbar" @>|</menu>',
    '<menu type="toolbar" @>|</menu>',
    '<video src="|" @>|</video>',
    '<audio src="|" @>|</audio>',
    '<html xmlns="http://www.w3.org/1999/xhtml" @>|</html>',
    '<keygen @/>',
    '<command @/>',
    '<button type="submit" @>|</button>',
    '<button type="submit" @>|</button>',
    '<button type="submit" @>|</button>',
    '<button type="reset" @>|</button>',
    '<button type="reset" @>|</button>',
    '<button type="reset" @>|</button>',
    '<button disabled="disabled" @>|</button>',
    '<button disabled="disabled" @>|</button>',
    '<button disabled="disabled" @>|</button>',
    '<fieldset disabled="disabled" @>|</fieldset>',
    '<fieldset disabled="disabled" @>|</fieldset>',
    '<fieldset disabled="disabled" @>|</fieldset>',
    '<fieldset disabled="disabled" @>|</fieldset>',
    '<blockquote @>|</blockquote>',
    '<figure @>|</figure>',
    '<figcaption @>|</figcaption>',
    '<picture @>|</picture>',
    '<iframe src="|" frameborder="0" @>|</iframe>',
    '<embed src="|" type="|" @/>',
    '<object data="|" type="|" @>|</object>',
    '<caption @>|</caption>',
    '<colgroup @>|</colgroup>',
    '<fieldset @>|</fieldset>',
    '<fieldset @>|</fieldset>',
    '<button @>|</button>',
    '<optgroup @>|</optgroup>',
    '<textarea name="|" id="|" cols="|" rows="|" @>|</textarea>',
    '<legend @>|</legend>',
    '<section @>|</section>',
    '<article @>|</article>',
    '<header @>|</header>',
    '<footer @>|</footer>',
    '<address @>|</address>',
    '<dialog @>|</dialog>',
    '<strong @>|</strong>',
    '<progress @>|</progress>',
    '<main @>|</main>',
    '<template @>|</template>',
    '<datagrid @>|</datagrid>',
    '<datalist @>|</datalist>',
    '<keygen @/>',
    '<output @>|</output>',
    '<details @>|</details>',
    '<command @/>',
    '<img srcset="|" src="|" alt="|" @/>',
    '<img srcset="|" src="|" alt="|" @/>',
    '<img sizes="|" srcset="|" src="|" alt="|" @/>',
    '<img sizes="|" srcset="|" src="|" alt="|" @/>',
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">',
    '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">',
    '<!-- | -->'
]
const emmet_line_tags = ["span"]
function MainKeyDown(event){
    const keyCode = event.keyCode;
    const key = event.key;
    const cursorSPos = Main.caretStart;
    const cursorEPos = Main.caretEnd;
    const Code = Main.value
    const Len = Code.length
    const SLStr = Code.substring(0, cursorSPos);
    const SRStr = Code.substring(cursorSPos, Len);
    const ELStr = Code.substring(0, cursorEPos);
    const ERStr = Code.substring(cursorEPos, Len);
    const CStr = Code.substring(cursorSPos,cursorEPos)
    if((event.ctrlKey && !isMac)||(event.metaKey && isMac)){
        if(keyCode == 13){// Enter
            event.preventDefault()
            const right = Main.allLines[Main.caret.y].substring(Main.caret.x,Main.allLines[Main.caret.y].length).length
            const Left = Main.allLines[Main.caret.y].substring(0,Main.caret.x)
            let Tabs = 0
            for(let i=0;i < Left.length; i++){ if(Left[i]=="\t")Tabs++; else break }
            Main.caretStart += right
            const pos = Main.caretStart
            Main.value = Main.value.substring(0,Main.caretStart)+"\n"+"\t".repeat(Tabs)+Main.value.substring(Main.caretStart,Main.value.length)
            Main.caretStart = pos+1+Tabs
            Main.caretEnd = pos+1+Tabs
        }
        else if(keyCode == 221){// ]
            event.preventDefault()
            const selectedLines = [Main.caret.y,Main.caret.end.y]
            for(let i = selectedLines[0]; i <= selectedLines[1]; i++){
                Main.editLine(i,"\t"+Main.allLines[i])
            }
            Main.caretStart = cursorSPos+1
            Main.caretEnd = cursorEPos+1+selectedLines[1]-selectedLines[0]
        }
        else if(keyCode == 219){// [
            event.preventDefault()
            const S =Main.caret.x
            const selectedLines = [Main.caret.y,Main.caret.end.y]
            let move = 0
            for(let i = selectedLines[0]; i <= selectedLines[1]; i++){
                if(Main.allLines[i][0]=="\t")move = -1
                Main.editLine(i,(Main.allLines[i][0]=="\t")? Main.allLines[i].substring(1,Main.allLines[i].length) : Main.allLines[i])
            }
            if(S==0) Main.caretStart = cursorSPos
            else Main.caretStart = cursorSPos+move

            move!=0
            ? Main.caretEnd = cursorEPos-selectedLines[1]+selectedLines[0]+move
            : Main.caretEnd = cursorEPos
        }
        else if(keyCode == 191){// /
            event.preventDefault()
            const BTextR = Code.substring(0,cursorSPos).split("").reverse().join("").toLowerCase()
            const inScript = (BTextR.includes('>tpircs<')&&!(BTextR.includes('>tpircs/<')))||(BTextR.includes('>tpircs<')&&BTextR.includes('>tpircs/<')&&BTextR.search(">tpircs<")<BTextR.search(">tpircs/<"))
            const inStyle = (BTextR.includes('>elyts<')&&!(BTextR.includes('>elyts/<')))||(BTextR.includes('>elyts<')&&BTextR.includes('>elyts/<')&&BTextR.search(">elyts<")<BTextR.search(">elyts/<"))
            if(inScript && !Main.allLines[Main.caret.y].includes("<script>")){
                const selectedLines = [Main.caret.y,Main.caret.end.y]
                const mode = Main.allLines[Main.caret.y].substring(0,3)=="//\t"
                if(mode){
                    const S =Main.caret.x
                    let move = 0
                    for(let i = selectedLines[0]; i <= selectedLines[1]; i++){
                        if(Main.allLines[i].substring(0,3)=="//\t")move = -3
                        Main.editLine(i,(Main.allLines[i].substring(0,3)=="//\t")? Main.allLines[i].substring(3,Main.allLines[i].length) : Main.allLines[i])
                    }
                    if(S<=3) Main.caretStart = cursorSPos-S
                    else Main.caretStart = cursorSPos-3
                    Main.caretEnd = cursorEPos-selectedLines[1]+selectedLines[0]+move-2*(selectedLines[1]-selectedLines[0])
                }
                else{
                    let move = 0
                    for(let i = selectedLines[0]; i <= selectedLines[1]; i++){
                        if(Main.allLines[i].substring(0,3)!="//\t"){
                            Main.editLine(i,"//\t"+Main.allLines[i])
                            move += 3
                        }
                    }
                    Main.caretStart = cursorSPos+3
                    Main.caretEnd = cursorEPos+move
                }
            }
        }
        else if(keyCode == 76){
            event.preventDefault()
            const Right = Main.allLines[Main.caret.end.y].substring(Main.caret.end.x,Main.allLines[Main.caret.end.y].length).length
            const Left = Main.allLines[Main.caret.y].substring(0,Main.caret.x).length
            Main.caretStart = cursorSPos-Left
            Main.caretEnd = cursorEPos+Right
            emmet_caret_executed = false
        }
        else if(keyCode == 85){
            event.preventDefault()
            if(cursorSPos==cursorEPos){
                const line = Main.allLines[Main.caret.y];
                Main.editLine(Main.caret.y,((/[a-z]/.test(line))?line.toUpperCase():line.toLowerCase()))
                Main.caretStart = cursorSPos
                Main.caretEnd = cursorSPos
            }else{
                Main.value = SLStr + ((/[a-z]/.test(Main.selection))?Main.selection.toUpperCase():Main.selection.toLowerCase()) + ERStr;
                Main.caretStart = cursorSPos
                Main.caretEnd = cursorEPos
            }
        }
        else if(keyCode==67){
            if(cursorSPos==cursorEPos){
                event.preventDefault()
                navigator.clipboard.writeText(Main.allLines[Main.caret.y])
                if(CopyHistory.length == 10)CopyHistory.pop()
                CopyHistory.unshift(Main.allLines[Main.caret.y])
            }else{
                if(CopyHistory.length == 10)CopyHistory.pop()
                CopyHistory.unshift(Main.selection)
            }
            PasteHistory = 0
        }
        else if(keyCode==75 && cursorSPos==cursorEPos){
            event.preventDefault()
            let setPos = Main.caretStart-Main.caret.x
            Main.editLine(Main.caret.y,"")
            Main.caretStart = setPos
            Main.caretEnd = setPos
        }
        else if(keyCode==88){
            if(cursorSPos==cursorEPos){
                event.preventDefault()
                let setPos = Main.caretStart-Main.caret.x
                navigator.clipboard.writeText(Main.allLines[Main.caret.y])
                Main.editLine(Main.caret.y,"")
                if(CopyHistory.length == 10)CopyHistory.pop()
                CopyHistory.unshift(Main.allLines[Main.caret.y])
                Main.caretStart = setPos
                Main.caretEnd = setPos
            }else{
                if(CopyHistory.length == 10)CopyHistory.pop()
                CopyHistory.unshift(Main.selection)
            }
            PasteHistory = 0
        }
        else if(keyCode==40){
            event.preventDefault()
            const Right = Main.allLines[Main.caret.y].substring(Main.caret.x,Main.allLines[Main.caret.y].length).length
            Main.caretEnd += Right
            if(event.shiftKey) Main.caretStart = cursorSPos
            else Main.caretStart = Main.caretEnd
        }
        else if(keyCode==38){
            event.preventDefault()
            const Left = Main.allLines[Main.caret.y].substring(0,Main.caret.x).length
            Main.caretStart -= Left
            if(event.shiftKey) Main.caretEnd = cursorSPos
            else Main.caretEnd = Main.caretStart
        }
        else if(keyCode==86 && ((!isMac&&event.shiftKey)||(isMac&&event.altKey))){
            event.preventDefault()
            if(CopyHistory.length != 0){
                Main.value = SLStr +CopyHistory[PasteHistory]+ ERStr
                Main.caretStart = cursorSPos
                Main.caretEnd = cursorEPos+CopyHistory[PasteHistory].length
                PasteHistory++
                if(PasteHistory >= CopyHistory.length)PasteHistory = 0
            }
        }
        else if(keyCode==65)emmet_caret_executed = false
    }
    else if(event.altKey){
        if(keyCode==38 && cursorSPos==cursorEPos){
            event.preventDefault()
            const CaretY = Main.caret.y
            const CaretX = Main.caret.x
            if(event.shiftKey){
                const CLine = Main.allLines[CaretY]
                Main.editLine(CaretY,CLine+"\n"+CLine)
                Main.setCaret(CaretY,CaretX)
            }else if(Main.caret.y != 0){
                const ULine = Main.allLines[CaretY-1]
                const CLine = Main.allLines[CaretY]
                Main.editLine(CaretY,ULine)
                Main.editLine(CaretY-1,CLine)
                Main.setCaret(CaretY-1,Infinity)
            }
        }else if(keyCode == 40 && cursorSPos==cursorEPos){
            event.preventDefault()
            const CaretY = Main.caret.y
            const CaretX = Main.caret.x
            if(event.shiftKey){
                const CLine = Main.allLines[CaretY]
                Main.editLine(CaretY,CLine+"\n"+CLine)
                Main.setCaret(CaretY+1,CaretX)
            }
            else if(Main.caret.y != Main.allLines.length-1){
                const DLine = Main.allLines[CaretY+1]
                const CLine = Main.allLines[CaretY]
                Main.editLine(CaretY+1,CLine)
                Main.editLine(CaretY,DLine)
                Main.setCaret(CaretY+1,Infinity)
            }
        }
    }
    else{
        if(keyCode == 9) {//9=>Tabキー
            event.preventDefault();
            if(![" ","\n","\t"].includes((" "+Code)[Main.caretStart])){
                if(emmet_caret_executed){
                    Main.caretStart = Main.caretStart+emmet_caret[0]-1-emmet_caret_now;
                    Main.caretEnd = Main.caretStart;
                    emmet_caret_now = emmet_caret[0];
                    emmet_caret.shift();
                    if(emmet_caret.length==0)emmet_caret_executed = false;
                }
                if(cursorSPos==cursorEPos){ //選択エリアがない時のみEmmetを実行する
                    const BTextR = Code.substring(0,cursorSPos).split("").reverse().join("").toLowerCase()
                    const inScript = (BTextR.includes('>tpircs<')&&!(BTextR.includes('>tpircs/<')))||(BTextR.includes('>tpircs<')&&BTextR.includes('>tpircs/<')&&BTextR.search(">tpircs<")<BTextR.search(">tpircs/<"))
                    const inStyle = (BTextR.includes('>elyts<')&&!(BTextR.includes('>elyts/<')))||(BTextR.includes('>elyts<')&&BTextR.includes('>elyts/<')&&BTextR.search(">elyts<")<BTextR.search(">elyts/<"))
                    const inTag = (BTextR.indexOf("<"))<(BTextR.indexOf(">")) || (BTextR.includes("<")&&!BTextR.includes(">"))
                    const singleQ = Code.substring(0,cursorEPos).match(/\'/g)
                    const doubleQ = Code.substring(0,cursorEPos).match(/\"/g)
                    const inStr = (inTag && ((singleQ!=null && singleQ.length%2==1)||(doubleQ!=null && doubleQ.length%2==1)))
                    if(!inScript && !inStyle && !inStr && !emmet_caret_executed){
                        const left = " "+Main.allLines[Main.caret.y].substring(0,Main.caret.x)
                        const right = Main.allLines[Main.caret.y].substring(Main.caret.x,Main.allLines[Main.caret.y].length)+" "
                        const getEmmet = left.replace(/\|/g,"v").replace(/\[[^\]]*\]|\{[^}]*\}/g,(match)=>{return "s".repeat(match.length)}).split("").reverse().join("").replace(/\t| |>/g,"|")
                        const getEmmetR =right.replace(/\|/g,"v").replace(/\[[^\]]*\]|\{[^}]*\}/g,(match)=>{return "s".repeat(match.length)}).replace(/\t| |>/g,"|")
                        const leftEmmet = left.split("").reverse().join("").substring(0,getEmmet.indexOf("|")).split("").reverse().join("")
                        let rightEmmet = right.substring(0,getEmmetR.indexOf("|"))
                        let wholeEmmet
                        if((leftEmmet+rightEmmet).replace(/^[\w-!:]+/,"").replace(/#[\$\w-]+/g,"").replace(/\.[\$\w-]+/g,"").replace(/\[([^[\]]+)\]/g,"").replace(/{([^{}]+)}/g,"").replace(/\*\d+/,"")==""){
                            wholeEmmet = leftEmmet + rightEmmet
                        }else if((leftEmmet).replace(/^[\w-!:]+/,"").replace(/#[\$\w-]+/g,"").replace(/\.[\$\w-]+/g,"").replace(/\[([^[\]]+)\]/g,"").replace(/{([^{}]+)}/g,"").replace(/\*\d+/,"")==""){
                            wholeEmmet = leftEmmet
                            rightEmmet = ""
                        }else return false
                        const getEmmetProp = [(wholeEmmet.match(/^[\w-!:]+/) || []).join(""), (wholeEmmet.replace(/(\[([^[\]]+)\])|{([^{}]+)}/g,"").match(/#[\$\w-]+/) || []).join("").replace("#",""), (wholeEmmet.replace(/\[([^[\]]+)\]|{([^{}]+)}/g,"").match(/\.[\$\w-]+/g) || []).map(e => e.replace(".","")).join(" "),(wholeEmmet.replace(/{([^{}]+)}/g,"").match(/\[([^[\]]+)\]/g) || []).map(item => item.replace(/\[|\]/g, "")).join(" "),(wholeEmmet.replace(/\[([^[\]]+)\]/g,"").match(/{([^{}]+)}/g) || []).map(item => item.slice(1,-1)).join(" "),parseInt((wholeEmmet.replace(/\[([^[\]]+)\]|{([^{}]+)}/g,"").match(/\*\d+/) || []).join("").replace(/\*0+/,"*1").replace("*","") || 1)]

                        const Emmet = getEmmetProp[0] || ((getEmmetProp[1]||getEmmetProp[2]||getEmmetProp[3])?"div":"")
                        const EmmetText = getEmmetProp[4]
                        const EmmetRepeat = getEmmetProp[5]
                        // console.log(EmmetRepeat)
                        let EmmetProp = getEmmetProp[3]
                        if(EmmetProp != "")EmmetProp = " "+getEmmetProp[3]
                        let space = ""
                        if(!EmmetProp.includes('id="') && getEmmetProp[1]!=""){
                            EmmetProp+=`${(EmmetProp[EmmetProp.length]!=" ")?" ":""}id="${getEmmetProp[1]}"`
                            space=" "
                        }
                        if(getEmmetProp[2]!=""){
                            if(EmmetProp.includes('class="')) EmmetProp = EmmetProp.replace('class="',`class="${getEmmetProp[2]} `)
                            else EmmetProp+=`${space || (EmmetProp[EmmetProp.length]!=" ")?" ":""}class="${getEmmetProp[2]}"`
                        }

                        const Large = Emmet.toLowerCase() != Emmet
                        if(emmet_multi_in.includes(Emmet.toLowerCase())){
                            let Tabs = 0
                            const Left = left.substring(1,left.length-1)
                            for(let i=0;i < Left.length; i++){ if(Left[i]=="\t")Tabs++; else break }
                            let tab = "\t".repeat(Tabs)
                            const output = emmet_multi_out[emmet_multi_in.indexOf(Emmet.toLowerCase())]
                            Main.value = SLStr.substring(0,SLStr.length-wholeEmmet.length) + ((Large)?output.toUpperCase().replace(/\|/g,"").replace(/\¥/g,tab):emmet_multi_out[emmet_multi_in.indexOf(Emmet)].replace(/\|/g,"").replace(/\¥/g,tab)) + SRStr
                            const newLine = output.substring(0,output.indexOf("|")).match(/\n/g)
                            Main.caretStart = cursorSPos + output.indexOf("|") - wholeEmmet.length + (Tabs-1)*((newLine!=null)? newLine.length : 1)+((newLine!=null)?0 : 1)
                            Main.caretEnd = Main.caretStart
                            let emmet_caret_count = output.match(/\|/g).length
                            if(emmet_caret_count>1){
                                emmet_caret = []
                                let getWarp = output.replace(/\¥/g,"")
                                for(let i = 0; i < emmet_caret_count; i++){
                                    if(emmet_caret.length != 0)emmet_caret.push(getWarp.indexOf("|",(emmet_caret[i-1]+1)))
                                    else emmet_caret.push(getWarp.indexOf("|"))
                                }
                                emmet_caret_now = emmet_caret[0];
                                emmet_caret.shift();
                                emmet_caret_executed = true
                            }
                        }
                        else if(emmet_sp_in.includes(Emmet)){
                            const output = emmet_sp_out[emmet_sp_in.indexOf(Emmet.toLowerCase())]
                            Main.value = SLStr.substring(0,SLStr.length-wholeEmmet.length)+(emmet_sp_out[emmet_sp_in.indexOf(Emmet)].replace("@","")).replace(/\|/g,"")+SRStr
                            Main.caretStart = cursorSPos+emmet_sp_out[emmet_sp_in.indexOf(Emmet)].replace("@",EmmetProp).indexOf("|")-wholeEmmet.length
                            Main.caretEnd = Main.caretStart
                            let emmet_caret_count = output.match(/\|/g).length
                            if(emmet_caret_count>1){
                                emmet_caret = []
                                let getWarp = output
                                for(let i = 0; i < emmet_caret_count; i++){
                                    if(emmet_caret.length != 0)emmet_caret.push(getWarp.indexOf("|",(emmet_caret[i-1]+1)))
                                    else emmet_caret.push(getWarp.indexOf("|"))
                                }
                                emmet_caret_now = emmet_caret[0];
                                emmet_caret.shift();
                                emmet_caret_executed = true
                            }
                        }else if(emmet_line.includes(Emmet.toLowerCase())){
                            Main.value = SLStr.substring(0,SLStr.length-leftEmmet.length) + (`<${Emmet}${EmmetProp}>${EmmetText}` + ((!aloneTags.includes(Emmet))?`</${Emmet}>`:"") + ((!aloneTags.includes(Emmet) && EmmetRepeat>1 && !emmet_line_tags.includes(Emmet))?"\n":"")).repeat(EmmetRepeat) + SRStr.substring(rightEmmet.length,SRStr.length)
                            Main.caretStart = cursorSPos+EmmetProp.length+EmmetText.length+2-wholeEmmet.length+Emmet.length+rightEmmet.length+(EmmetText=="" ? 0:3+Emmet.length)
                            // console.log(EmmetText.length);
                            Main.caretEnd = Main.caretStart
                        }
                    }
                }
            }else{
                if(emmet_caret_executed){
                    Main.caretStart = Main.caretStart+emmet_caret[0]-1-emmet_caret_now;
                    Main.caretEnd = Main.caretStart;
                    emmet_caret_now = emmet_caret[0];
                    emmet_caret.shift();
                    if(emmet_caret.length==0)emmet_caret_executed = false;
                }else{
                    Main.value = SLStr + "\t" + SRStr;
                    Main.caretEnd = cursorSPos + 1;
                }
            }
        }
        else if(keyCode == 13){//Enterキー
            event.preventDefault();
            const Left = Main.allLines[Main.caret.y].substring(0,Main.caret.x)
            let Tabs = 0
            let move = 1
            for(let i=0;i < Left.length; i++){ if(Left[i]=="\t")Tabs++; else break }
            if(cursorSPos==cursorEPos){
                const CLR = [SLStr[SLStr.length-1],SRStr[0],SRStr[1]]
                const line = Main.allLines[Main.caret.y].substring(0,Main.caret.x)//>の前のラインを全て取得
                const BTextR = Code.substring(0,cursorSPos).split("").reverse().join("").toLowerCase()
                const inScript = (BTextR.includes('>tpircs<')&&!(BTextR.includes('>tpircs/<')))||(BTextR.includes('>tpircs<')&&BTextR.includes('>tpircs/<')&&BTextR.search(">tpircs<")<BTextR.search(">tpircs/<"))
                const inStyle = (BTextR.includes('>elyts<')&&!(BTextR.includes('>elyts/<')))||(BTextR.includes('>elyts<')&&BTextR.includes('>elyts/<')&&BTextR.search(">elyts<")<BTextR.search(">elyts/<"))
                if((inScript && doubleChar1[0].includes(CLR[0]) && CLR[1]==doubleChar1[1][doubleChar1[0].indexOf(CLR[0])])||(inStyle && CLR[0]=="{" && CLR[1]=="}")){
                    Main.value = SLStr + "\n"+"\t".repeat(Tabs+1)+"\n"+"\t".repeat(Tabs) + SRStr;
                    move = 2
                }
                else if(CLR[0]==">"&&CLR[1]=="<"&&CLR[2]=="/"){
                    const getReverse = line.split("").reverse().join("")
                    const getTagNum = getReverse.indexOf("<")
                    let TAG
                    let R_TAG
                    if(getTagNum > -1){
                        const tagGet = getReverse.substring(0,getTagNum).split("").reverse().join("")
                        if(tagGet.includes('>') && (tagGet.replace(/ /g,"")!="") && (tagGet[tagGet.length-2]!="/")){
                            const tag = tagGet.split(" ")
                            let tagNum = 0
                            for(let i = 0;i < tag.length;i++) if(tag[i]!=""){tagNum = i;break}
                            if(!tag[tagNum].includes("/")&&tag[tagNum].replace(/[a-zA-Z]/g,"").replace(/\d/g,"")==">"&&!aloneTags.includes(tag[tagNum].toLowerCase())){
                                const right = Main.allLines[Main.caret.y].substring(Main.caret.x,Main.allLines[Main.caret.y].length)
                                const getRTagNum = right.indexOf(">")
                                let Rtag = ""
                                if(getTagNum > -1){
                                    Rtag = right.substring(0,getRTagNum);
                                    TAG = tag[tagNum].substring(0,tag[tagNum].length-1)
                                    R_TAG = tag[tagNum].substring(0,Rtag.length-2)
                                }
                            }
                        }
                    }
                    if(TAG==R_TAG){
                        Main.value = SLStr + "\n"+"\t".repeat(Tabs+1)+"\n"+"\t".repeat(Tabs) + SRStr;
                        move = 2
                    }
                    else Main.value = SLStr + "\n"+"\t".repeat(Tabs) + SRStr;
                }
                else Main.value = SLStr + "\n"+"\t".repeat(Tabs) + SRStr;
            }
            else Main.value = SLStr + "\n"+"\t".repeat(Tabs) + SRStr;
            Main.caretEnd = cursorSPos + move+Tabs
        }
        else if(key == ">" && cursorEPos==cursorSPos){
            event.preventDefault();
            setTimeout(() => {
                let addTxt = ">"
                const line = Main.allLines[Main.caret.y].substring(0,Main.caret.x)//>の前のラインを全て取得
                const BTextR = Code.substring(0,cursorSPos).split("").reverse().join("").toLowerCase()
                const inScript = (BTextR.includes('>tpircs<')&&!(BTextR.includes('>tpircs/<')))||(BTextR.includes('>tpircs<')&&BTextR.includes('>tpircs/<')&&BTextR.search(">tpircs<")<BTextR.search(">tpircs/<"))
                const inStyle = (BTextR.includes('>elyts<')&&!(BTextR.includes('>elyts/<')))||(BTextR.includes('>elyts<')&&BTextR.includes('>elyts/<')&&BTextR.search(">elyts<")<BTextR.search(">elyts/<"))
                const singleQ = Code.substring(0,cursorEPos).match(/\'/g)
                const doubleQ = Code.substring(0,cursorEPos).match(/\"/g)
                const inTag = (BTextR.indexOf("<"))<(BTextR.indexOf(">")) || (BTextR.includes("<")&&!BTextR.includes(">"))
                const inStr = (inTag && ((singleQ!=null && singleQ.length%2==1)||(doubleQ!=null && doubleQ.length%2==1)))
                if(!inScript&&!inStyle&&!inStr){
                    const getReverse = line.split("").reverse().join("")
                    const getTagNum = getReverse.indexOf("<")
                    if(getTagNum > -1){
                        const tagGet = getReverse.substring(0,getTagNum).split("").reverse().join("")
                        if(!tagGet.includes('>') && (tagGet.replace(/ /g,"")!="") && (tagGet[tagGet.length-1]!="/")){
                            const tag = tagGet.split(" ")
                            let tagNum = 0
                            for(let i = 0;i < tag.length;i++) if(tag[i]!=""){tagNum = i;break}
                            if(!tag[tagNum].includes("/")&&tag[tagNum].replace(/[a-zA-Z]/g,"").replace(/\d/g,"")==""&&!aloneTags.includes(tag[tagNum].toLowerCase())){
                                const right = Main.allLines[Main.caret.y].substring(Main.caret.x,Main.allLines[Main.caret.y].length)
                                const getRTagNum = right.indexOf(">")
                                let Rtag = ""
                                if(getTagNum > -1){
                                    Rtag = right.substring(0,getRTagNum);
                                }
                                if(!(Rtag=="</"+tag[tagNum]))addTxt = "></"+tag[tagNum]+">"
                            }
                        }
                    }
                }
                Main.value = SLStr + addTxt + SRStr;
                Main.caretEnd = cursorSPos + 1;
            }, 0);
        }
        else if(keyCode == 8){//Backspaceキー
            if((doubleChar1[0].includes(backChar)||doubleChar2.includes(backChar))&&cursorEPos==cursorSPos){
                event.preventDefault();
                Main.value = SLStr.substring(0,SLStr.length-1) + SRStr.substring(1,SRStr.length);
                Main.caretEnd = SLStr.length-1
                backChar=""
            }
        }
        else if(doubleChar1[0].includes(key)) {
            event.preventDefault();
            if(cursorSPos==cursorEPos){
                Main.value = SLStr + key+doubleChar1[1][doubleChar1[0].indexOf(key)] + SRStr;
                Main.caretEnd = cursorSPos + 1;
                backChar=key
            }else{
                Main.value = SLStr + key + CStr + doubleChar1[1][doubleChar1[0].indexOf(key)] + ERStr
                Main.caretEnd = cursorEPos + 1;
                Main.caretStart = cursorSPos + 1 ;
            }
        }
        else if(doubleChar1[1].includes(key)){
            if(cursorSPos==cursorEPos){
                event.preventDefault();
                if(backChar != doubleChar1[0][doubleChar1[1].indexOf(key)]) Main.value = SLStr + key + SRStr;
                Main.caretEnd = cursorSPos + 1;
                Main.caretStart = Main.caretEnd
                backChar = ""
            }
        }
        else if(doubleChar2.includes(key)){
            event.preventDefault();
            if(cursorSPos==cursorEPos){
                if(backChar==key)backChar=""
                else{
                    if((doubleChar2.includes(Code[cursorSPos-1]))||(doubleChar2.includes(Code[cursorSPos]))){
                        Main.value = SLStr+key+SRStr
                        backChar=""
                    }
                    else{
                        Main.value = SLStr+key+key+SRStr
                        backChar=key
                    }
                }
                Main.caretEnd = cursorSPos + 1;
                Main.caretStart = Main.caretEnd
            }else{
                Main.value = SLStr + key + CStr + key + ERStr
                Main.caretEnd = cursorEPos + 1;
                Main.caretStart = cursorSPos + 1 ;
            }
        }
        else if(!((16<=keyCode&&keyCode<=18)||(keyCode==27)||(173<=keyCode&&keyCode<=179)||(keyCode==91)||(112<=keyCode&&keyCode<=115)||(keyCode==13)))backChar=""
        if((37<=keyCode && keyCode<=40) || keyCode==46)emmet_caret_executed = false
    }
    ReloadInfo()
}

function ShortcutKey(e){
    if((e.ctrlKey && !isMac) || (e.metaKey && isMac)){
        switch(e.keyCode){
            case 83: //S
                e.preventDefault()
                !e.shiftKey
                    ?WriteCode()
                    :KeepCode(true)
                break
            case 79: //O
                e.preventDefault()
                !e.shiftKey
                    ?ReadCode()
                    :KeepCode(false)
                break
            case 80: //P
                e.preventDefault()
                PreviewCode(e.shiftKey)
                break
            case 67: //C
                if(e.shiftKey){
                    e.preventDefault()
                    CopyCode()
                }
            case 75:
                if(e.shiftKey){
                    e.preventDefault()
                    KeepCode()
                }
                break
            case 188:
                FontSizeChange()
                break
            default:
                return false
        }
    }
    // else if(e.altKey){
    // }
}

function MainClick(){
    ReloadInfo()
    emmet_caret_executed = false
}
function MainInput(){
    ReloadInfo()
}

function ReloadInfo(){
    setTimeout(() => {
        document.getElementById('MainChar').innerText=Main.value.length
        document.getElementById('MainSelectChar').innerText= (Main.caretStart==Main.caretEnd)? Main.caretStart:"."+(Main.caretEnd-Main.caretStart)
        const n = Main.value.replace(/_/g,'u').replace(/\n/g,'_').match(/_/g)
        document.getElementById('MainLine').innerText= (n==null) ? 1 :n.length+1
        const nss = Main.value.substring(0,Main.caretStart).match(/\n/g)
        const nse = Main.value.substring(0,Main.caretEnd).match(/\n/g)
        const ns = [(nss==null)?1:nss.length+1,(nse==null)?1:nse.length+1]
        document.getElementById('MainSelectLine').innerHTML= (ns[0]==ns[1])? ns[0]:"<span title='"+(ns[1]-ns[0])+"'>"+ns[0]+":"+ns[1]+"</span>"
        SB_ToolsMenu()
        // if(Main.elem.scrollHeight > Main.elem.clientHeight)document.getElementById("toolsMenu").style.right = "28px";
        // else document.getElementById("toolsMenu").style.right = "8px";
    }, 0);
}
function SB_ToolsMenu(){
    toolsMenu.style.right = Main.YScrollBar?"1.8%":"0.5%"
    toolsMenu.style.bottom = Main.XScrollBar?"9.1%":"6.8%"
    toolsMenu.style.height = Main.XScrollBar?"81.7%":"84.8%"
}

let ToolsMenuVisible = false
function ToolsMenu(){
    Main.elem.focus()
    ToolsMenuVisible=!ToolsMenuVisible
    const elem = document.getElementById("toolsMenu")
    if(ToolsMenuVisible){
        elem.style.display = "inline-block"
        let i = 0;
        const opacityLoop = setInterval(() => {
            elem.style.opacity = i/100
            i+=10;
            if(i == 100)clearInterval(opacityLoop);
        }, 0.015);
    }
    else{
        elem.style.opacity = 0
        setTimeout(() => {
            elem.style.display = "none"
        }, 150);
    }
}

let ReplaceFrom = ""
let ReplaceTo = ""
let ReplaceMode = [false,false]
function toggleReplaceMode(n){
    ReplaceMode[n]=!ReplaceMode[n]
    if(ReplaceMode[n]){
        document.getElementById('replaceModeBtn'+n).style.color = "#ffffff"
        document.getElementById('replaceModeBtn'+n).style.backgroundColor = "rgba(255,255,255,0.45)"
    }else{
        document.getElementById('replaceModeBtn'+n).style.color = "rgb(200,200,200)"
        document.getElementById('replaceModeBtn'+n).style.removeProperty('background-color')
    }
}
function ReplaceCode(bool){
    Main.replace(ReplaceFrom,ReplaceTo,bool,ReplaceMode[0],ReplaceMode[1])
    ReloadInfo()
}

function calculate(expression) {
    if (/[^0-9+\-*/().]/g.test(expression)) {
      return NaN; // 数学式になり得ない文字が含まれている場合はNaNを返す
    }
    try {
        return eval(expression);
    } catch (e) {
      return NaN; // 数学式になり得ない構文が含まれている場合はNaNを返す
    }
}

let Expression = ""
function SolveExpression(){
    const Value = document.getElementById('Expression').value
    let result = ""
    if(Value != Value.replace(/\d+/)){
        const E = Value.replace(/ /g,"").replace(/\^/g,"**").replace(/\}/g,")").replace(/\{/g,"(").replace(/\)\(/g,")*(").replace(/(\d+)\(/g,'$1*(')
        result = calculate(E)
    }
    document.getElementById('Answer').value = result
}

function HexToRgb ( hex ) {
	if ( hex.slice(0, 1) == "#" ) hex = hex.slice(1) ;
	if ( hex.length == 3 ) hex = hex.slice(0,1) + hex.slice(0,1) + hex.slice(1,2) + hex.slice(1,2) + hex.slice(2,3) + hex.slice(2,3) ;

	return [ hex.slice( 0, 2 ), hex.slice( 2, 4 ), hex.slice( 4, 6 ) ].map( function ( str ) {
		return parseInt( str, 16 ) ;
	} ) ;
}
function ColorViewer(val){
    document.getElementById('ColorHEX').innerText = val
    document.getElementById('ColorRGB').innerText = `rgb(${HexToRgb(val)})`
}

let colorPalette = ["#ff0000","#ffa500","#ffff00","#008000","#00bfff","#0000ff","#800080","#ffffff"]
function selectColorPalette(n){
    document.getElementById("ColorViewer").value = colorPalette[n]
    ColorViewer(colorPalette[n])
}

function saveColorPalette(val){
    colorPalette.push("")
    for(let i = 0; i<colorPalette.length; i++)colorPalette[colorPalette.length-i] = colorPalette[colorPalette.length-1-i]
    colorPalette.splice()
    colorPalette[0] =val
    for(let i = 0; i<colorPalette.length; i++)document.getElementById(`ColorPalette${i}`).style.backgroundColor = colorPalette[i]
}