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
    document.getElementById('theme').href=`theme${val}.css`
}

function FontSizeChange(){
    Main.elem.focus()
    const slider = document.getElementById('fontSizeSlider')
    if(slider.value == 80)slider.value = 16;
    else slider.value = Number(slider.value)+4;
    Main.elem.style.fontSize=slider.value
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
    else if(bool==false){Main.value = localStorage.getItem('Code')}
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
        else if(keyCode==88 && cursorSPos==cursorEPos){
            event.preventDefault()
            navigator.clipboard.writeText(Main.allLines[Main.caret.y])
            Main.editLine(Main.caret.y,"")
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
        else if(keyCode==86 && event.shiftKey){
            event.preventDefault()
            if(CopyHistory.length != 0){
                Main.value = SLStr +CopyHistory[PasteHistory]+ ERStr
                Main.caretStart = cursorSPos
                Main.caretEnd = cursorEPos+CopyHistory[PasteHistory].length
                PasteHistory++
                if(PasteHistory >= CopyHistory.length)PasteHistory = 0
            }
        }
    }
    else if(event.altKey){
        event.preventDefault()
        if(keyCode==38 && cursorSPos==cursorEPos){
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
            Main.value = SLStr + "\t" + SRStr;
            Main.caretEnd = cursorSPos + 1;
        }
        else if(keyCode == 13){//Enterキー
            event.preventDefault();
            const Left = Main.allLines[Main.caret.y].substring(0,Main.caret.x)
            let Tabs = 0
            let move = 1
            for(let i=0;i < Left.length; i++){ if(Left[i]=="\t")Tabs++; else break }
            if(cursorSPos==cursorEPos){
                const CLR = [SLStr[SLStr.length-1],SRStr[0]]
                const line = Main.allLines[Main.caret.y].substring(0,Main.caret.x)//>の前のラインを全て取得
                const BTextR = Code.substring(0,cursorSPos).split("").reverse().join("").toLowerCase()
                const inScript = (BTextR.includes('>tpircs<')&&!(BTextR.includes('>tpircs/<')))||(BTextR.includes('>tpircs<')&&BTextR.includes('>tpircs/<')&&BTextR.search(">tpircs<")<BTextR.search(">tpircs/<"))
                const inStyle = (BTextR.includes('>elyts<')&&!(BTextR.includes('>elyts/<')))||(BTextR.includes('>elyts<')&&BTextR.includes('>elyts/<')&&BTextR.search(">elyts<")<BTextR.search(">elyts/<"))
                if((inScript && doubleChar1[0].includes(CLR[0]) && CLR[1]==doubleChar1[1][doubleChar1[0].indexOf(CLR[0])])||(inStyle && CLR[0]=="{" && CLR[1]=="}")){
                    Main.value = SLStr + "\n"+"\t".repeat(Tabs+1)+"\n"+"\t".repeat(Tabs) + SRStr;
                    move = 2
                }
                else if(CLR[0]==">"&&CLR[1]=="<"){
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
                const inStr = ((singleQ!=null && singleQ.length%2==1)||(doubleQ!=null && doubleQ.length%2==1))
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
        else if(!((16<=keyCode&&keyCode<=18)||(keyCode==27)||(173<=keyCode&&keyCode<=179)||(keyCode==91)||(112<=keyCode&&keyCode<=115)))backChar=""
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
        toolsMenu.style.right = Main.YScrollBar?"28px":"8px"
        toolsMenu.style.bottom = Main.XScrollBar?"9.1%":"6.8%"
        toolsMenu.style.height = Main.XScrollBar?"81.7%":"84%"
        // if(Main.elem.scrollHeight > Main.elem.clientHeight)document.getElementById("toolsMenu").style.right = "28px";
        // else document.getElementById("toolsMenu").style.right = "8px";
    }, 0);
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
function ReplaceCode(bool){
    Main.replace(ReplaceFrom,ReplaceTo,bool)
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