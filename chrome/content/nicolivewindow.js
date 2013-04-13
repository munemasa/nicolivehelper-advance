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
	let win = window.openDialog("chrome://nicolivehelperadvance/content/browser.xul",
				    "inappbrowser",
				    feature, url, param1, param2, param3, param4 ,param5);
	if( hasfocus ){
	    win.focus();
	}
	return win;
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

    init: function(){
	this.initBrowserIcon();
    }
};


window.addEventListener("load", function(e){ NicoLiveWindow.init(); }, false);
