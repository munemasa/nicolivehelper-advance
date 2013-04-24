
/**
 * 検索条件入力行を追加する.
 */
function AddSearchLine(){
    let menulist;
    let elem;
    let hbox = CreateElement('hbox');
    elem = CreateElement('menupopup');
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_TITLE"),0));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_LENGTH"),1));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_VIEWS"),2));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_COMMENTS"),3));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_MYLISTS"),4));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_TAGS"),5));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_POSTEDDATE"),6));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_VIDEOID"),7));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_DESC"),8));
    menulist = CreateElement('menulist');
    menulist.appendChild(elem);
    hbox.appendChild(menulist);

    elem = CreateElement('menupopup');
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_INCLUDE"),0));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_EXCLUDE"),1));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_GTE"),2));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_EQUAL"),3));
    elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_LTE"),4));
    menulist = CreateElement('menulist');
    menulist.appendChild(elem);
    hbox.appendChild(menulist);
    
    elem = CreateElement('textbox');
    elem.setAttribute('flex','1');
    elem.setAttribute('type','search');
    //elem.setAttribute('autocompletesearch','form-history');
    //elem.setAttribute("oncommand","Database.search();");
    //elem.setAttribute('timeout','2000');
    hbox.appendChild(elem);
    
    //elem = CreateButton('+');
    //elem.addEventListener('command',function(e){ Database.addSearchLine();}, false);
    elem = CreateHTMLElement('input');
    elem.setAttribute('type','button');
    elem.setAttribute('value','+');
    elem.setAttribute("onclick","AddSearchLine();");
    hbox.appendChild(elem);
    
    //elem = CreateButton('-');
    //elem.addEventListener('command',function(e){ Database.removeSearchLine(e);}, false);
    elem = CreateHTMLElement('input');
    elem.setAttribute('type','button');
    elem.setAttribute('value','-');
    elem.setAttribute("onclick","RemoveSearchLine(event);");
    hbox.appendChild(elem);
    $('search-condition').appendChild(hbox);
}


function RemoveSearchLine(e){
    let hbox = $('search-condition').getElementsByTagName('hbox');
    if(hbox.length<=1) return;
    $('search-condition').removeChild(e.target.parentNode);
}

function Init(){
    AddSearchLine();
}

function Destroy(){
    
}

window.addEventListener("load", function(e){ Init(); }, false);
window.addEventListener("unload", function(e){ Destroy(); }, false);
