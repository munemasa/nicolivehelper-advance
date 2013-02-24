var NicoLiveWindow = {

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

    openInAppBrowser:function(url, hasfocus, param1, param2, param3, param4, param5){
	let feature="chrome,resizable=yes";
	let win = window.openDialog("chrome://nicolivehelperadvance/content/browser.xul",
				    "inappbrowser",feature, url, param1, param2, param3, param4 ,param5);
	if( hasfocus ){
	    win.focus();
	}
	return win;
    },

    // 左のタブから1,2,3,....,9,0 の番号としてタブを切り替える.
    changeTab:function(n){
	n = (n + 9) % 10;
	$('maintabs').selectedIndex = n;
    },
    moveRightTab:function(){
	let n = $('maintabs').selectedIndex+1;
	n++;
	this.changeTab(n);
    },
    moveLeftTab:function(){
	let n = $('maintabs').selectedIndex+1;
	n--;
	this.changeTab(n);
    },

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
    hideThumbnail:function(){
	$('iframe-thumbnail').width = 312;
	$('iframe-thumbnail').height = 0;
	$('iframe-thumbnail').style.opacity = 0;
    },

    /**
     * クッキーを利用するブラウザを変更する
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

    init: function(){
	this.initBrowserIcon();
    }
};


window.addEventListener("load", function(e){ NicoLiveWindow.init(); }, false);
