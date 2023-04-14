class textarea{
    constructor(id){
        this.elem = document.getElementById(id)
        if(this.elem){
            if(this.elem.tagName.toLowerCase() != "textarea"){
                try{throw new Error();}
                catch(error){
                    console.error("Richtml/textarea Error > 指定された要素がtextareaではありません\n"+error.stack.split("\n")[2])
                }
            }
        }
        else{
            try{throw new Error();}
            catch(error){
                console.error("Richtml/textarea Error > 要素の読み込みに失敗しました\n"+error.stack.split("\n")[2])
            }
        }
    }

    //Useful Customized Default Property
    get value(){
        return this.elem.value
    }
    set value(val){
        this.elem.value = val
    }

    get caretStart(){
        return this.elem.selectionStart
    }
    get caretEnd(){
        return this.elem.selectionEnd
    }
    set caretStart(val){
        this.elem.selectionStart = val
    }
    set caretEnd(val){
        this.elem.selectionEnd = val
    }

    //EX Property
    get allLines(){
        return this.elem.value.split("\n")
    }

    get selection(){
        if(this.elem == document.activeElement) return this.elem.value.substring(this.elem.selectionStart,this.elem.selectionEnd)
        else return undefined
    }

    get caret(){
        if(this.elem == document.activeElement){
            const getX = this.elem.value.lastIndexOf("\n",this.elem.selectionStart-1)+1
            const XPos = (getX!=0 && getX!=-1)? this.elem.selectionStart-getX : this.elem.selectionStart
            const YPos = this.elem.value.substring(0,this.elem.selectionStart).split("\n").length-1
            if(this.elem.selectionStart != this.elem.selectionEnd){
                const E_getX = this.elem.value.lastIndexOf("\n",this.elem.selectionEnd-1)+1
                const E_XPos = (E_getX!=0 && E_getX!=-1)? this.elem.selectionEnd-E_getX : this.elem.selectionEnd
                const E_YPos = this.elem.value.substring(0,this.elem.selectionEnd).split("\n").length-1
                return {x:XPos, y:YPos, end:{x:E_XPos,y:E_YPos}}
            }else{return {x:XPos, y:YPos, end:{x:XPos,y:YPos}}}
        }else return {x:undefined, y:undefined, end:{x:undefined,y:undefined}}
    }
    get caretLine(){
        return {
            start:this.allLines[this.elem.value.substring(0,this.elem.selectionStart).split("\n").length-1],
            end:this.allLines[this.elem.value.substring(0,this.elem.selectionEnd).split("\n").length-1]
        }
    }
    get XScrollBar(){
        return this.elem.scrollWidth>this.elem.clientWidth
    }
    get YScrollBar(){
        return this.elem.scrollHeight>this.elem.clientHeight
    }


    //EX Function
    replace(from,to,all){
        if(all){
            const re = new RegExp(from,"g")
            this.elem.value = this.elem.value.replace(re,to)
        }
        else this.elem.value = this.elem.value.replace(from,to)
    }
    replaceSelection(from,to,all){
        if(all){
            const re = new RegExp(from,"g")
            this.elem.value.substring(0,this.elem.selectionStart)+this.elem.value.substring(this.elem.selectionStart,this.elem.selectionEnd).replace(re,to)+this.elem.value.substring(this.elem.selectionEnd,this.elem.value.length)
        }
        else this.elem.value = this.elem.value.substring(0,this.elem.selectionStart)+this.elem.value.substring(this.elem.selectionStart,this.elem.selectionEnd).replace(from,to)+this.elem.value.substring(this.elem.selectionEnd,this.elem.value.length)
    }

    find(str){
        const searchStr = this.elem.value.search(str)
        if(searchStr!=-1){
            this.elem.selectionStart = searchStr
            this.elem.selectionEnd = searchStr+str.length
        }
    }

    setCaret(Y,X,EY=Y,EX=X){
        const ALLLINES = this.allLines
        const YPos = ALLLINES.slice(0,Math.min(Y,ALLLINES.length-1))
        const YMove = YPos.join("").length + YPos.length
        const XMove = Math.min(ALLLINES[YPos.length].length , X)
        this.elem.selectionStart = YMove+XMove

        const E_YPos = ALLLINES.slice(0,Math.min(EY,ALLLINES.length-1))
        const E_YMove = E_YPos.join("").length + E_YPos.length
        const E_XMove = Math.min(ALLLINES[E_YPos.length].length , EX)
        this.elem.selectionEnd = E_YMove+E_XMove
        // const XPos = Math.min(X,ALLLINES[YPos])
        // console.log(YPos.join("\n").length)
    }

    editLine(line,str){
        let all = this.allLines
        all[line] = str
        this.elem.value = all.join("\n")
    }
}