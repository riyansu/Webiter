const hashMenus = ["#Introduction","#Help","#ReleaseNotes"]
let Menu = 0
let SwitchMenu = false

window.onload=()=>{
    pageURL()
}
window.onhashchange=()=>{
    if(!SwitchMenu){
        pageURL()
    }
    SwitchMenu = false
}

function pageURL(){
    if(hashMenus.includes(window.location.hash)){
        selectMenu(hashMenus.indexOf(window.location.hash))
    }else selectMenu(0) 
}

function selectMenu(n){
    SwitchMenu = true
    document.getElementById("menu"+Menu).classList.add("menuBtn-default")
    document.getElementById("menu"+Menu).classList.remove("menuBtn-selected")
    document.getElementById("menu"+n).classList.remove("menuBtn-default")
    document.getElementById("menu"+n).classList.add("menuBtn-selected")
    document.getElementById('page'+Menu).style.display = "none"
    document.getElementById('page'+n).style.display = "block"
    Menu = n
    window.location.hash = hashMenus[n]
}