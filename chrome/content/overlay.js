var NicoLiveHelperAdvanceOverlay = {
    debugprint:function(txt){
	//Application.console.log(txt);
    },

    getPref:function(){
	return new PrefsWrapper1("extensions.nicolivehelperadvance.");
    },

    insertHistory:function(url,title){
	if(url=="lv0") return;

	let menu = document.getElementById('nicolive-advance-menu-popup');
	for(let i=0,item;item=menu.children[i];i++){
	    if(item.value==url){
		return;
	    }
	}

	if(menu.children.length>=20){
	    menu.removeChild(menu.lastChild);
	}
	
	let elem = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",'menuitem');
	elem.setAttribute('label',title);
	elem.setAttribute('value',url);
	elem.setAttribute("oncommand","window.content.location.href = 'http://live.nicovideo.jp/watch/"+url+"';");
	menu.insertBefore(elem,menu.firstChild);
	menu = null; elem = null; i = null; item = null;
    },

    findWindow:function(){
	let wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
	let win = wm.getMostRecentWindow("NicoLiveHelperAdvanceMainWindow");
	return win;
    },

    findSpecificWindow:function(request_id){
	let wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
	let enumerator = wm.getEnumerator("NicoLiveHelperAdvanceMainWindow");
	while(enumerator.hasMoreElements()) {
	    let win = enumerator.getNext();
	    if( win.name.indexOf(request_id)>=0 ){
		return win;
	    }
	}
	return null;
    },

    /** NicoLive Helperを開く
     * @param url 放送ID
     * @param title 番組名
     * @param iscaster 生主かどうか
     * @param community_id コミュニティID
     */
    open:function(url,title,iscaster,community_id){
	let feature="chrome,resizable=yes";
	Application.storage.set("nico_request_id",url);
	Application.storage.set("nico_live_title",title);
	Application.storage.set("nico_live_caster",iscaster);
	Application.storage.set("nico_live_coid",community_id);

	this.debugprint("request id:"+url);
	this.debugprint("title:"+title);
	this.debugprint("caster:"+iscaster);
	this.debugprint("community:"+community_id);

	if( 0 && this.isSingleWindowMode() ){
	    let win = this.findWindow();
	    if(win){
		this.debugprint("NicoLive Helper Window Exists.");
		win.NicoLiveHelper.connectNewBroadcasting(url,title,iscaster,community_id);
		win.focus();
	    }else{
		let w = window.open("chrome://nicolivehelperadvance/content/mainwindow.xul","NLHADV_lv0",feature);
		w.arguments = [ url, title, iscaster, community_id ];
		w.focus();
	    }
	}else{
	    let win = this.findSpecificWindow(url);
	    if( win ){
		win.focus();
	    }else{
		let w = window.open("chrome://nicolivehelperadvance/content/mainwindow.xul","NLHADV_"+url,feature);
		w.arguments = [ url, title, iscaster, community_id ];
		w.focus();
	    }
	}
	this.insertHistory(url,title);
	//Application.console.log(url+' '+title);
    },

    getNsenId:function(ch){
	let url = "http://live.nicovideo.jp/nsen/"+ch+"?mode=getvid";
	let req = new XMLHttpRequest();
	if( !req ) return;
	req.open("GET", url);
	req.onreadystatechange = function(){
	    if( req.readyState==4 && req.status==200 ){
		let xml = req.responseXML;
		try{
		    let request_id = xml.getElementsByTagName("video_id")[0].textContent;
		    NicoLiveHelperAdvanceOverlay.openNicoLiveWindow("http://live.nicovideo.jp/watch/"+request_id);
		} catch (x) {
		}
	    }
	};
	req.send("");
    },

    // メニューからopenする.
    openNicoLiveWindow:function(url){
	let unsafeWin = window.content.wrappedJSObject;
	let request_id;
	if( !url ) url = window.content.location.href;

	let r = url.match(/watch\/nsen\/(.*)$/);
	if( r ){
	    this.getNsenId(r[1]);
	    return;
	}

	// URLからrequest idを.
	request_id = url.match(/watch\/((lv|co|ch)\d+)/);
	if(!request_id){
	    // URLから接続先が分からなければページ内の情報にアクセス.
	    try{
		request_id = unsafeWin.Video.id;
		if( !request_id || request_id.indexOf("lv")!=0 ){
		    request_id="lv0";
		}
	    } catch (x) {
		request_id="lv0";
	    }
	}else{
	    request_id = request_id[1];
	}

	let title;
	let iscaster = true;
	// 番組タイトルは id="title"
	// タイトルタグ
	// <h2 class="title" title="タイトル名">
	try{
	    title = doc.getElementById("title").textContent.match(/^\s+(.*)\s+$/)[1]; // 〜原宿
	} catch (x) {
	    try{
		if( request_id==unsafeWin.Video.id ){
		    title = unsafeWin.Video.title;// Zero〜
		}else{
		    title = doc.getElementsByTagName('title')[0];
		}
	    } catch (x) {
		try{
		    // タイトルタグで
		    title = doc.getElementsByTagName('title')[0];
		} catch (x) {
		    title = "";
		}
	    }
	}

	if(request_id!="lv0"){
	    if( !window.content.document.body.innerHTML.match(/console\.swf/) ){
		// 生主コンソールがないならリスナ.
		iscaster = false;
	    }
	    if( window.content.document.getElementById("utility_container") ){
		// 新バージョンではutility_containerがあれば生主.
		iscaster = true;
	    }
	}
	let community_id = "";
	if( url.match(/(ch|co)\d+/) ){
	    // co番号でアクセスした場合、コミュ番号を取得する.
	    community_id = request_id;
	    this.debugprint("to connect to broadcasting using community id:"+community_id);
	}
	this.open(request_id,title,iscaster,community_id);
    },

    onPageLoad:function(e){
	let unsafeWin = e.target.defaultView.wrappedJSObject;
	let url = e.target.location.href;
	let request_id;

	// URLからrequest idを.
	request_id = url.match(/nicovideo.jp\/watch\/((lv|co|ch)\d+)/);
	if(!request_id){
	    try{
		request_id = unsafeWin.Video.id;
		if( !request_id || request_id.indexOf("lv")!=0 ) return;
	    } catch (x) {
		//Application.console.log(x);
		return;
	    }
	}else{
	    request_id = request_id[1];
	}

	if( request_id ){
	    let elem;
	    elem = e.target.createElement("input");
	    elem.setAttribute("type","button");
	    elem.setAttribute("value","NicoLive Helper Advanceを開く");
	    elem.addEventListener("click",function(){
				      NicoLiveHelperAdvanceOverlay.openNicoLiveWindow(url);
				  },true);
	    e.target.getElementById('flvplayer_container').appendChild(elem);
	}
	let player;
	try{
	    player = e.target.getElementById("WatchPlayer") || e.target.getElementById("flvplayer_container");
	} catch (x) {
	}
	let iscaster = false;
	if( !player ) return;

	// innerHTMLを見るしかできないのです.
	if(player.innerHTML.match(/console\.swf/)){
	    // 配信コンソールがあれば生主.
	    iscaster = true;
	}
	try{
	    if( e.target.getElementById("utility_container") ){
		// 新バージョン用のチェック.
		iscaster = true;
		this.debugprint("utility_container is found.");
	    }
	} catch (x) {
	    this.debugprint(x);
	    iscaster = false;
	}

	let prefs = this.getPref();
	if( prefs.getBoolPref("autowindowopen") && iscaster ||
	    prefs.getBoolPref("autowindowopen-listener") && !iscaster ){
		let title;
		try{
		    let doc = e.target;
		    title = doc.getElementById("title").textContent.match(/^\s+(.*)\s+$/)[1]; // 〜原宿
		} catch (x) {
		    try{
			title = unsafeWin.Video.title;// Zero〜
		    } catch (x) {
			try{
			    // タイトルタグで
			    title = doc.getElementsByTagName('title')[0];
			} catch (x) {
			    title = "";
			}
		    }
		}

		let community_id = "";
		if( url.match(/(ch|co)\d+/) ){
		    community_id = request_id;
		}
		this.open(request_id,title,iscaster,community_id);
	    }
    },

    GetAddonVersion:function(){
	let version;
	try{
	    let em = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
	    let addon = em.getItemForID("nicolivehelperadvance@miku39.jp");
	    version = addon.version;
	} catch (x) {
	    // Fx4
	    AddonManager.getAddonByID("nicolivehelperadvance@miku39.jp",
				      function(addon) {
					  version = addon.version;
					  //alert("My extension's version is " + addon.version);
				      });
	    // Piroさん(http://piro.sakura.ne.jp/)が値が設定されるまで待つことをやっていたので真似してしまう.
	    let thread = Components.classes['@mozilla.org/thread-manager;1'].getService().mainThread;
	    while (version === void(0)) {
		thread.processNextEvent(true);
	    }
	}
	return version;
    },

    checkFirstRun:function(){
	var Prefs = Components.classes["@mozilla.org/preferences-service;1"]
	    .getService(Components.interfaces.nsIPrefService);
	Prefs = Prefs.getBranch("extensions.nicolivehelperadvance.");

	var ver = -1, firstrun = true;
	var current = this.GetAddonVersion();
	//バージョン番号の取得
	try{
	    ver = Prefs.getCharPref("version");
	    firstrun = Prefs.getBoolPref("firstrun");
	}catch(e){
	    //nothing
	}finally{
	    if (firstrun){
		Prefs.setBoolPref("firstrun",false);
		Prefs.setCharPref("version",current);
		// ここに初めて実行したとき用のコードを挿入します。        
		window.setTimeout(function(){
				      gBrowser.selectedTab = gBrowser.addTab("http://code.google.com/p/nicolivehelper/wiki/Manual");
				  }, 1500);
	    }
	    if (ver!=current && !firstrun){ // !firstrun によりこのセクションは拡張機能を初めて使うときは実行されません。
		Prefs.setCharPref("version",current);
		// バージョンが異なるとき、すなわちアップグレードしたときに実行するコードを挿入します。
		window.setTimeout(
		    function(){
			gBrowser.selectedTab = gBrowser.addTab("http://code.google.com/p/nicolivehelper/wiki/UpdateHistory#0.1");
		    }, 1500);
	    }
	}
    },

    init:function(){
	let appcontent = document.getElementById("appcontent");   // ブラウザ
	if(appcontent){
	    appcontent.addEventListener("DOMContentLoaded",
					function(e){
					    NicoLiveHelperAdvanceOverlay.onPageLoad(e);
					},true);
	}
	this.nicolivehistory = new Array();
	this.checkFirstRun();
	appcontent = null;
    }
};

window.addEventListener("load", function(){
			    NicoLiveHelperAdvanceOverlay.init();
			}, false);
