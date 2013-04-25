
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

function GetSearchCond(){
    // 検索条件をフォームから全て抽出.
    let hbox = $('search-condition').getElementsByTagName('hbox');
    let searchcond = new Array();
    for(let i=0,item;item=hbox[i];i++){
	let menulist = item.getElementsByTagName('menulist');
	let textbox  = item.getElementsByTagName('textbox');
	if(!textbox[0].value) continue;
	
	let cond = new Object();
	cond.key = menulist[0].value;  // 検索キー(タイトル,投稿日,...)
	cond.cond = menulist[1].value; // 条件(以上,以下,...)
	cond.text = textbox[0].value;  // 値
	searchcond.push( cond );
    }
    return searchcond;
}

/**
 * 呼び出し元に返す値をセット.
 */
function SetResult(){
    window.arguments[0].result = GetSearchCond();
    window.arguments[0].name = $('list-name').value;
}

function Init(){
    AddSearchLine();

    $('list-name').value = window.arguments[0].name;
}

function Destroy(){
    
}

window.addEventListener("load", function(e){ Init(); }, false);
window.addEventListener("unload", function(e){ Destroy(); }, false);
