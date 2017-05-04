
var NicoLiveStock = {

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
     * 再生済みステータスの表示更新.
     * @param q ストック
     */
    updatePlayedStatus: function( q ){
	let rows = $('stock-table').getElementsByTagName('tr');
	for(let i=0,item; item=q[i]; i++){
	    let tr = rows[i];
	    switch( item.errno ){
	    case REASON_NO_LIVE_PLAY:
		tr.className = "table_played no_live_play";
		break;
	    default:
		tr.className = "table_casterselection";
		if ( item.is_played ){
		    tr.className = "table_played";
		}
		break;
	    }
	}
    },

    /**
     * リクエストリストに一個追加する
     */
    _addStockView:function(table,item){
	let tr = table.insertRow(table.rows.length);
	switch( item.errno ){
	case REASON_NO_LIVE_PLAY:
	    tr.className = "table_played no_live_play";
	    break;
	default:
	    tr.className = "table_casterselection";
	    if ( item.is_played ){
		tr.className = "table_played";
	    }
	    break;
	}

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
	// ポップアップメニュー
	vbox.setAttribute('context','popup-stock');

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
	button.setAttribute("oncommand","NicoLiveStock._playStock(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/go-top.png');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveStock.goTopStock(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/direction_up.png');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveStock.moveUpStock(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/direction_down.png');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveStock.moveDownStock(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/go-bottom.png');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveStock.goBottomStock(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/prepare.png');
	button.setAttribute('class','command-button');
	button.setAttribute('tooltiptext','先読み(/prepare)します');
	button.setAttribute('oncommand',"NicoLiveStock.prepareVideo(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/add.png');
	button.setAttribute('label','リクエスト');
	button.setAttribute('class','command-button');
	button.setAttribute('tooltiptext','リクエストを送信します');
	button.setAttribute('oncommand','NicoLiveStock.addRequestDirect(event);');
	hbox.appendChild(button);

	let spacer = CreateElement('spacer');
	spacer.setAttribute('flex','1');
	hbox.appendChild(spacer);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/remove.png');
	button.setAttribute('label','削除');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveStock.removeStock(event);");
	button.setAttribute( 'video_id', item.video_id );
	button.setAttribute( 'context', 'popup-db-delete' );
	hbox.appendChild(button);

	vbox.appendChild(hbox);
	td.appendChild(vbox);
    },

    /**
     * リクエスト表示の末尾にひとつ追加する.
     */
    addStockView: function(videoinfo){
	let table = $('stock-table');
	if( !table ) return;
	this._addStockView( table, videoinfo );

	this.updateRemain();
    },

    /**
     * ストックに追加する.
     * @param text 動画IDやマイリスト
     */
    addStock: function(text){
	if(text.length<3) return;
	let l = text.match(/(sm|nm|so|im)\d+|\d{10}/g);
	if( l ){
	    for(let i=0,id;id=l[i];i++){
		NicoLiveHelper.addStock(id);
	    }
	}
	l = text.match(/mylist\/\d+/g);
	if(l){
	    for(let i=0,mylist;mylist=l[i];i++){
		let id = mylist.match(/mylist\/(\d+)/)[1];
		NicoLiveMylist.addStockFromMylist(id,"");
	    }
	}

	$('input-stock').value="";
    },

    getIndex: function(event){
	let tr = FindParentElement(event.target,'tr');
	let n = tr.sectionRowIndex;
	return n;
    },

    /**
     * ストックを再生する.
     * @param event 再生ボタンのoncommandイベント
     */
    _playStock: function(event){
	let n = this.getIndex(event);
	this.playStock(n);
    },

    prepareVideo:function(event){
	let n = this.getIndex(event);
	NicoLiveHelper.postCasterComment("/prepare "+NicoLiveHelper.stock_list[n].video_id);
    },

    /**
     * ストックを再生する.
     * @param n 0,1,2,...
     */
    playStock: function(n){
	if( NicoLiveHelper.isOffline() ){
	    this.offlinePlay(n);
	    return;
	}

	debugprint("Play Stock: #"+n);
	NicoLiveHelper.playStock(n);
	try{
	    let tr = evaluateXPath(document,"//html:table[@id='stock-table']//html:tr")[n];
	    tr.className = "table_played";
	} catch (x) {
	}
	this.updateRemain();
    },

    /**
     * リクエストを削除する
     * @param event 削除ボタンのoncommandのイベント
     */
    removeStock: function(event){
	let n = this.getIndex(event);
	debugprint("Remove Stock: #"+n);
	NicoLiveHelper.removeStock(n);

	let tr = FindParentElement(event.target, 'tr');
	RemoveElement( tr );
	this.resetStockIndex();

	this.updateRemain();
    },

    swapStock: function( n1, n2 ){
	let rows = evaluateXPath( document, "//html:table[@id='stock-table']//html:tr//*[@class='vinfo']");
	
	let parent1, parent2;
	parent1 = rows[n1].parentNode;
	parent2 = rows[n2].parentNode;

	let tmp1, tmp2;
	tmp1 = rows[n1].cloneNode(true);
	tmp2 = rows[n2].cloneNode(true);

	parent1.replaceChild( tmp2, rows[n1] );
	parent2.replaceChild( tmp1, rows[n2] );
    },

    moveUpStock: function(event){
	let n = this.getIndex(event);
	if( n>=1 ){
	    this.swapStock( n, n-1 );
	    NicoLiveHelper.swapRequest( n, n-1, NicoLiveHelper.stock_list );
	    this.resetStockIndex();
	}
    },
    moveDownStock: function(event){
	let n = this.getIndex(event);
	if( n<NicoLiveHelper.stock_list.length-1 ){
	    this.swapStock( n, n+1 );
	    NicoLiveHelper.swapRequest( n, n+1, NicoLiveHelper.stock_list );
	    this.resetStockIndex();
	}
    },

    goTopStock: function(event){
	let n = this.getIndex(event);
	if( n>0 ){
	    let rows = evaluateXPath( document, "//html:table[@id='stock-table']//html:tr");
	    let tmp = rows[n].cloneNode(true);
	    RemoveElement( rows[n] );
	    rows[0].parentNode.insertBefore( tmp, rows[0] );
	    NicoLiveHelper.goTopRequest( n, NicoLiveHelper.stock_list );
	    this.resetStockIndex();
	}
    },
    goBottomStock: function(event){
	let n = this.getIndex(event);
	if( n<NicoLiveHelper.stock_list.length-1 ){
	    let rows = evaluateXPath( document, "//html:table[@id='stock-table']//html:tr");
	    let tmp = rows[n].cloneNode(true);
	    let parentNode = rows[0].parentNode;
	    RemoveElement( rows[n] );
	    parentNode.appendChild( tmp );
	    NicoLiveHelper.goBottomRequest( n, NicoLiveHelper.stock_list );
	    this.resetStockIndex();
	}
    },

    /**
     * ストックからリクエストに追加する.
     * 視聴者の場合は、リクエスト(動画ID)を送信する.
     * @param event ボタンの押下イベント
     */
    addRequestDirect: function(event){
	let n = this.getIndex(event);
	if( !IsCaster() && !IsOffline() ){
	    let vid = NicoLiveHelper.stock_list[n].video_id;
	    NicoLiveHelper.postListenerComment( vid, "" );
	}else{
	    NicoLiveHelper.addRequestDirect( NicoLiveHelper.stock_list[n] );
	}
    },

    /**
     * ストックの再生済み状態をOFFにする.
     * @param node メニューがポップアップしたノード
     */
    turnoffPlayedStatus:function(node){
	let elem = FindParentElement(node,'vbox');
	let video_id = elem.getAttribute('nicovideo_id');
	debugprint("Turn off played status: "+ video_id );
	NicoLiveHelper.turnoffPlayedStatus(video_id);
	this.updatePlayedStatus( NicoLiveHelper.stock_list );
	this.updateRemain();
    },

    /**
     * リクエストの番号表記と背景色を1から付け直す。
     */
    resetStockIndex: function(){
	let tr = $('stock-table').getElementsByTagName('tr');
	for(let i=0,row;row=tr[i];i++){
	    let td = row.firstChild;
	    let item = NicoLiveHelper.stock_list[i];

	    row.className = (i+1)%2?"table_oddrow":"table_evenrow";
	    if( item.errno==REASON_NO_LIVE_PLAY ){
		row.className = "table_played no_live_play";
	    }else if( item.is_played ){
		row.className = "table_played";
	    }else if( item.is_casterselection ){
		row.className = "table_casterselection";
	    }

	    RemoveChildren( td );
	    td.appendChild( document.createTextNode('#'+(i+1)));
	    // TODO 先頭から何分後にあるかの表示 ストックでは不要かな
	    /*
	    let t;
	    t = GetTimeString( 0 );
	    td.appendChild(CreateHTMLElement('br'));
	    td.appendChild(document.createTextNode("+"+t));
	     */
	}
    },

    /**
     * ストックセットを切り替える.
     * @param n セット番号
     */
    changeStockSet: function(n){
	NicoLiveHelper.changeStockSet(n);
    },

    /**
     * ストックの残り表示を更新する.
     * @param requestqueue ストック
     */
    updateRemain:function (requestqueue) {
	requestqueue = NicoLiveHelper.stock_list;
        let t = NicoLiveHelper.getTotalStockTime();

        let n = 0;
        requestqueue.forEach(function (item) {
            if (item.is_played) n++;
        });

        n = requestqueue.length - n;
        $('stock-playtime').value = LoadFormattedString('STR_FORMAT_NUMBER_OF_REQUEST', [t.min, t.sec, n]);
    },

    /**
     * ストック表示を全更新する.
     */
    updateView: function( requestqueue ){
	let table = $('stock-table');
	if(!table){ return; }

	clearTable(table);
	for(let i=0,item;item=requestqueue[i];i++){
	    this._addStockView( table, item );
	}
        this.updateRemain();
    },

    /**
     * ストックをファイルに保存する.
     */
    saveStockToFile:function(){
	let ids = new Array();
	for(let i=0,item;item=NicoLiveHelper.stock_list[i];i++){
	    ids.push(item.video_id + " " + item.title);
	}
	if(ids.length<=0) return;

	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, LoadString("STR_SAVE_STOCK"), nsIFilePicker.modeSave);
	fp.appendFilters(nsIFilePicker.filterText);
	let rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	    let file = fp.file;
	    let path = fp.file.path;
	    debugprint("「"+path+"」にストックを保存します");
	    let os = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	    let flags = 0x02|0x08|0x20;// wronly|create|truncate
	    os.init(file,flags,0o644,0);

	    let cos = GetUTF8ConverterOutputStream(os);
	    cos.writeString(ids.join('\r\n')+"\r\n");
	    cos.close();
	}
    },

    /**
     * ニコニコ動画で再生する用のタブを作成する.
     * @param video_id 動画ID
     */
    newTabForOfflinePlay:function(video_id){
	this._firsttime = true;
	this._current_video_id = video_id;
	try{
	    this._tab.contentDocument.wrappedJSObject.location.href = "http://www.nicovideo.jp/watch/"+video_id;
	} catch (x) {
	    let tab = window.opener.getBrowser().addTab('http://www.nicovideo.jp/watch/'+video_id);
	    this._tab = window.opener.getBrowser().getBrowserForTab(tab);
	    window.opener.getBrowser().selectedTab = tab;
	}
	return this._tab;
    },

    /**
     * ニコニコ動画で再生する.
     * @param n 0,1,2,...
     */
    offlinePlay: function( n ){
	this._playflg = false;

	let nextmusic = NicoLiveHelper.stock_list[n];
	this.opentab = this.newTabForOfflinePlay( nextmusic.video_id );

	this.playlist_start = n; // ストック再生の開始位置
	clearInterval( this._playlist_timer );
	this.playlist_first = 1;

	this._playlist_timer = setInterval( function(){
	    NicoLiveStock.playByNicovideo();
	}, 3000 );
    },

    /**
     * ニコニコ動画（Flash）ページで動画を再生する
     */
    playByNicovideoFlash: function(){
	try{
	    let status, loadratio;
	    let flv;
	    try{
		flv = this.opentab.contentDocument.getElementById( 'external_nicoplayer' ).wrappedJSObject.__proto__;
	    }catch( x ){
		flv = this.opentab.contentDocument.getElementById( 'flvplayer' ).wrappedJSObject.__proto__;
	    }
	    status = flv.ext_getStatus();
	    loadratio = flv.ext_getLoadedRatio();

	    if( (status == "stopped" || status == "paused") && loadratio > 0.2 &&
		this.playlist_first && flv.ext_getPlayheadTime() == 0 ){
		flv.ext_play( true );
		if( this._screensize ){
		    flv.ext_setVideoSize( NicoLiveRequest._screensize );
		}
		//flv.ext_setVideoSize("full");
		this.playlist_first--;
		let flvcontainer = this.opentab.contentDocument.getElementById( 'playerContainerWrapper' ).wrappedJSObject.__proto__;
		this.opentab.contentWindow.scroll( 0, flvcontainer.offsetTop - 32 );

		let vid = NicoLiveHelper.stock_list[this.playlist_start].video_id;
		let t = NicoLiveHelper.stock_list[this.playlist_start].length;
		debugprint( vid + "," + GetTimeString( flv.ext_getTotalTime() ) );
	    }
	    //debugprint(status);
	    switch( status ){
	    case "playing":
		let playprogress = $( 'statusbar-music-progressmeter' );
		let progress = parseInt( flv.ext_getPlayheadTime() / flv.ext_getTotalTime() * 100, 10 );
		playprogress.value = progress;
		$( 'statusbar-music-name' ).label = NicoLiveHelper.stock_list[this.playlist_start].title;
		//debugprint(flv.ext_getVideoSize());
		this._screensize = flv.ext_getVideoSize();
		break;

	    case "end":
		this.playlist_start++;
		if( this.playlist_start > NicoLiveHelper.stock_list.length ){
		    // 最初に戻る.
		    this.playlist_start = 0;
		}

		this.offlinePlay( this.playlist_start );
		break;
	    }
	}catch( x ){
//		debugprint(GetCurrentTime()+"/"+x);
	}
    },

    playByNicovideoHTML5: function(){
	let player = this.opentab.contentDocument.getElementById( 'MainVideoPlayer' );
	let video = player.getElementsByTagName( 'video' )[0];
	if( video.ended ){
	    this.playlist_start++;
	    if( this.playlist_start > NicoLiveHelper.stock_list.length ){
		// 最初に戻る.
		this.playlist_start = 0;
	    }
	    this.offlinePlay( this.playlist_start );
	}else{
	    if( !this._playflg ){
		video.play();
		this._playflg = true;
		//this.opentab.contentWindow.scroll( 0, video.offsetTop - 32 );
	    }
	    //if( video.readyState==4 /*HAVE_ENOUGH_DATA*/ ){
		//video.play();
	    //}
	}
    },

    /**
     * ニコニコ動画で再生する.
     * オフライン時専用
     */
    playByNicovideo: function(){
	// playing, paused, end
	if( this.opentab.contentDocument ){
	    let player = this.opentab.contentDocument.getElementById( 'MainVideoPlayer' );
	    if( player ){
		this.playByNicovideoHTML5();
	    }else{
		this.playByNicovideoFlash();
	    }
	}else{
	    clearInterval( this._playlist_timer );
	}
    },

    /**
     * ファイルからストックに登録する.
     * @file file nsIFileオブジェクト
     */
    readFileToStock:function(file){
	// file は nsIFile
	let istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(file, 0x01, 0o444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);

	// 行を配列に読み込む
	let line = {}, hasmore;
	let first = true;
	do {
	    hasmore = istream.readLine(line);
	    if( line.value.match(/(sm|nm|im)\d+|\d{10}/) ){
		if(first){
		    //NicoLiveHelper.clearStock();
		    first = false;
		}
		this.addStock(line.value);
	    }
	} while(hasmore);

	istream.close();
    },

    /* ファイルをドロップしたとき
     * application/x-moz-file
     * text/x-moz-url
     * 
     * Firefoxからリンクをドロップしたとき
     * text/x-moz-url
     * text/x-moz-url-data
     * text/x-moz-url-desc
     * text/uri-list
     * text/_moz_htmlcontext
     * text/_moz_htmlinfo
     * text/html
     * text/plain
     * 
     * Firefoxからタブをドロップしたとき
     * application/x-moz-tabbrowser-tab
     * text/x-moz-text-internal
     */
    checkDrag:function(event){
	//let b = event.dataTransfer.types.contains("application/x-moz-file");
	/*
	debugprint("--");
	for(let i=0;i<event.dataTransfer.types.length;i++){
	    debugprint('dragging:'+event.dataTransfer.types.item(i));
	}
	 */
	event.preventDefault();
	return true;
    },

    /**
     * ストックタブに何かドロップされたときの処理.
     */
    drop:function(event){
	//this.dataTransfer = event.dataTransfer;

	// ファイル(*.txt)をドロップしたとき.
	var file = event.dataTransfer.mozGetDataAt("application/x-moz-file", 0);
	if (file instanceof Components.interfaces.nsIFile){
	    if( !file.leafName.match(/\.txt$/) ) return;
	    debugprint("file dropped:"+file.path);
	    this.readFileToStock(file);
	    return;
	}
	// テキストをドロップしたとき.
	if( event.dataTransfer.types.contains('text/plain') ){
	    let txt = event.dataTransfer.mozGetDataAt("text/plain",0);
	    this.addStock(txt);
	    return;
	}
	// アンカー<a>をドロップしたとき.
	if( event.dataTransfer.types.contains("text/uri-list") ){
	    let uri = event.dataTransfer.mozGetDataAt("text/uri-list",0);
	    debugprint("uri dropped:"+uri);
	    this.addStock(uri);
	    return;
	}
	// ブラウザのタブをドロップしたとき.
	if( event.dataTransfer.types.contains("application/x-moz-tabbrowser-tab") ){
	    //this._debug = event;
	    debugprint("tab dropped");
	    let str = "";
	    let tab = event.dataTransfer.mozGetDataAt("application/x-moz-tabbrowser-tab",0);
	    let doc = tab.linkedBrowser.contentDocument;
	    // 新検索β
	    if( doc.location.hostname.match(/search.nicovideo/) ){
		let items = evaluateXPath(doc,"//li[@class='video']/div/a/@data-cmsid");
		for(let i=0,item; item=items[i]; i++){
		    debugprint(item.textContent);
		    str += item.textContent + " ";
		}
	    }
	    // 検索ページ、ランキングページ
	    let items = evaluateXPath(doc,"//li[contains(@class, 'item')]/@data-id");
	    for(let i=0,item; item=items[i]; i++){
		str += item.textContent + " ";
	    }
	    // コミュニティ動画
	    items = evaluateXPath(doc,"//a[@class='def']/@href");
	    for(let i=0,item; item=items[i]; i++){
		//debugprint(item.textContent);
		str += item.textContent + " ";
	    }
	    // ユーザーページの投稿動画
	    if( doc.location.href.match(/user\/\d+\/video$/) ){
		items = evaluateXPath(doc,"//*[@class='mylistVideo']/h4/a/@href");
		for(let i=0,item; item=items[i]; i++){
		    //debugprint(item.textContent);
		    str += item.textContent + " ";
		}
	    }

	    str += event.dataTransfer.mozGetDataAt("text/x-moz-text-internal",0);
	    this.addStock(str);

	    // 検索ページの場合、広告ポイントを取得する
	    let uadp = evaluateXPath(doc,"//*[@class='vinfo_uadp']");
	    let vids = evaluateXPath(doc,"//*[@class='uad_thumbfrm' or @class='uad_thumbfrm_1' or @class='uad_thumbfrm_2']/table/tbody/tr/td/p/a/@href");
	    for(let i=0,item; item=vids[i]; i++){
		let d = item.textContent.match(/.+\/(.*?)$/);
		let info = { "vid": d[1], "uadp": uadp[i].textContent.replace(/,/g,'') };
		info.uadp = parseInt(info.uadp);
		if( NicoLiveHelper._uadp==undefined ){
		    NicoLiveHelper._uadp = new Object();
		}
		NicoLiveHelper._uadp[ "_"+info.vid ] = info.uadp;
	    }
	    return;
	}
    },

    init:function(){
	debugprint("NicoLiveStock.init");
    }
};

window.addEventListener("load", function() { NicoLiveStock.init(); }, false);
