//Components.utils.import("resource://nicolivehelpermodules/sharedobject.jsm");

/**
 * コメント
 */
var NicoLiveComment = {
    ostream: null,    // ログファイル(アリーナ)

    comment_table: null,     // $('comment-table')
    auto_kotehan: null,      // $('auto-kotehan')
    kotehan_overwrite: null, // $('kotehan-allowoverwrite')
    kotehan_refprof: null,   // $('kotehan-ref-userprof')

    commentlog: [],    // アリーナ席のコメントログ
    colormap: {},      // 配色マップ
    namemap: {},       // コテハンマップ

    /**
     * コメントの表示のみをクリアする.
     */
    clear: function(){
	clearTable( this.comment_table );
    },

    /**
     * コメント表示に追加する.
     * @param comment コメント
     * @param target_room コメントのルーム
     */
    addComment: function( comment, target_room ){
	let table = this.comment_table;
	if(!table){ return; }

	// 表示行数に切り詰め
	if( table.rows.length >= Config.comment.view_lines ){
	    table.deleteRow(table.rows.length-1);
	}
	
	//let tr = table.insertRow(table.rows.length);
	let tr = table.insertRow(0);
	tr.setAttribute("tr_comment_by", comment.user_id);

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
	td.innerHTML = "<hbox style=\"width:10em; overflow:hidden; margin-right:4px;\" comment_by=\""+comment.user_id+"\" class=\"selection\" tooltiptext=\""+(comment.user_id)+"\" context=\"popup-comment-user\" user_id=\""+comment.user_id+"\" comment_no=\""+comment.no+"\">"+str+"</hbox>";

	// コメントボディのセル
	td = tr.insertCell(tr.cells.length);
	str = comment.text_notag;
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
	str = str.replace(/((sm|nm)\d+)/g,"<hbox class=\"selection\" todo_context=\"popup-comment-anchor\"><html:a onmouseover=\"NicoLiveWindow.showThumbnail(event,'$1');\" onmouseout=\"NicoLiveWindow.hideThumbnail();\" onclick=\"NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/watch/$1');\">$1</html:a></hbox>");
	if( comment.premium!=3 ){
	    // 数字10桁にもリンク.
	    if( !str.match(/(sm|nm)\d+/) ){
		str = str.replace(/(\d{10})/g,"<html:a onmouseover=\"NicoLiveWindow.showThumbnail(event,'$1');\" onmouseout=\"NicoLiveWindow.hideThumbnail();\" onclick=\"NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/watch/$1');\">$1</html:a>");
	    }
	}
	try{
	    td.innerHTML = "<hbox flex=\"1\" class=\"selection\" context=\"popup-comment-body\">"+str+"</hbox>";
	} catch (x) {
	    debugprint(x);
	    debugprint(str);
	}

	// コメント日時のセル
	td = tr.insertCell(tr.cells.length);
	td.textContent = GetDateString(comment.date*1000);

	this.autoKotehan( comment, target_room );
    },

    /**
     * アリーナ席のコメントログに追加する.
     * TODO ファイルに保存も行う。
     * @param chat コメント
     * @param target_room コメントのルーム(未使用)
     */
    addCommentLog: function( chat, target_room ){
	if( this.commentlog.length >= Config.comment.view_lines ){
	    this.commentlog.shift();
	}
	this.commentlog.push( chat );
	
	if( Config.comment.savefile ){
	    // ファイルに保存
	    this.writeFile( chat );
	}
    },

    /**
     * アリーナ席のコメント表示を復元.
     */
    revertArenaComment: function(){
	for( let i=0, comment; comment=this.commentlog[i]; i++ ){
	    this.addComment( comment, ARENA );
	}
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

    /**
     * コメントのフォントサイズを変更する.
     * @param size フォントサイズ(ポイント)
     */
    changeFontScale:function(size){
	if( !size ){ debugprint('font size is default 9pt.'); size = 9; }
	$('comment-table').style.fontSize = size+"pt";
	$('comment-font-scale-value').value = size + "pt";
    },


    /**
     * ID欄でのポップアップメニューの表示処理.
     * @param node ポップアップしたノード.
     */
    showPopupMenuForID:function(node){
	let userid = node.getAttribute('user_id');
	let commentno = node.getAttribute('comment_no');
	$('popup-comment-displayuserid').value = "No."+commentno+"/" + userid;
	if(userid>0){
	    $('popup-comment-openprofile').hidden = false;
	}else{
	    $('popup-comment-openprofile').hidden = true;
	}
    },

    /**
     * プロフィールページを開く.
     * @param node メニューがポップアップしたノード
     */
    openProfile:function(node){
	let userid = node.getAttribute('user_id');
	if(userid>0){
	    NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/user/'+userid);
	}
    },

    /**
     * プロフィールから名前を取得
     * @param user_id ユーザーID
     */
    // http://www.nicovideo.jp/user/... から登録(サムネから取れない時)
    getProfileName2: function(user_id, defname, postfunc){
	let req = new XMLHttpRequest();
	if( !req ) return;
	req.onreadystatechange = function(){
	    if( req.readyState==4 ){
		if( req.status==200 ){
		    try{
			let text = req.responseText;
			let name = text.match(/<h2><strong>(.*)<\/strong>/)[1];
			if( name ){
			    // 名前の取得に成功
			    postfunc( name );
			}
		    } catch (x) {
			postfunc( defname );
		    }
		}else{
		    postfunc( defname );
		}
	    }
	};
	req.open('GET', 'http://www.nicovideo.jp/user/'+user_id );
	req.send("");
    },

    /**
     * プロフィールの名前を取得.
     * @param user_id ユーザーID
     * @param defname デフォルト名
     * @param postfunc 取得成功後に実行する関数
     */
    // http:/ext.nicovideo.jp/thumb_user/... から登録(こちら優先)
    getProfileName: function(user_id, defname, postfunc){
	let req = new XMLHttpRequest();
	if( !req ) return;
	req.onreadystatechange = function(){
	    if( req.readyState==4 ){
		if( req.status==200 ){
		    try{
			let text = req.responseText;
			let name = text.match(/><strong>(.*)<\/strong>/)[1];
			if( name ){
			    // 成功
			    postfunc( name );
			}else{
			    NicoLiveComment.getProfileName2(user_id, defname, postfunc);
			}
		    } catch (x) {
			NicoLiveComment.getProfileName2(user_id, defname, postfunc);
		    }
		}else{
		    NicoLiveComment.getProfileName2(user_id, defname, postfunc);
		}
	    }
	};
	req.open('GET', 'http://ext.nicovideo.jp/thumb_user/'+user_id );
	req.send("");
    },

    /**
     * コテハン登録.
     * @param node メニューがポップアップしたノード.
     */
    addName:function(node){
	let userid = node.getAttribute('user_id');
	this.addNameFromId(userid);
    },

    /**
     * コテハンを登録する
     * @param userid ユーザーID
     */
    addNameFromId:function(userid){
	if( !userid ) return;

	if( !this.namemap[userid] && userid>0 ){
	    let f = function(name){
		let newname = InputPrompt( LoadFormattedString('STR_TEXT_SET_KOTEHAN',[userid]),
					   LoadString('STR_CAPTION_SET_KOTEHAN'),
					   name);
		NicoLiveComment.setName(userid,newname);
	    };
	    this.getProfileName(userid, userid, f);
	}else{
	    let name = InputPrompt( LoadFormattedString('STR_TEXT_SET_KOTEHAN',[userid]),
				    LoadString('STR_CAPTION_SET_KOTEHAN'),
				    this.namemap[userid]?this.namemap[userid].name:userid);
	    this.setName(userid,name);
	}

	let id;
	for(id in this.namemap){
	    if( id>0 ) continue;
	    // 1週間経った匿名ユーザーのものは削除.
	    if( now-this.namemap[id].date > 7*24*60*60 ){
		delete this.namemap[id];
	    }
	}

	// TODO
	//this.addKotehanDatabase(userid,name);
	//this.createNameList();
    },

    /**
     * コメントの名前部分のみ更新.
     * @param user_id ユーザID
     * @param name 名前(false扱いにあるデータの場合はユーザIDに戻す)
     */
    updateCommentsName:function(user_id,name){
	let elems = evaluateXPath(document,"//*[@comment_by=\""+user_id+"\"]");
	if( !name ) name = user_id;
	for(let i=0,elem; elem=elems[i]; i++){
	    elem.textContent = name;
	}
    },

    /**
     * ユーザーに名前を設定し、表示を更新する.
     * @param userid ユーザーID
     * @param name 名前(空だと設定クリア)
     */
    setName: function( userid, name ){
	if( !name ){
	    delete this.namemap[userid];
	}else{
	    let now = GetCurrentTime();
	    this.namemap[userid] = {'name':name, 'date':now };
	}
	this.updateCommentsName(userid, name);
    },

    /**
     * コメントの背景色を更新する.
     * @param userid ユーザーID
     * @param color 色(nullとかundefinedなら無指定)
     */
    updateCommentsBackgroundColor: function(userid, color){
	let elems = evaluateXPath(document,"//html:tr[@tr_comment_by=\""+userid+"\"]");
	for(let i in elems ){
	    let tr = elems[i];
	    if( color ){
		tr.style.backgroundColor = color;
	    }else{
		tr.style.backgroundColor = "";
	    }
	}
    },

    /**
     * 自動コテハン登録
     */
    autoKotehan: function( chat, target_room ){
	// 名前が付いていない
	if( !this.auto_kotehan.checked ) return;
	if( chat.premium==2 || chat.premium==3 ) return;
	if( chat.date<NicoLiveHelper.connecttime ) return; // 過去ログ無視.

	if( this.kotehan_refprof.checked && chat.user_id.match(/^\d+$/) && !this.namemap[chat.user_id] ){
	    // ユーザIDからプロフィール参照登録.
	    let f = function(name){
		NicoLiveComment.setName( chat.user_id, name );
	    };
	    this.getProfileName( chat.user_id, chat.user_id, f );
	    return;
	}

	let dat = chat.text.match(/[@＠]([^0-9０-９\s@＠][^\s@＠]*?)$/);
	if(dat){
	    let name = dat[1];
	    debugprint(name);
	    if( name=="初見" || name=="確認" || name=="アンケート" ||
		name=="削除" || name=="代理" ) return;
	    if( name=="○" || name=="×" || name=="△" ||
		name=="□" || name=="◎") return;
	    if( !this.namemap[chat.user_id] || this.kotehan_overwrite.checked ){
		// コテハン設定をする
		this.setName( chat.user_id, name );
	    }
	    
	}
    },

    /**
     * 色設定をクリアする
     * @param node メニューを出したノード
     */
    clearColorSetting:function(node){
	let userid = node.getAttribute('user_id');
	delete this.colormap[userid];
	this.updateCommentsBackgroundColor(userid);
    },

    /**
     * 色を変更する.
     * @param node メニューを出したノード
     */
    changeColor:function(node){
	let userid = node.getAttribute('user_id');
	let color = $('comment-color').color;
	if( !color ) return;
	let now = GetCurrentTime();
	this.colormap[userid] = {"color":color,"date":now};
	for(id in this.colormap){
	    if( id>0 ) continue;
	    // 1週間経った匿名ユーザーのものは削除.
	    if( now-this.colormap[id].date > 7*24*60*60 ){
		delete this.colormap[id];
	    }
	}
	this.updateCommentsBackgroundColor(userid, color);
    },

    copyComment: function(elem){
	CopyToClipboard( elem.textContent );
    },

    /**
     * コメントをファイルに書く.
     * @param item コメントデータ
     */
    writeFile:function(item){
	if(this.ostream){
	    let str;
	    let datestr = GetDateString(item.date*1000);
	    str = item.no+'\t'+item.user_id+'\t'+item.text+'\t'+datestr+"\r\n";
	    this.ostream.writeString(str);
	}
    },

    /**
     * ログファイルを開く
     */
    openFile:function(request_id, community){
	let f = Config.getCommentDir();
	if(!f) return;
	if( community ){
	    f.append(community);
	    CreateFolder(f.path);
	}
	// TODO
	//let fname = NicoLivePreference.getUnichar("logfile-name");
	//fname = this.getLogfileName(fname);
	let fname = request_id;
	f.append(fname+'.txt');
	let file;
	let os;
	this.closeFile();

	// TODO
	/*
	var cnt=2;
	if( NicoLivePreference.getBool("new-logfile") ){
	    while( f.exists() ){
		debugprint("already exists comment log file:"+f.path);
		f.leafName = fname+"_"+cnt+".txt";
		cnt++;
	    }
	}
	 */

	try{
	    file = OpenFile(f.path);
	} catch (x) {
	    f = Config.getCommentDir();
	    if( community ){
		f.append(community);
		CreateFolder(f.path);
	    }
	    f.append(request_id+".txt");
	    file = OpenFile(f.path);
	}
	debugprint('open comment log:'+f.path);

	os = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	let flags = 0x02|0x10|0x08;// wronly|append|create
	os.init(file,flags,0664,0);

	let cos = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
	cos.init(os,"UTF-8",0,Components.interfaces.nsIConverterOutputStream.DEFAULT_REPLACEMENT_CHARACTER);

	this.ostream = cos;

	cos.writeString('--- '+NicoLiveHelper.liveinfo.title+' ---\r\n');
    },
    closeFile:function(){
	try{
	    this.ostream.close();
	} catch (x) {
	}
    },

    init: function(){
	debugprint("NicoLiveComment.init");
	this.comment_table = $('comment-table');
	this.auto_kotehan  = $('auto-kotehan');
	this.kotehan_overwrite = $('kotehan-allowoverwrite');
	this.kotehan_refprof   = $('kotehan-ref-userprof');

	this.changeFontScale( $('comment-font-scale').value );

	this.namemap  = Storage.readObject( "nico_namemap", {} );
	this.colormap = Storage.readObject( "nico_colormap", {} );
    },
    destroy: function(){
	Storage.writeObject( "nico_namemap", this.namemap );
	Storage.writeObject( "nico_colormap", this.colormap );
    }
};

window.addEventListener("load", function(e){ NicoLiveComment.init(); }, false);
window.addEventListener("unload", function(e){ NicoLiveComment.destroy(); }, false);
