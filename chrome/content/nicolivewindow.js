var NicoLiveWindow = {

    /**
     * 指定の生放送のタブを検索する.
     * @param request_id 放送ID
     */
    findTab:function(request_id){
	let wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
	let browserEnumerator = wm.getEnumerator("navigator:browser");
	let url = "http://live.nicovideo.jp/watch/"+request_id;
	while(browserEnumerator.hasMoreElements()) {
	    let browserInstance = browserEnumerator.getNext().gBrowser;
	    // browser インスタンスの全てのタブを確認する.
	    let numTabs = browserInstance.tabContainer.childNodes.length;
	    for(let index=0; index<numTabs; index++) {
		let currentBrowser = browserInstance.getBrowserAtIndex(index);
		if (currentBrowser.currentURI.spec.match(url)) {
		    return browserInstance.tabContainer.childNodes[index];
		}
	    }
	}
	return null;
    },

    /**
     * 指定のURLを開く.
     * @param url URL
     * @param hasfocus 開いたタブがフォーカスを得るか
     */
    openDefaultBrowser:function(url, hasfocus){
	if( NicoLiveHelper._use_other_browser ){
	    // まず ioservice を用いて nsIURI オブジェクトを作る
	    var ioservice = Components.classes["@mozilla.org/network/io-service;1"]
		.getService(Components.interfaces.nsIIOService);
	
	    var uriToOpen = ioservice.newURI(url, null, null);
	
	    var extps = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
		.getService(Components.interfaces.nsIExternalProtocolService);
	
	    // そしてそれを開く
	    extps.loadURI(uriToOpen, null);
	    return null;
	}else{
	    let tab = window.opener.getBrowser().addTab( url );
	    if( hasfocus ){
		window.opener.getBrowser().selectedTab = tab;
	    }
	    return tab;
	}
    },

    /**
     * アプリ内蔵ブラウザの方を開く.
     */
    openInAppBrowser:function(url, hasfocus, param1, param2, param3, param4, param5){
	let feature="chrome,resizable=yes";
	let win = window.openDialog("chrome://nicolivehelperadvance/content/browser/browser.xul",
				    "inappbrowser",
				    feature, url, param1, param2, param3, param4 ,param5);
	if( hasfocus ){
	    win.focus();
	}
	return win;
    },

    setWindowList:function(){
	this.winlist = WindowEnumerator();

	while(1){
	    let removetarget = document.getElementsByClassName("menu-window-list");
	    if( removetarget.length ){
		$('popup-windowlist').removeChild( removetarget[0] );
	    }else break;
	}

	let endmarker = $('window-list-end-marker');
	for(let i=0,win;win=this.winlist[i];i++){
	    let menuitem;
	    let title = win.document.title;
	    menuitem = CreateMenuItem(title,i);
	    menuitem.setAttribute("class","menu-window-list");
	    menuitem.setAttribute("oncommand","NicoLiveWindow.winlist[event.target.value].focus();");
	    $('popup-windowlist').insertBefore(menuitem, endmarker);
	}
	return true;
    },

    /**
     * ウィンドウを移動する
     * @param x X座標
     * @param y Y座標
     */
    move: function(x,y){
	window.moveTo(x,y);
    },

    /**
     * ウィンドウサイズを変更する
     * @param w 幅
     * @param h 高さ
     */
    resize: function(w,h){
	window.resizeTo(w,h);	
    },

    /**
     * ウィンドウをデフォルトサイズにする.
     */
    setDefaultSize:function(){
	//let dw = window.outerWidth-window.innerWidth;
	//let dh = window.outerHeight-window.innerHeight;
	this.resize(640,480);
    },

    /**
     * タブを切り替える.
     * @param n タブ番号(左から1,2,3,...,0)
     */
    changeTab:function(n){
	n = (n + 9) % 10;
	$('maintabs').selectedIndex = n;
    },
    /**
     * タブを右に切り替える.
     */
    moveRightTab:function(){
	let n = $('maintabs').selectedIndex+1;
	n++;
	this.changeTab(n);
    },
    /**
     * タブを左に切り替える.
     */
    moveLeftTab:function(){
	let n = $('maintabs').selectedIndex+1;
	n--;
	this.changeTab(n);
    },

    /**
     * 動画サムネイルを表示する.
     * @param event DOMイベント
     * @param video_id 動画ID
     */
    showThumbnail:function(event,video_id){
	$('iframe-thumbnail').src = "http://ext.nicovideo.jp/thumb/"+video_id;
	let x,y;
	// 312x176
	x = event.clientX;
	y = event.clientY;
	if( y+176 > window.innerHeight ){
	    y = y - 176 - 10;
	}
	if( x+312 > window.innerWidth ){
	    x = x - 312 - 10;
	}

	$('iframe-thumbnail').style.left = x + 5 + "px";
	$('iframe-thumbnail').style.top = y + 5 + "px";
	$('iframe-thumbnail').style.display = 'block';
	$('iframe-thumbnail').width = 312;
	$('iframe-thumbnail').height = 176;
	$('iframe-thumbnail').style.opacity = 1;
    },
    /**
     * 動画サムネイルを非表示にする.
     */
    hideThumbnail:function(){
	$('iframe-thumbnail').width = 312;
	$('iframe-thumbnail').height = 0;
	$('iframe-thumbnail').style.opacity = 0;
    },

    /**
     * クッキーを利用するブラウザを変更する.
     */
    changeBrowser: function(){
	this.initBrowserIcon();
	AlertPrompt('ブラウザ設定が変更されました。有効にするにはウィンドウを開き直してください。','NicoLive Helper Advance');
    },

    /**
     * ステータスバー上のブラウザアイコンの設定.
     */
    initBrowserIcon: function(){
	let panel = $('status-bar-browser');
	if( $('use-firefox').hasAttribute('checked') ){
	    panel.setAttribute('src','data/firefox.png');
	}
	if( $('use-google-chrome').hasAttribute('checked') ){
	    panel.setAttribute('src','data/chrome.png');
	}
	if( $('use-protected-mode-ie').hasAttribute('checked') ){
	    panel.setAttribute('src','data/ie.png');
	}
	if( $('use-standard-mode-ie').hasAttribute('checked') ){
	    panel.setAttribute('src','data/ie.png');
	}
	if( $('use-mac-safari').hasAttribute('checked') ){
	    panel.setAttribute('src','data/safari.png');
	}
    },

    /**
     * 生放送ページをプレイヤーの位置までスクロールする.
     * 設定にチェックがなければスクロールしない。
     */
    scrollLivePage: function(){
	let prefs = Config.getBranch();
	if( prefs.getBoolPref("window.autoscroll") ){
	    try{
		let tab = this.findTab(GetRequestId()) || this.findTab(NicoLiveHelper.liveinfo.default_community);
		let player;
		if(tab){
		    // watch_player_top_box for ニコニコ動画Zero
		    player = tab.linkedBrowser.contentDocument.getElementById('watch_player_top_box').wrappedJSObject
			|| tab.linkedBrowser.contentDocument.getElementById('WatchPlayer').wrappedJSObject; // for 原宿
		    tab.linkedBrowser.contentWindow.scroll(0,player.offsetTop-32);
		}
	    } catch (x) {
	    }
	}	
    },

    // ストック、リクエスト、再生履歴を検索.
    findRequestStock:function(){
	let tr;
	let tabindex = $('tabpanels').selectedIndex;

	switch( tabindex ){
	case 0:
	    tr = $('request-table').getElementsByTagName('tr');
	    break;
	case 1:
	    tr = $('stock-table').getElementsByTagName('tr');
	    break;
	case 3:
	    tr = $('playlist-table').getElementsByTagName('tr');
	    break;
	default:
	    return;
	}

	let searchword = InputPrompt(LoadString('STR_FIND_STRING'),LoadString('STR_FIND'),'');
	if(searchword==null) return;

	this.searchword = searchword;
	this.searchfoundidx = 0;
	this.searchtab = tabindex;

	for(let i=0,row;row=tr[i];i++){
	    if(row.innerHTML.match(searchword)){
		row.scrollIntoView(true);
		this.searchfoundidx = i;
		break;
	    }
	}
    },

    // 次を検索.
    findNextRequestStock:function(){
	let tr;
	let tabindex = $('tabpanels').selectedIndex;
	if( this.searchtab!=tabindex ) return;

	switch( tabindex ){
	case 0:
	    tr = $('request-table').getElementsByTagName('tr');
	    break;
	case 1:
	    tr = $('stock-table').getElementsByTagName('tr');
	    break;
	case 3:
	    tr = $('playlist-table').getElementsByTagName('tr');
	    break;
	default:
	    return;
	}

	let searchword = this.searchword;

	for(let i=this.searchfoundidx+1,row;row=tr[i];i++){
	    if(row.innerHTML.match(searchword)){
		row.scrollIntoView(true);
		this.searchfoundidx = i;
		break;
	    }
	}
    },

    /**
     * テキスト検索を開始する.
     */
    find:function(){
	let tr;
	let tabindex = $('tabpanels').selectedIndex;
	switch( tabindex ){
	case 0:// request
	case 1:// stock
	case 3:// playlist
	    this.findRequestStock();
	    return;

	case 4:// comment
	    tr = $('comment-table').getElementsByTagName('tr');
	    break;
	default:
	    return;
	}

	let searchword = InputPrompt(LoadString('STR_FIND_STRING'),LoadString('STR_FIND'),'');
	if(searchword==null) return;

	this.searchword = searchword;
	this.searchfoundidx = 0;
	this.searchtab = tabindex;

	for(let i=0,row;row=tr[i];i++){
	    if(row.innerHTML.match(searchword)){
		row.scrollIntoView(true);
		this.searchfoundidx = i;
		break;
	    }
	}
    },
    findNext:function(){
	let tr;
	let tabindex = $('tabpanels').selectedIndex;

	switch( tabindex ){
	case 0:// request
	case 1:// stock
	case 3:// playlist
	    this.findNextRequestStock();
	    return;

	case 4:// comment
	    tr = $('comment-table').getElementsByTagName('tr');
	    break;
	default:
	    return;
	}

	if( this.searchtab!=tabindex ) return;
	let searchword = this.searchword;

	for(let i=this.searchfoundidx+1,row;row=tr[i];i++){
	    if(row.innerHTML.match(searchword)){
		row.scrollIntoView(true);
		this.searchfoundidx = i;
		break;
	    }
	}

    },

    openNicoAlertManager:function(){
	var value = null;
	var f = "chrome,resizable=yes,centerscreen";
	var w = window.openDialog("chrome://nicolivehelperadvance/content/nicoalertmanager.xul","nicoalert",
				  f,value);
	w.focus();
    },

    /**
     * ニコ生アラートの接続状態チェック.
     * ニコ生アラートに接続しているかどうかを確認してメニューの表示、非表示を変更する。
     */
    checkNicoAlertConnected:function(){
	if( NicoLiveAlertModule.connected ){
	    $('nicoalert-disconnect').hidden = false;
	    $('nicoalert-connect').hidden = true;
	}else{
	    $('nicoalert-disconnect').hidden = true;
	    $('nicoalert-connect').hidden = false;
	}
    },

    /**
     * タブの位置を復元する.
     */
    restoreTabPositions:function(){
	let tabs = Storage.readObject("nico_live_tab_position", [] );
	let maintabs = $('maintabs');
	let tabindex = $('mainwindow-tab').selectedIndex;
	for(let i=0,item; item=tabs[i]; i++){
	    let elem = document.getElementById( item );
	    if( elem ){
		maintabs.insertBefore( elem, maintabs.firstChild );
	    }
	}
	$('mainwindow-tab').selectedIndex = tabindex;
    },

    /**
     * セットリスト名を保存する.
     */
    saveSetListName:function(){
	let elems = evaluateXPath2(document,"//xul:menulist[@class='select-setlist']//xul:menuitem");
	let data = new Array();
	for ( let item of elems ){
	    let value = item.getAttribute("label2") || item.value;
	    data.push( value );
	}
	Storage.writeObject("nico-live-setlist-name", data );
    },

    /**
     * セットリストの名前を変更する.
     * @param elem ノード
     * @param event DOMイベント
     */
    changeSetName:function(elem,event){
	if ('object' == typeof event){
	    let btnCode = event.button;
	    switch (btnCode){
	    case 2: // right
                break;
	    case 1: // middle
	    case 0: // left
	    default: // unknown
		return;
	    }
	}
	let n = elem.value;
	let items = elem.getElementsByTagName("menuitem");
	let oldname = items[ n ].getAttribute("label2") || items[ n ].value;
	let name = InputPrompt( "セットリストの名前を入力してください", "セットリスト名入力", oldname );
	if( name ){
	    items[ n ].setAttribute("label2",name);
	    this.saveSetListName();
	}
    },

    /**
     * セットリスト名を表示する.
     */
    showSetListMenu:function(elem){
	let items = elem.getElementsByTagName("menuitem");
	for (let item of items ){
	    try{
		let label = item.getAttribute("label2");
		if( label ){ item.label = label; }
	    } catch (x) {
	    }
	}
    },
    /**
     * セットリスト名を非表示にする.
     */
    hideSetListMenu:function(elem){
	let items = elem.getElementsByTagName("menuitem");
	for (let item of items ){
	    item.label = item.value;
	}
    },
    /**
     * 保存したセットリスト名を読み込む.
     */
    loadSetListName:function(){
	let elems = evaluateXPath2(document,"//xul:menulist[@class='select-setlist']//xul:menuitem");
	let items = Storage.readObject("nico-live-setlist-name", [] );
	for( let i=0,item; item=items[i]; i++ ){
	    elems[i].setAttribute("label2", item );
	}
    },

    init: function(){
	this.initBrowserIcon();
	this.restoreTabPositions();
	this.loadSetListName();
    }
};


window.addEventListener("load", function(e){ NicoLiveWindow.init(); }, false);
