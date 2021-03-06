/* -*- mode: js2;-*- */

var EXPORTED_SYMBOLS = ["NicoLiveAlertModule"];

//Components.utils.import("resource://gre/modules/Timer.jsm");

function debugprint(str){
    var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
	getService(Components.interfaces.nsIConsoleService);
    aConsoleService.logStringMessage(str);
}

/**
 * anonymousでニコ生アラートを使用する.
 */

var NicoLiveAlertModule = {
    connected: false,
    alert_target: {},     // 通知対象
    alerted_target: {},   // 通知済みフラグ
    use_external_browser: false,

    XPathEvaluator: null,

    window_instance: null,

    /**
     * 通知対象として登録済みか.
     */
    isRegistered:function(target){
	return this.alert_target[target];
    },

    /**
     * 通知対象を登録する.
     * @param target コミュニティID(coxxx,chxxx)か放送ID(lvxxx)を指定する
     * @param instance 真になるオブジェクト
     */
    registerTarget:function(target, instance){
	this.alert_target[target] = instance;
    },
    /**
     * 通知対象から外す.
     */
    unregisterTarget:function(target){
	delete this.alert_target[target];
    },

    /**
     * ニコ生アラート処理の本体
     */
    checkAlert:function(chat){
	//debugprint(chat);
	var dat = chat.split(',');
	var request_id, community_id, caster_id;
	switch(dat.length){
	case 3:
	    caster_id = dat[2];
	case 2:
	    community_id = dat[1];
	case 1:
	    request_id = "lv"+dat[0];
	default:
	    break;
	}
	var d = this.alert_target[community_id] || this.alert_target[request_id];
	if( d ){
	    if( !this.alerted( community_id, request_id ) ){
		this.alerted_target[community_id] = request_id;
		/*
		setTimeout( function(){
				NicoLiveAlertModule.openDefaultBrowser("http://live.nicovideo.jp/watch/"+request_id);
			    }, 2000 );
		 */
		NicoLiveAlertModule.openDefaultBrowser("http://live.nicovideo.jp/watch/"+request_id);
		// シングルウィンドウでオートタブクローズが有効なら.
		try{
		    if( this.window_instance.config.isSingleWindow() &&
			this.window_instance.config.isAutoTabClose() ){
			this.window_instance.closeBroadcastingTab( this.window_instance.liveinfo.request_id,
								   this.window_instance.liveinfo.default_community );
		    }
		    if( this.window_instance.config.isSingleWindow() ){
			this.window_instance.openNewBroadcast(request_id, "", "", community_id);
		    }
		}catch(e){}
	    }
	}
    },

    alerted: function(community_id, request_id){
	if( this.alerted_target[community_id]==request_id ) return true;
	return false;
    },

    openDefaultBrowser:function(url, hasfocus){
	if( this.use_external_browser ){
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
	    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
	    var browserEnumerator = wm.getEnumerator("navigator:browser");
	    var browserInstance = browserEnumerator.getNext().gBrowser;
	    var tab = browserInstance.addTab( url );
	    browserInstance.selectedTab = tab;
	    return tab;
	}
    },

    // コメントサーバからやってくる1行分のテキストを処理.
    processAlert:function(line){
	if(line.match(/^<chat\s+.*>/)){
	    var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
		.createInstance(Components.interfaces.nsIDOMParser);
	    var dom = parser.parseFromString(line,"text/xml");
	    var chat  = dom.getElementsByTagName('chat')[0].textContent;
	    this.checkAlert(chat);
	    return;
	}
    },

    /**
     * XPathの評価をする.
     * @param aNode ノード
     * @param aExpr 式
     * @return 式を評価した結果を配列で返す
     */
    evaluateXPath:function(aNode, aExpr) {
	var xpe = new this.XPathEvaluator();
	var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
					      aNode.documentElement : aNode.ownerDocument.documentElement);
	var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
	var found = [];
	var res;
	while (res = result.iterateNext())
	    found.push(res);
	return found;
    },

    /**
     * ニコ生アラートサーバーから切断する.
     */
    closeConnection:function(){
	if( this.oStream ){
	    this.oStream.close();
	    delete this.oStream;
	}
	if( this.ciStream ){
	    this.ciStream.close();
	    delete this.ciStream;
	    debugprint('disconnected from nico alert server.');
	}
	this.connected = false;
    },

    /**
     * ニコ生アラートサーバーに接続する.
     * @param server 接続するホスト
     * @param port ポート番号
     * @param thread スレッド
     */
    connectCommentServer: function(server,port,thread){
	debugprint(server+":"+port+":"+thread);

	var socketTransportService = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService(Components.interfaces.nsISocketTransportService);
	var socket = socketTransportService.createTransport(null,0,server,port,null);
	var iStream = socket.openInputStream(0,0,0);

	this.ciStream = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
	this.ciStream.init(iStream,"UTF-8",0,Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

	this.pump = Components.classes["@mozilla.org/network/input-stream-pump;1"].createInstance(Components.interfaces.nsIInputStreamPump);
	this.pump.init(iStream,-1,-1,0,0,false);

	this.oStream = socket.openOutputStream(0,0,0);
	this.coStream = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
	this.coStream.init(this.oStream,"UTF-8",0,Components.interfaces.nsIConverterOutputStream.DEFAULT_REPLACEMENT_CHARACTER);

	var dataListener = {
	    line: "",
	    onStartRequest: function(request, context){
	    },
	    onStopRequest: function(request, context, status){
		// 切断
		NicoLiveAlertModule.closeConnection();
	    },
	    onDataAvailable: function(request, context, inputStream, offset, count) {
		var lineData = {};
		var r;
		while(1){
		    // まとめて読むと、行単位の区切り付けるのメンドイんで.
		    try{
			r = NicoLiveAlertModule.ciStream.readString(1,lineData);
		    } catch (x) { return; }
		    if( !r ){ break; }
		    if( lineData.value=="\0" ){
			NicoLiveAlertModule.processAlert(this.line);
			this.line = "";
			continue;
		    }
		    this.line += lineData.value;
		}
	    }
	};
	this.keepalive();
	this.pump.asyncRead(dataListener,null);
	debugprint('Connect nicolive alert server.');
	this.connected = true;
    },

    /**
     * 通信が切断されないようにキープアライブ処理.
     */
    keepalive:function(){
	let str = "<thread thread=\""+this.thread+"\" res_from=\"-1\" version=\"20061206\"/>\0";
	this.coStream.writeString(str);
    },

    /**
     * ニコ生アラートサーバーに接続する.
     * なぜ呼び出し元からXMLHttpRequestをもらう必要があるのか覚えてない.
     * @param req XMLHttpRequestオブジェクト
     */
    connect:function( req ){
	if( this.connected ) return;

	/*
	const { XMLHttpRequest } = Components.classes["@mozilla.org/appshell/appShellService;1"]  
            .getService(Components.interfaces.nsIAppShellService)  
            .hiddenDOMWindow;  
	var req = XMLHttpRequest();  
	 */
	var url = "http://live.nicovideo.jp/api/getalertinfo";
	if( !req ) return;

	req.onreadystatechange = function(){
	    if( req.readyState==4 ){
		if( req.status==200 ){
		    var xml = req.responseXML;
		    var status = NicoLiveAlertModule.evaluateXPath(xml,"/getalertstatus/@status");
		    if( status.length && status[0].textContent.match(/ok/i) ){
			try{
			    NicoLiveAlertModule.user_id = NicoLiveAlertModule.evaluateXPath(xml,"/getalertstatus/user_id")[0].textContent;
			    NicoLiveAlertModule.user_hash = NicoLiveAlertModule.evaluateXPath(xml,"/getalertstatus/user_hash")[0].textContent;
			    NicoLiveAlertModule.addr = NicoLiveAlertModule.evaluateXPath(xml,"/getalertstatus/ms/addr")[0].textContent;
			    NicoLiveAlertModule.port = NicoLiveAlertModule.evaluateXPath(xml,"/getalertstatus/ms/port")[0].textContent;
			    NicoLiveAlertModule.thread = NicoLiveAlertModule.evaluateXPath(xml,"/getalertstatus/ms/thread")[0].textContent;

			    NicoLiveAlertModule.connectCommentServer(NicoLiveAlertModule.addr, NicoLiveAlertModule.port, NicoLiveAlertModule.thread);
			} catch (x) {
			    debugprint(x);
			}
		    }
		}else{
		    debugprint('failed to connect nico alert server.');
		}
	    }
	};

	req.open('GET', url );
	req.send('');
    }

};
