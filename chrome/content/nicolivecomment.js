//Components.utils.import("resource://nicolivehelpermodules/sharedobject.jsm");

/**
 * コメント
 */
var NicoLiveComment = {

    colormap: {},
    namemap: {},

    addComment: function( comment ){
	let table = $('comment-table');
	if(!table){ return; }

	// TODO 表示行数に切り詰め
	if( table.rows.length >= 1000 ){
	    table.deleteRow(table.rows.length-1);
	}
	
	//let tr = table.insertRow(table.rows.length);
	let tr = table.insertRow(0);

	// 背景色の決定
	if(!this.colormap[comment.user_id]){
	    let sel = GetRandomInt(1,8);
	    let col = 'color'+sel;
	    tr.className = col;
	    this.colormap[comment.user_id] = {"color":col, "date":GetCurrentTime()};
	}else{
	    let col = this.colormap[comment.user_id].color;
	    if( col.indexOf('color')==0 ){
		tr.className = col;
	    }else{
		tr.style.backgroundColor = col;
	    }
	}
	if( comment.premium==2 || comment.premium==3 ){
	    tr.className = "table_casterselection";
	}

	let td;
	// コメント番号のセル
	td = tr.insertCell(tr.cells.length);
	td.textContent = comment.no;

	// 名前表示のセル
	td = tr.insertCell(tr.cells.length);
	let str;
	// コメントにname属性があればその名前を使用する.
	str = comment.name || this.namemap[comment.user_id] && this.namemap[comment.user_id].name || comment.user_id;
	str = htmlspecialchars(str);
	td.innerHTML = "<hbox style=\"width:10em; overflow:hidden; margin-right:4px;\" comment_by=\""+comment.user_id+"\" class=\"selection\" tooltiptext=\""+(comment.user_id)+"\" user_id=\""+comment.user_id+"\" comment_no=\""+comment.no+"\">"+str+"</hbox>";

	// コメントボディのセル
	td = tr.insertCell(tr.cells.length);
	if(comment.premium==3 || comment.premium==2){
	    str = comment.text.replace(/<.*?>/g,""); // 主コメだけタグ除去.
	}else{
	    str = comment.text;
	}
	str = htmlspecialchars(str);
	let tmp = str.split(/(sm\d+|nm\d+|\d{10}|&\w+;)/);
	let i;
	// 長文を途中改行できるように<wbr>を埋め込む
	for(i=0;i<tmp.length;i++){
	    if( !tmp[i].match(/(sm\d+|nm\d+|\d{10}|&\w+;)/) ){
		tmp[i] = tmp[i].replace(/(.{35,}?)/g,"$1<html:wbr/>");
	    }
	}
	str = tmp.join("");
	// AA用に改行表示
	str = str.replace(/(\r\n|\r|\n)/gm,"<html:br/>");

	// sm,nmにリンクを貼り付け.
	str = str.replace(/((sm|nm)\d+)/g,"<hbox class=\"selection\" context=\"popup-comment-anchor\"><html:a onmouseover=\"NicoLiveWindow.showThumbnail(event,'$1');\" onmouseout=\"NicoLiveWindow.hideThumbnail();\" onclick=\"NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/watch/$1');\">$1</html:a></hbox>");
	if( comment.premium!=3 ){
	    // 数字10桁にもリンク.
	    if( !str.match(/(sm|nm)\d+/) ){
		str = str.replace(/(\d{10})/g,"<html:a onmouseover=\"NicoLiveWindow.showThumbnail(event,'$1');\" onmouseout=\"NicoLiveWindow.hideThumbnail();\" onclick=\"NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/watch/$1');\">$1</html:a>");
	    }
	}
	try{
	    td.innerHTML = "<hbox flex=\"1\" class=\"selection\">"+str+"</hbox>";
	} catch (x) {
	    debugprint(x);
	    debugprint(str);
	}

	// コメント日時のセル
	td = tr.insertCell(tr.cells.length);
	td.textContent = GetDateString(comment.date*1000);


    },

    /**
     * コメントを投稿する.
     * @param textbox コメント入力欄の要素
     * @param event DOMイベント
     */
    postComment:function(textbox,event){
	let str = textbox.value;
	if(event && event.keyCode != 13) return true;

	textbox.controller.searchString = "";

	// TODO update autocomplete
	/*
	let tmp = {value:str,comment:""};
	for(let i=0,item;item=this.autocomplete[i];i++){
	    if(item.value==str){
		this.autocomplete.splice(i,1);
	    }
	}
	this.autocomplete.unshift(tmp);
	if(this.autocomplete.length>10){
	    this.autocomplete.pop();
	}

	let concat_autocomplete = this.preset_autocomplete.concat( this.autocomplete );
	textbox.setAttribute("autocompletesearchparam",JSON.stringify(concat_autocomplete));
	 */

	let mail = $('textbox-mail').value;

	NicoLiveHelper.postComment(str,mail,"");

	textbox.value = "";
	return true;
    },

    init: function(){
	debugprint("NicoLiveComment.init");
    },
    destroy: function(){
    }
};

window.addEventListener("load", function(e){ NicoLiveComment.init(); }, false);
window.addEventListener("unload", function(e){ NicoLiveComment.destroy(); }, false);
