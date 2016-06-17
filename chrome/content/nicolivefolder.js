/*
Copyright (c) 2009 amano <amano@miku39.jp>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

const TYPE_FOLDER = 0;
const TYPE_VIDEO = 1;


var NicoLiveFolderDB = {
    searchtarget: ["title","length","view_counter","comment_num","mylist_counter","tags","first_retrieve","video_id","description"],
    searchcond: ["include","exclude","gte","equal","lte"],

    getDatabase:function(){
	return Database.dbconnect;
    },

    /**
     * 指定のリストIDに指定の動画IDが存在しているかどうか.
     * @param list_id リストID
     * @param video_id 動画ID(ひとつ)
     */
    checkExistItem:function(list_id,video_id){
	let db = this.getDatabase();
	let st = db.createStatement('SELECT * FROM folder WHERE parent=?1 AND video_id=?2');
	st.bindInt32Parameter(0,list_id);
	st.bindUTF8StringParameter(1,video_id);
	let exist = false;
	while(st.executeStep()){
	    exist = true;
	}
	st.finalize();
	return exist;
    },

    // リストに表示されているアイテム数表示.
    updateItemNum:function(){
	$('folder-listitem-num').value = $('folder-item-listbox').children.length +"件";
    },


    /**
     * リストに要素を追加.
     * @param name 名前
     * @param id テーブル行のID
     * @param cond スマートフォルダのマッチ条件JSON
     */
    appendList: function( name, id, cond ){
	let folder = $( 'folder-listbox' );
	let elem = CreateElement( 'listitem' );
	elem.setAttribute( 'label', name );
	elem.setAttribute( 'value', id );
	if( cond ){
	    elem.setAttribute( 'smartlist-cond', cond );
	    elem.setAttribute( 'class', 'folder-smartlist' );
	}else{
	    let menuitem = CreateMenuItem( name, id );
	    $( 'menu-add-db-folder' ).appendChild( menuitem );
	}
	elem.setAttribute( "tooltiptext", name );
	folder.appendChild( elem );
    },

    // リストの新規作成.
    newList:function(){
	let name = InputPrompt("新規作成するリストの名前を入力してください","リスト名の入力");
	if(name){
	    let db = this.getDatabase();
	    let st = db.createStatement('INSERT INTO folder(type,parent,name) VALUES(0,-1,?1)');
	    st.bindUTF8StringParameter(0,name);
	    st.execute();
	    st.finalize();
	    let id = db.lastInsertRowID;

	    debugprint('insert id:'+id);
	    this.appendList(name, id);
	}
    },

    /**
     * スマートリストの新規作成.
     */
    newSmartList: function(){
	let defname = "";
	let param = {
	    "name": defname,
	    "num": 100,
	    "result": null
	};
	let f = "chrome,centerscreen,modal";
	window.openDialog("chrome://nicolivehelperadvance/content/newsmartfolder.xul","newsmartlist",f,param);

	if( param.name && param.result ){
	    if( param.result.length==0 ) return;

	    let db = this.getDatabase();
	    let st = db.createStatement('INSERT INTO folder(type,parent,name,video_id) VALUES(0,-1,?1,?2)');
	    st.bindUTF8StringParameter(0, param.name);
	    let currentcond = new Object();
	    currentcond.num = param.num;
	    currentcond.cond = param.result;
	    let cond = JSON.stringify( currentcond );
	    st.bindUTF8StringParameter(1, cond );
	    st.execute();
	    st.finalize();
	    let id = db.lastInsertRowID;

	    debugprint('insert id:'+id);
	    this.appendList(param.name, id, cond);
	}
    },

    /**
     * スマートリストの編集.
     */
    editSmartList: function(){
	let list = $('folder-listbox').selectedItem;

	let defname = list.getAttribute('label');
	let id = list.getAttribute('value');
	let prevcond = JSON.parse( list.getAttribute('smartlist-cond') );

	let param = {
	    "name": defname,
	    "num": prevcond.num,
	    "result": prevcond.cond      // 編集する条件
	};
	let f = "chrome,centerscreen,modal";
	window.openDialog("chrome://nicolivehelperadvance/content/newsmartfolder.xul","newsmartlist",f,param);

	if( param.name && param.result ){
	    let db = this.getDatabase();

	    list.setAttribute('label',param.name);

	    let currentcond = new Object();
	    currentcond.num = param.num;
	    currentcond.cond = param.result;
	    let cond = JSON.stringify( currentcond );
	    list.setAttribute('smartlist-cond', cond );

	    // フォルダ名を変更.
	    let st = db.createStatement('UPDATE folder SET name=?1,video_id=?2 WHERE id=?3 AND type=0');
	    st.bindUTF8StringParameter(0,param.name);
	    st.bindUTF8StringParameter(1,cond);
	    st.bindInt32Parameter(2,id);
	    st.execute();
	    st.finalize();
	}	
    },

    renameList:function(){
	let list = $('folder-listbox').selectedItem;
	if( !list ) return;

	let oldname = list.getAttribute('label');
	let id = list.getAttribute('value');

	let name = InputPrompt('リスト「'+oldname+'」の新しい名前を入力してください','リスト名の変更',oldname);
	if(name){
	    let db = this.getDatabase();

	    list.setAttribute('label',name);

	    // フォルダ名を変更.
	    let st = db.createStatement('UPDATE folder SET name=?1 WHERE id=?2 AND type=0');
	    st.bindUTF8StringParameter(0,name);
	    st.bindInt32Parameter(1,id);
	    st.execute();
	    st.finalize();
	}
    },

    deleteList:function(){
	let list = $('folder-listbox').selectedItem;
	if( !list ) return;

	let name = list.getAttribute('label');
	let id = list.getAttribute('value');

	if( !ConfirmPrompt('リスト「'+name+'」を削除しますか ?','リストの削除') ) return;

	$('folder-listbox').removeItemAt( $('folder-listbox').selectedIndex );

	let db = this.getDatabase();
	// フォルダを削除.
	let st = db.createStatement('DELETE FROM folder WHERE id=?1 AND type=0');
	st.bindInt32Parameter(0,id);
	st.execute();
	st.finalize();

	// フォルダに含まれる動画を削除.
	st = db.createStatement('DELETE FROM folder WHERE parent=?1 AND type=1');
	st.bindInt32Parameter(0,id);
	st.execute();
	st.finalize();

	RemoveChildren( $('folder-item-listbox') );
    },

    /**
     * 動画情報を表示しているリストアイテム要素を作成.
     * @param item 動画情報のデータ(row)
     */
    createListItemElement:function(item){
	let posteddate;
	if( Config.japanese_standard_time ){
	    let diff = Config.timezone_offset * 60;
	    let t = item.first_retrieve + diff + 9*60*60;
	    posteddate = GetDateString(t*1000);
	}else{
	    posteddate = GetDateString(item.first_retrieve*1000);
	}

	let listitem = CreateElement('listitem');
	listitem.setAttribute('vid',item.video_id);
	listitem.setAttribute("tooltiptext",item.title);

	let hbox = CreateElement('hbox');
	let image = CreateElement('image');
	image.setAttribute('src',item.thumbnail_url);
	image.setAttribute('style','-moz-box-align:center;width:65px;height:50px;margin-right:4px;');
	image.setAttribute('validate','never');
	let div = CreateHTMLElement('div');

	let min = parseInt(item.length/60);
	let sec = parseInt(item.length%60);

	let rate = GetFavRateString(item.favorite);
	div.innerHTML = item.video_id + " "+htmlspecialchars(item.title)+"<br/>"
	    + "投稿日:"+posteddate+" 時間:"+(min+":"+(sec<10?("0"+sec):sec))+"<br/>"
	    + "再生:"+FormatCommas(item.view_counter)
	    + " コメント:"+FormatCommas(item.comment_num)
	    + " マイリスト:"+FormatCommas(item.mylist_counter)
	    + " レート:"+rate;

	let vbox = CreateElement('vbox');
	vbox.appendChild(image);
	hbox.appendChild(vbox);
	hbox.appendChild(div);
	listitem.appendChild(hbox);
	return listitem;
    },

    /**
     * スマートフォルダの中身を表示する.
     * @param condition スマートフォルダのマッチ条件
     */
    showSmartFolder: function(condition, sortmenu){
	let sortorder = ["",
			 "title ASC","title DESC",
			 "first_retrieve DESC","first_retrieve ASC",
			 "view_counter DESC","view_counter ASC",
			 "comment_num DESC","comment_num ASC",
			 "mylist_counter DESC","mylist_counter ASC",
			 "length DESC","length ASC"];
	let db = this.getDatabase();
	let n = condition.num;
	let searchcond = condition.cond;
	let cond = [];
	let sql = "select *,1000*mylist_counter/view_counter as mylist_rate from nicovideo where ";

	// statementを作るフェーズ.
	let i,item,cnt;
	for(i=0,cnt=0;item=searchcond[i];i++){
	    // 検索項目.
	    let tmp;
	    tmp = this.searchtarget[ parseInt(item.key) ] +" ";

	    cnt++;
	    switch(this.searchcond[ parseInt(item.cond)]){
	    case "include": tmp += "like ?"+cnt; break;
	    case "exclude": tmp += "not like ?"+cnt; break;
	    case "gte":     tmp += ">=?"+cnt; break;
	    case "equal":   tmp += "=?"+cnt; break;
	    case "lte":     tmp += "<=?"+cnt; break;
	    default: debugprint("unknown condition"); continue;
	    }
	    cond[cnt-1] = tmp;
	}
	if(cnt<=0) return;

	sql += cond.join(' and '); // 条件は全部andで.
	sql += ' ORDER BY '+ sortorder[sortmenu.selectedItem.value];
	sql += " limit 0," + n;
	debugprint('sql='+sql);

	let st = db.createStatement(sql);
	// bindするフェーズ.
	for(i=0,cnt=0;item=searchcond[i];i++){
	    switch(this.searchcond[parseInt(item.cond)]){
	    case "include":
	    case "exclude":
		if(this.searchtarget[parseInt(item.key)]=="video_id"){
		    try{
			let vid = textbox[0].value.match(/(sm|nm)\d+/g)[0];
			st.bindUTF8StringParameter(cnt,"%"+vid+"%");
		    } catch (x) {
			st.bindUTF8StringParameter(cnt,"%"+item.text+"%");
		    }
		}else{
		    st.bindUTF8StringParameter(cnt,"%"+item.text+"%");
		}
		break;
	    case "gte":
	    case "equal":
	    case "lte":
		let tmp;
		if(this.searchtarget[parseInt(item.key)]=="first_retrieve"){
		    let date;
		    let d;
		    date = item.text.match(/\d+/g);
		    if(date.length==6){
			d = new Date(date[0],date[1]-1,date[2],date[3],date[4],date[5]);
			tmp = parseInt(d.getTime() / 1000); // integer
		    }else{
			d = new Date(date[0],date[1]-1,date[2],0,0,0);
			tmp = parseInt(d.getTime() / 1000); // integer
		    }
		    if( Config.japanese_standard_time ){
			tmp -= Config.timezone_offset*60;
			tmp -= 9*60*60;
		    }
		}else{
		    tmp = parseInt(item.text);
		}
		st.bindInt64Parameter(cnt,tmp);
		break;
	    default: debugprint("unknown condition"); continue;
	    }
	    cnt++;
	}

	let folder_listbox = $('folder-item-listbox');
	RemoveChildren(folder_listbox);
	while(st.executeStep()){
	    let listitem = this.createListItemElement(st.row);
	    folder_listbox.appendChild(listitem);
	}
	st.finalize();

	this.updateItemNum();
    },

    /**
     * フォルダを選択したときの処理.
     * リストに動画リストを作成する.
     */
    selectFolder:function(){
	// スマートリストかどうかを調べて処理を変える.
	let list = $('folder-listbox').selectedItem;
	if( list ){
	    let cond = list.getAttribute('smartlist-cond');
	    if( cond ){
		this.showSmartFolder( JSON.parse(cond), $('folder-item-sortmenu') );
	    }else{
		this.sort( $('folder-item-sortmenu') );
	    }
	}
	return;
    },

    /**
     * 表示のソートをする.
     */
    sort:function(sortmenu){
	//debugprint(sortmenu.selectedItem.value);
	let sortorder = ["",
			 "title ASC","title DESC",
			 "first_retrieve DESC","first_retrieve ASC",
			 "view_counter DESC","view_counter ASC",
			 "comment_num DESC","comment_num ASC",
			 "mylist_counter DESC","mylist_counter ASC",
			 "length DESC","length ASC"];
	let db = this.getDatabase();
	let str = 'SELECT N.* FROM nicovideo N JOIN (SELECT * FROM folder F WHERE F.parent=?1 AND F.type=1) USING (video_id) ORDER BY '+sortorder[sortmenu.selectedItem.value];
	let st = db.createStatement(str);
	let id = $('folder-listbox').selectedItem.value;
	st.bindInt32Parameter(0,id);

	let folder_listbox = $('folder-item-listbox');
	RemoveChildren(folder_listbox);
	while(st.executeStep()){
	    let listitem = this.createListItemElement(st.row);
	    folder_listbox.appendChild(listitem);
	}
	st.finalize();

	this.updateItemNum();
    },

    copyVideoId:function(){
	let items = $('folder-item-listbox').selectedItems;
	let str = "";
	for(let i=0,item; item=items[i]; i++){
	    str += item.getAttribute('vid') + "\n";
	}
	CopyToClipboard(str);
    },

    addToStock:function(){
	let items = $('folder-item-listbox').selectedItems;
	let str = "";
	for(let i=0,item; item=items[i]; i++){
	    str += item.getAttribute('vid') + " ";
	}
	NicoLiveStock.addStock(str);
    },
    sendRequest:function(){
	if( IsCaster() || IsOffline() ){
	    // リクエストリストに放り込むときは複数可
	    let items = $('folder-item-listbox').selectedItems;
	    let str = "";
	    for(let i=0,item; item=items[i]; i++){
		str += item.getAttribute('vid') + " ";
	    }
	    NicoLiveRequest.addRequest(str);
	}else{
	    // リクエスト送信は1つのみ.
	    let video_id = $('folder-item-listbox').selectedItem.getAttribute('vid');
	    NicoLiveHelper.postListenerComment(video_id,"");
	}
    },

    deleteVideo:function(){
	let items = $('folder-item-listbox').selectedItems;
	if( !items.length ) return;

	if( !ConfirmPrompt("選択した動画をリストから削除しますか ?","リスト内の動画の削除") ) return;

	let id = $('folder-listbox').selectedItem.value;

	let db = this.getDatabase();
	let vids = new Array();
	for(let i=0,item; item=items[i]; i++){
	    let video_id = item.getAttribute('vid');
	    let st = db.createStatement('DELETE FROM folder WHERE parent=?1 AND video_id=?2 AND type=1');
	    st.bindInt32Parameter(0,id);
	    st.bindUTF8StringParameter(1,video_id);
	    st.execute();
	    st.finalize();

	    vids.push(video_id);
	}
	for(let i=items.length-1,item; item=items[i]; i--){
	    RemoveElement(item);
	}
	this.updateItemNum();
    },

    openVideoPage:function(){
	let item = $('folder-item-listbox').selectedItem;
	if( !item ) return;
	let vid = item.getAttribute('vid');
	//NicoLivePlaylist.newTab(vid);
	NicoLiveWindow.openDefaultBrowser("http://www.nicovideo.jp/watch/"+vid);
    },

    /**
     * リストに動画を追加する.
     * @param id リストID
     * @param vids 動画ID(複数含む文字列可)
     */
    _appendVideos:function(id, vids){
	if( !vids ) return;

	let f = function(){
	    let db = NicoLiveFolderDB.getDatabase();
	    let l = vids.match(/(sm|nm)\d+/g);
	    if(l){
		for(let i=0,video_id;video_id=l[i];i++){
		    if( NicoLiveFolderDB.checkExistItem(id,video_id) ) continue;
		    
		    let st = db.createStatement('INSERT INTO folder(type,parent,video_id) VALUES(1,?1,?2)');
		    st.bindInt32Parameter(0,id);
		    st.bindUTF8StringParameter(1,video_id);
		    st.execute();
		    st.finalize();
		}
		NicoLiveFolderDB.sort( $('folder-item-sortmenu') );
	    }
	};

	Database.addVideos(vids, f);
    },

    /**
     * 動画IDを入力して追加.
     */
    appendVideos:function(){
	if( !$('folder-listbox').selectedItem ) return;
	let id = $('folder-listbox').selectedItem.value;
	let vids = InputPrompt("リストへ追加する動画ID(複数可)を入力してください","リストへ動画の追加");
	if( vids ){
	    this._appendVideos( id, vids );
	}
    },

    /** マイリストから追加.
     * @param id リストID
     * @param mylist_id マイリストID
     */
    appendVideosFromMylist:function(id,mylist_id){
	let f = function(xml,req){
	    if( req.readyState==4 && req.status==200 ){
		let xml = req.responseXML;
		let items = xml.getElementsByTagName('item');
		let videos = new Array();
		debugprint('mylist rss items:'+items.length);
		for(let i=0,item;item=items[i];i++){
		    let video_id;
		    try{
			video_id = item.getElementsByTagName('link')[0].textContent.match(/(sm|nm)\d+/);
		    } catch (x) {
			video_id = "";
		    }
		    if(video_id){
			videos.push(video_id[0]);
		    }
		}// end for.
		NicoLiveFolderDB._appendVideos(id, videos.join(','));
	    }
	};
	NicoApi.mylistRSS( mylist_id, f );
    },

    startDraggingItem:function(event){
	let dt = event.dataTransfer;
	//dt.setData('application/x-moz-node', $('folder-item-listbox').selectedItems);
	let dragitems = $('folder-item-listbox').selectedItems;
	for(let i=0,item; item=dragitems[i]; i++){
	    dt.mozSetDataAt('application/x-moz-node', item , i );
	}
    },

    checkDragOnList:function(event){
	let b = event.dataTransfer.types.contains("application/x-moz-node");
	if( event.target.getAttribute('smartlist-cond') ){
	    event.dataTransfer.effectAllowed = "none";
	    return false;
	}
	event.dataTransfer.effectAllowed ="all";
	if( b ){
	    event.preventDefault();
	}
	return true;
    },
    checkDragOnItemList:function(event){
	if( !$('folder-listbox').selectedItem ) return false;
	let list = $('folder-listbox').selectedItem;
	let cond = list.getAttribute('smartlist-cond');
	if( cond ){
	    event.dataTransfer.effectAllowed = "none";
	    return false;
	}else{
	    event.dataTransfer.effectAllowed = "all";
	}

	let b = event.dataTransfer.types.contains("application/x-moz-node");
	if( !b ){
	    event.preventDefault();
	}
	return true;
    },

    /** テキストファイルからリストに追加.
     * @param file nsIFile
     */
    readTextFile:function(file){
	if( !$('folder-listbox').selectedItem ) return;
	let id = $('folder-listbox').selectedItem.value;

	// file は nsIFile
	let istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(file, 0x01, 0444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);

	// 行を配列に読み込む
	let line = {}, hasmore;
	let first = true;
	let str = "";
	do {
	    hasmore = istream.readLine(line);
	    if( line.value.match(/(sm|nm)\d+|\d{10}/) ){
		str += line.value +" ";
	    }
	} while(hasmore);
	this._appendVideos(id, str);

	istream.close();
    },

    /** アイテムリストにいろいろドロップ.
     * @param event eventオブジェクト
     */
    dropToItemList:function(event){
	if( !$('folder-listbox').selectedItem ) return;
	let list = $('folder-listbox').selectedItem;
	if( list ){
	    let cond = list.getAttribute('smartlist-cond');
	    if( cond ){
		debugprint("スマートリストにはドロップできません");
		return;
	    }
	}

	let b = event.dataTransfer.types.contains("application/x-moz-node");
	if( b ){
	    return;
	}
	event.stopPropagation();

	let id = $('folder-listbox').selectedItem.value;

	// ファイルをドロップしたとき.
	let file = event.dataTransfer.mozGetDataAt("application/x-moz-file", 0);
	if (file instanceof Components.interfaces.nsIFile){
	    if( !file.leafName.match(/\.txt$/) ) return;
	    debugprint("file dropped:"+file.path);
	    this.readTextFile(file);
	    return;
	}
	// テキストをドロップしたとき.
	if( event.dataTransfer.types.contains('text/plain') ){
	    let txt = event.dataTransfer.mozGetDataAt("text/plain",0);
	    debugprint('text dropped.');
	    try{
		let mylist_id = txt.match(/mylist\/(\d+)/)[1];
		this.appendVideosFromMylist( id, mylist_id );
	    } catch (x) {
		this._appendVideos( id, txt );
	    }
	    return;
	}
	// アンカーをドロップしたとき.
	if( event.dataTransfer.types.contains("text/uri-list") ){
	    let uri = event.dataTransfer.mozGetDataAt("text/uri-list",0);
	    debugprint("uri dropped:"+uri);
	    try{
		let mylist_id = uri.match(/mylist\/(\d+)/)[1];
		this.appendVideosFromMylist( id, mylist_id );
	    } catch (x) {
		this._appendVideos( id, uri );
	    }
	    return;
	}
	// タブをドロップしたとき.
	if( event.dataTransfer.types.contains("application/x-moz-tabbrowser-tab") ){
	    debugprint("tab dropped");
	    let str = "";
	    let tab = event.dataTransfer.mozGetDataAt("application/x-moz-tabbrowser-tab",0);
	    let doc = tab.linkedBrowser.contentDocument;
	    // 検索ページ.
	    let items = evaluateXPath(doc,"//*[@class='uad_thumbfrm' or @class='uad_thumbfrm_1' or @class='uad_thumbfrm_2']/table/tbody/tr/td/p/a/@href");
	    for(let i=0,item; item=items[i]; i++){
		str += item.textContent + " ";
	    }
	    // ランキングページ.
	    items = evaluateXPath(doc,"//div/p/a[@class='watch']/@href");
	    for(let i=0,item; item=items[i]; i++){
		str += item.textContent + " ";
	    }
	    str += event.dataTransfer.mozGetDataAt("text/x-moz-text-internal",0);
	    this._appendVideos( id, str );
	    return;
	}
    },

    /**
     * アイテムを移動する.
     * @param destination 移動先リストID
     * @param source 移動元リストID
     * @param video_id 動画ID
     */
    moveItem:function(destination,source,video_id){
	let db = this.getDatabase();
	let st = db.createStatement('UPDATE folder SET parent=?1 WHERE parent=?2 AND video_id=?3');
	st.bindInt32Parameter(0,destination);
	st.bindInt32Parameter(1,source);
	st.bindUTF8StringParameter(2,video_id);
	st.execute();
	st.finalize();
    },

    /**
     * アイテムをコピーする.
     * @param destination コピー先リストID
     * @param video_id 動画ID
     */
    copyItem:function(destination,video_id){
	let db = this.getDatabase();
	let st = db.createStatement('INSERT INTO folder(type,parent,video_id) VALUES(1,?1,?2)');
	st.bindInt32Parameter(0,destination);
	st.bindUTF8StringParameter(1,video_id);
	st.execute();
	st.finalize();
    },

    /**
     * フォルダリストにドロップしたときの処理.
     */
    dropItemOnList:function(event){
	this._data = event.dataTransfer;
	let dt = event.dataTransfer;
	let effect = dt.dropEffect; // copy, move
	let target = event.target;
	let target_list_id = target.value;
	let source_list_id = $('folder-listbox').selectedItem.value;
	debugprint($('folder-listbox').selectedItem.label+"/"+source_list_id+"->"+target.label+"/"+target.value);
	if( event.target.getAttribute('smartlist-cond') ){
	    return;
	}

	for (let i = 0; i < dt.mozItemCount; i++){
	    let node = dt.mozGetDataAt("application/x-moz-node", i);
	    let vid = node.getAttribute('vid');

	    if( this.checkExistItem(target_list_id, vid) ) continue;

	    switch( effect ){
	    case "move":
		this.moveItem(target_list_id, source_list_id, vid);
		RemoveElement(node);
		break;
	    case "copy":
		this.copyItem(target_list_id, vid);
		break;
	    }
	}
    },

    onkeydown:function(event){
	//debugprint(event);
	//this._data = event;
	switch( event.keyCode ){
	case 65: // A
	    if( event.ctrlKey ){
		$('folder-item-listbox').selectAll();
		event.stopPropagation();
		return false;
	    }
	    break;
	case 46: // DEL
	    this.deleteVideo();
	    break;
	}
	return true;
    },

    // フォルダリストの表示.
    showFolderList:function(){
	let db = this.getDatabase();
	let st = db.createStatement('SELECT id,name,video_id FROM folder WHERE type=0 ORDER BY name ASC');
	while(st.executeStep()){
	    this.appendList(st.row.name, st.row.id, st.row.video_id );
	}
	st.finalize();
    },

    playVideo:function(){
	let item = $('folder-item-listbox').selectedItem;
	if( !item ) return;
	let vid = item.getAttribute('vid');
	this._tab = NicoLiveStock.newTabForOfflinePlay(vid);
	clearInterval(this._starttoplay_timer);
	this._starttoplay_timer = setInterval("NicoLiveFolderDB._playVideo();", 3000);
	this._play_firsttime = 1;
    },
    _playVideo:function(){
	// playing, paused, end
	if(this._tab.contentDocument){
	    try{
		let status, loadratio;
		let flv;
		try{
		    flv = this._tab.contentDocument.getElementById('external_nicoplayer').wrappedJSObject.__proto__;
		} catch (x) {
		    flv = this._tab.contentDocument.getElementById('flvplayer').wrappedJSObject.__proto__;
		}
		status = flv.ext_getStatus();
		loadratio = flv.ext_getLoadedRatio();

		if((status=="stopped"||status=="paused") && loadratio>0.2 &&
		   this._play_firsttime && flv.ext_getPlayheadTime()==0){
		    flv.ext_play(true);
		    if( this._screensize ){
			flv.ext_setVideoSize( this._screensize );
		    }
		    //flv.ext_setVideoSize("full");
		    this._play_firsttime--;
		    let flvcontainer = this._tab.contentDocument.getElementById('playerContainerWrapper').wrappedJSObject.__proto__;
		    this._tab.contentWindow.scroll(0,flvcontainer.offsetTop-32);
		}
		//debugprint(status);
		switch(status){
		case "playing":
		    let playprogress = $('statusbar-music-progressmeter');
		    let progress = parseInt(flv.ext_getPlayheadTime()/flv.ext_getTotalTime()*100,10);
		    playprogress.value = progress;
		    //debugprint(flv.ext_getVideoSize());
		    this._screensize = flv.ext_getVideoSize();
		    break;
		case "end":
		    break;
		}
	    } catch (x) {
		//debugprint(x);
	    }
	}else{
	    clearInterval(this._starttoplay_timer);
	}
    },

    /**
     * フォルダリストのメニューが表示されるときの処理.
     */
    showPopupMenu: function(){
	let list = $('folder-listbox').selectedItem;
	if( list ){
	    let cond = list.getAttribute('smartlist-cond');
	    if( cond ){
		$('folder-edit-smartlist').hidden = false;
	    }else{
		$('folder-edit-smartlist').hidden = true;
	    }
	}
    },

    init:function(){
	this.showFolderList();
    }

};

window.addEventListener("load", function(e){ NicoLiveFolderDB.init(); }, false);
