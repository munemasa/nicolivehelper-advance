
var NicoLiveHistory = {

    /**
     * table内に表示する動画情報を作成する.
     * @return 作成したvboxを返す
     */
    createVideoInformation: function(item){
	return NicoLiveRequest.createVideoInformation(item);
    },
    createSeigaInformation: function(item){
	return NicoLiveRequest.createSeigaInformation(item);
    },

    /**
     * プレイリストに一個追加する
     */
    _addHistoryView:function(table,item){
	let tr = table.insertRow(table.rows.length);
	tr.className = "table_played";

	let td;
	td = tr.insertCell(tr.cells.length);
	td.appendChild(document.createTextNode("#"+table.rows.length));

	td = tr.insertCell(tr.cells.length);

	let vbox;
	if( item.video_id.indexOf("im")==0 ){
	    // ニコニコ静画
	    vbox = this.createSeigaInformation(item);
	}else{
	    vbox = this.createVideoInformation(item);
	}

	vbox.setAttribute('class','vinfo');
	vbox.setAttribute('context','popup-playlist');

	let hbox = CreateElement('hbox');
	hbox.setAttribute('tooltiptext','');
	hbox.setAttribute('class','command-buttons');

	let button;
	/*
	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/information.png');
	//button.setAttribute('label','情報');
	button.setAttribute('class','command-button');
	hbox.appendChild(button);
	 */

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/play.png');
	button.setAttribute('label','再生');
	button.setAttribute('class','command-button');
	button.setAttribute('tooltiptext','動画を再生します');
	button.setAttribute("oncommand","NicoLiveHistory.playHistory(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/prepare.png');
	button.setAttribute('class','command-button');
	button.setAttribute('tooltiptext','先読み(/prepare)します');
	button.setAttribute('oncommand',"NicoLiveHistory.prepareVideo(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/add.png');
	button.setAttribute('label','リクエスト');
	button.setAttribute('class','command-button');
	button.setAttribute("tooltiptext","リクエストに追加します");
	button.setAttribute("oncommand","NicoLiveHistory.addRequestDirect(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/add.png');
	button.setAttribute('label','ストック');
	button.setAttribute('class','command-button');
	button.setAttribute("tooltiptext","ストックに追加します");
	button.setAttribute("oncommand","NicoLiveHistory.addStockDirect(event);");
	hbox.appendChild(button);

	vbox.appendChild(hbox);
	td.appendChild(vbox);
    },

    /**
     * リクエストに直接追加
     */
    addRequestDirect:function(event){
	let n = this.getIndex(event);
	let videoinfo = NicoLiveHelper.getPlayedVideo( n );
	videoinfo.is_played = false;
	NicoLiveHelper.addRequestDirect( videoinfo );
    },
    /**
     * ストックに直接追加
     */
    addStockDirect:function(event){
	let n = this.getIndex(event);
	let videoinfo = NicoLiveHelper.getPlayedVideo( n );
	videoinfo.is_played = false;
	NicoLiveHelper.addStockDirect( videoinfo );
    },

    /**
     * 再生履歴表示の末尾にひとつ追加する.
     */
    addPlayList: function(videoinfo){
	let table = $('playlist-table');
	if( !table ) return;
	this._addHistoryView( table, videoinfo );
    },

    /**
     * 指定のイベントの発生した行を返す.
     * @param event DOMイベント
     */
    getIndex: function(event){
	let tr = FindParentElement(event.target,'tr');
	let n = tr.sectionRowIndex;
	return n;
    },

    // 詳細表示の内容でテキストを復元する.
    restorePlaylistText:function(){
	$('playlist-textbox').value = "";
	for(let i=0,item;item=NicoLiveHelper.playlist_list[i];i++){
	    $('playlist-textbox').value += item.video_id + " " + item.title + "\n";
	}
    },

    /**
     * 再生履歴から再生する.
     * @param event 再生ボタンのoncommandイベント
     */
    playHistory: function(event){
	let n = this.getIndex(event);
	debugprint("Play History: #"+n);
	NicoLiveHelper.playHistory(n);
    },

    /**
     * 先読みする.
     */
    prepareVideo:function(event){
	let n = this.getIndex(event);
	NicoLiveHelper.postCasterComment("/prepare "+NicoLiveHelper.playlist_list[n].video_id);
    },

    /**
     * プレイリストの表示を全更新する.
     */
    updateView: function( requestqueue ){
	let table = $('playlist-table');
	if(!table){ return; }

	clearTable(table);
	for(let i=0,item;item=requestqueue[i];i++){
	    this._addHistoryView( table, item );
	}
    },

    /**
     * プレイリストのテキストから範囲選択して指定した動画のマイリス登録.
     */
    addMylist:function(mylist_id,mylist_name,ev){
	let notes = $('playlist-textbox');
	let substring;
	substring = notes.value.substr(notes.selectionStart,notes.selectionEnd-notes.selectionStart);

	if(substring.length>=3){
	    NicoLiveMylist.addMyList(mylist_id,mylist_name,substring, ev);
	}
    },

    /**
     * 再生履歴（テキスト）に「マイリストに追加」と「選択範囲の動画IDをコピー」を追加する.
     * @param popup マイリストに追加のポップアップメニュー
     */
    appendMenu:function( popup ){
	// テキストボックスのコンテキストメニューを拾う
	let notes = $('playlist-textbox');
	let input = document.getAnonymousElementByAttribute(notes, 'anonid', 'input');
	let menu = document.getAnonymousElementByAttribute(input.parentNode, "anonid", "input-box-contextmenu");

	notes.addEventListener('popupshowing',this,false);

	menu.insertBefore( CreateElement('menuseparator'), menu.firstChild );

	let copy_id_menu = CreateMenuItem( "選択範囲の動画IDをコピー", "copy_video_id_in_selected" );
	copy_id_menu.setAttribute( "oncommand", "NicoLiveHistory.copyVideoIdFromRegion();" );
	menu.insertBefore( copy_id_menu, menu.firstChild );

	let popupmenu = popup;
	popupmenu.setAttribute('id','addto-mylist-from-history');
	popupmenu.setAttribute("oncommand","NicoLiveHistory.addMylist(event.target.value,event.target.label,event);");
	menu.insertBefore( popupmenu, menu.firstChild );
    },

    copyVideoIdFromRegion: function(){
	let notes = $( 'playlist-textbox' );
	let substring;
	substring = notes.value.substr( notes.selectionStart, notes.selectionEnd - notes.selectionStart );

	if( substring.length >= 3 ){
	    let video_ids = substring.match(/^(sm|nm|ze|so)\d+|\d{10}/mg);

	    console.log( video_ids );
	    if( video_ids ){
		CopyToClipboard( video_ids.join(' ') );
	    }
	}
    },

    handleEvent:function(event){
	if(event.type=='popupshowing'){
	    // テキスト表示のとき範囲選択されていればマイリストに追加を表示する.
	    let hidden = true;
	    let notes = $('playlist-textbox');
	    let n = notes.selectionEnd-notes.selectionStart;
	    if(n>0){
		hidden = false;
	    }
	    $('addto-mylist-from-history').hidden = hidden;
	}
    },

    init:function(){
	debugprint("NicoLiveHistory.init");
    }
};

window.addEventListener("load", function() { NicoLiveHistory.init(); }, false);
