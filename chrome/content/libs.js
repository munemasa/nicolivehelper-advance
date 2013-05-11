/**
 * いろいろと便利関数などを.
 */
try{
    // Fx4.0
    Components.utils.import("resource://gre/modules/AddonManager.jsm");
} catch (x) {
} 

const Cc = Components.classes;
const Ci = Components.interfaces;

const XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const HTML_NS= "http://www.w3.org/1999/xhtml";

const MAIN = 0;
const SUB = 1;

const ARENA = 0;
const STAND_A = 1;
const STAND_B = 2;
const STAND_C = 3;
const ROOM_NAME = ["アリーナ", "立ち見A列", "立ち見B列", "立ち見C列" ];

const PLAY_SEQUENTIAL = 0;
const PLAY_RANDOM = 1;
const PLAY_CONSUMPTION = 2;
const PLAY_REPEAT = 3;

// リクエストを受け付けない理由コード
const REASON_NOT_ACCEPT = 1;            // リクエストを受け付けていない
const REASON_NO_LIVE_PLAY = 2;          // 生放送で引用できない
const REASON_ALREADY_REQUESTED = 3;     // すでにリクエスト済み
const REASON_ALREADY_PLAYED = 4;        // すでに再生済み
const REASON_DISABLE_NEWMOVIE = 5;      // 新着動画の禁止
const REASON_MAX_NUMBER_OF_REQUEST = 6; // リクエスト数が多い
const REASON_NG_VIDEO = 7;              // NG動画
const REASON_REQUEST_CONDITION = 8;     // リクエスト制限にかかった
const REASON_USER_SCRIPT = 9;           // ユーザーカスタムスクリプトによる
const REASON_NO_REMAINTIME = 10;        // 枠の残り時間がない

const COMMENT_STATE_NONE = 0;              // 動画情報を送信する前
const COMMENT_STATE_MOVIEINFO_BEGIN = 1;   // 動画情報を送信中
const COMMENT_STATE_MOVIEINFO_DONE = 2;    // 動画情報の送信が終わった

// コメント表示状態.
const COMMENT_VIEW_NORMAL = 0;      // 上コメに表示できる.
const COMMENT_VIEW_HIDDEN_PERM = 1; // 上コメに表示できない(表示するには/clsが必要).

// 送信する主コメの種別.
const COMMENT_MSG_TYPE_AUTOREPLY = 0; // 0というか実際はundefined,nullになる.
const COMMENT_MSG_TYPE_MOVIEINFO = 1; // 動画情報の主コメのとき.
const COMMENT_MSG_TYPE_NORMAL    = 2; // 普通の主コメをするとき.


function $(tag){
    return document.getElementById(tag);
}

function $$(tag){
    return document.getElementsByTagName(tag);
}

/**
 * オブジェクトをマージする.
 * @param a オブジェクト1
 * @param b オブジェクト2
 * @param aにbをマージしたオブジェクトを返す
 */
function MergeSimpleObject(a,b)
{
    for(let k in b){
	a[k] = b[k];
    }
    return a;
}

/**
 * 配列をシャッフルする.
 * @param list 配列
 */
function ShuffleArray( list ){
    let i = list.length;
    while(i){
	let j = Math.floor(Math.random()*i);
	let t = list[--i];
	list[i] = list[j];
	list[j] = t;
    }
}

/**
 * Firefox extensionならtrueを返す.
 */
function OnFirefox(){
    if( navigator.userAgent.match(/NicoLiveHelper/) ) return false;
    return true;
}

/**
 * 生主ならtrueを返す
 */
function IsCaster()
{
    return NicoLiveHelper.iscaster;
}

/**
 * 生放送に接続しているかどうかを返す
 * @return オフラインならtrueを返す
 */
function IsOffline()
{
    return NicoLiveHelper.liveinfo.request_id=='lv0';
}

/**
 * 生放送IDを返す
 */
function GetRequestId(){
    return NicoLiveHelper.liveinfo.request_id;
}

/**
 * 生放送の残り時間を返す
 * @return 枠の残り時間(秒)
 */
function GetLiveRemainTime(){
    return NicoLiveHelper.liveinfo.end_time - GetCurrentTime();
}

var LibUserSessionCookie = "";
var LibUserAgent = "";
function SetUserAgent(s)
{
    LibUserAgent = s;
}
function SetUserSessionCookie(s)
{
    LibUserSessionCookie = s;
}

/**
 * @param method GET or POST
 * @param uri URI
 * @param substitution 使用するセッションクッキーを指定(任意)
 */
function CreateXHR(method,uri, substitution)
{
    let req = new XMLHttpRequest();
    if( !req ) return null;
    req.open(method,uri);
    if( LibUserAgent ){
	req.setRequestHeader("User-Agent", LibUserAgent );
    }
    if( LibUserSessionCookie ){
	if( substitution ){
	    new CookieMonster(req, substitution);
	}else{
	    new CookieMonster(req, LibUserSessionCookie );
	}
    }

    req.timeout = 30*1000; // 30sec timeout for Gecko 12.0+
    return req;
}

function GetAddonVersion()
{
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
				  });
	// Piroさん(http://piro.sakura.ne.jp/)が値が設定されるまで待つことをやっていたので真似してしまう.
	let thread = Components.classes['@mozilla.org/thread-manager;1'].getService().mainThread;
	while (version === void(0)) {
	    thread.processNextEvent(true);
	}
    }
    return version;
}

function GetXmlText(xml,path){
    try{
	let tmp = evaluateXPath(xml,path);
	if( tmp.length<=0 ) return null;
	return tmp[0].textContent;
    } catch (x) {
	debugprint(x);
	return null;
    }
}

// 特定の DOM ノードもしくは Document オブジェクト (aNode) に対して
// XPath 式 aExpression を評価し、その結果を配列として返す。
// 最初の作業を行った wanderingstan at morethanwarm dot mail dot com に感謝します。
function evaluateXPath(aNode, aExpr) {
    let xpe = new XPathEvaluator();
    let nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
					  aNode.documentElement : aNode.ownerDocument.documentElement);
    let result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
    let found = [];
    let res;
    while (res = result.iterateNext())
	found.push(res);
    return found;
}
function evaluateXPath2(aNode, aExpr) {
    let xpe = new XPathEvaluator();
    let nsResolver = function(){ return XUL_NS; };
    let result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
    let found = [];
    let res;
    while (res = result.iterateNext())
	found.push(res);
    return found;
}

function CreateElement(part){
    let elem;
    elem = document.createElementNS(XUL_NS,part);
    return elem;
}
function CreateHTMLElement(part){
    let elem;
    elem = document.createElementNS(HTML_NS,part);
    return elem;
}

/**
 * 指定の要素を削除する.
 * @param elem 削除したい要素
 */
function RemoveElement(elem){
    elem.parentNode.removeChild(elem);
}

/**
 * 指定の要素の子要素を全削除する.
 * @param elem 対象の要素
 */
function RemoveChildren(elem){
    while(elem.hasChildNodes()) { 
	elem.removeChild(elem.childNodes[0]);
    }
}

function CreateMenuItem(label,value){
    let elem;
    elem = document.createElementNS(XUL_NS,'menuitem');
    elem.setAttribute('label',label);
    elem.setAttribute('value',value);
    return elem;
};

function CreateButton(label){
    let elem;
    elem = document.createElementNS(XUL_NS,'button');
    elem.setAttribute('label',label);
    return elem;
}

function CreateLabel(label){
    let elem;
    elem = document.createElementNS(XUL_NS,'label');
    elem.setAttribute('value',label);
    return elem;
}


/** ディレクトリを作成する.
 * ディレクトリ掘ったらtrue、掘らなかったらfalseを返す.
 */
function CreateFolder(path){
    let file = OpenFile(path);
    if( !file.exists() || !file.isDirectory() ) {   // if it doesn't exist, create
	file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0777);
	return true;
    }
    return false;
}

/**
 * ファイルを開く
 */
function OpenFile(path){
    let localfileCID = '@mozilla.org/file/local;1';
    let localfileIID =Components.interfaces.nsILocalFile;
    try {
	let file = Components.classes[localfileCID].createInstance(localfileIID);
	file.initWithPath(path);
	return file;
    }
    catch(e) {
	return false;
    }
}

// NicoLiveHelperのインストールパスを返す.
function GetExtensionPath(){
    let id = "nicolivehelperadvance@miku39.jp";
    let ext;
    try{
	ext = Components.classes["@mozilla.org/extensions/manager;1"]
            .getService(Components.interfaces.nsIExtensionManager)
            .getInstallLocation(id)
            .getItemLocation(id);
    } catch (x) {
	let _addon;
	AddonManager.getAddonByID("nicolivehelperadvance@miku39.jp",
				  function(addon) {
				      _addon = addon;
				  });
	// Piroさん(http://piro.sakura.ne.jp/)が値が設定されるまで待つことをやっていたので真似してしまう.
	let thread = Components.classes['@mozilla.org/thread-manager;1'].getService().mainThread;
	while (_addon === void(0)) {
	    thread.processNextEvent(true);
	}
	ext = _addon.getResourceURI('/').QueryInterface(Components.interfaces.nsIFileURL).file.clone();
    }
    return ext;
}

function PlayAlertSound(){
    let sound = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
    sound.playSystemSound("_moz_alertdialog");
}

function AlertPrompt(text,caption){
    let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    let result = prompts.alert(window, caption, text);
    return result;
}

function ConfirmPrompt(text,caption){
    let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    let result = prompts.confirm(window, caption, text);
    return result;
}

function InputPrompt(text,caption,input){
    let check = {value: false};
    let input_ = {value: input};

    let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    let result = prompts.prompt(window, caption, text, input_, null, check);
    if( result ){
	return input_.value;
    }else{
	return null;
    }
}

function InputPromptWithCheck(text,caption,input,checktext){
    let check = {value: false};
    let input_ = {value: input};

    let prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
    let result = prompts.prompt(window, caption, text, input_, checktext, check);
    if( result ){
	return input_.value;
    }else{
	return null;
    }
}

/**
 *  Javascriptオブジェクトをファイルに保存する.
 * @param obj Javascriptオブジェクト
 * @param caption ファイル保存ダイアログに表示するキャプション
 */
function SaveObjectToFile(obj,caption)
{
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, caption, nsIFilePicker.modeSave);
    fp.appendFilters(nsIFilePicker.filterAll);
    let rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	let file = fp.file;
	let path = fp.file.path;
	let os = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	let flags = 0x02|0x08|0x20;// wronly|create|truncate
	os.init(file,flags,0664,0);
	let cos = GetUTF8ConverterOutputStream(os);
	cos.writeString( JSON.stringify(obj) );
	cos.close();
    }
}

/**
 *  ファイルからJavascriptオブジェクトを読み込む.
 * @param caption ファイル読み込みダイアログに表示するキャプション
 */
function LoadObjectFromFile(caption)
{
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, caption, nsIFilePicker.modeOpen);
    fp.appendFilters(nsIFilePicker.filterAll);
    let rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	let file = fp.file;
	let path = fp.file.path;
	let istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(file, 0x01, 0444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);
	let cis = GetUTF8ConverterInputStream(istream);
	// 行を配列に読み込む
	let line = {}, hasmore;
	let str = "";
	do {
	    hasmore = cis.readString(1024,line);
	    str += line.value;
	} while(hasmore);
	istream.close();

	try{
	    let obj = JSON.parse(str);
	    return obj;
	} catch (x) {
	    debugprint(x);
	    return null;
	}
    }
    return null;
}


/**
 * 指定タグを持つ親要素を探す.
 * @param elem 検索の起点となる要素
 * @param tag 親要素で探したいタグ名
 */
function FindParentElement(elem,tag){
    //debugprint("Element:"+elem+" Tag:"+tag);
    while(elem.parentNode &&
	  (!elem.tagName || (elem.tagName.toUpperCase()!=tag.toUpperCase()))){
	elem = elem.parentNode;
    }
    return elem;
}

// NicoLive Helperのウィンドウをリストアップする.
function WindowEnumerator(){
    let wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
    let enumerator = wm.getEnumerator("");
    let windowlist = new Array();
    while(enumerator.hasMoreElements()) {
	let win = enumerator.getNext();
	// win is [Object ChromeWindow] (just like window), do something with it
	//debugprint("window:"+win.name);
	if(win.name.match(/^NLHADV_lv\d+$/)){
	    windowlist.push(win);
	}
    }
    return windowlist;
}

/**
 * クリップボードにテキストをコピーする.
 * @param str コピーする文字列
 */
function CopyToClipboard(str){
    if(str.length<=0) return;
    let gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].  
	getService(Components.interfaces.nsIClipboardHelper);  
    gClipboardHelper.copyString(str);
}

function htmlspecialchars(ch){
    ch = ch.replace(/&/g,"&amp;");
    ch = ch.replace(/"/g,"&quot;");
    //ch = ch.replace(/'/g,"&#039;");
    ch = ch.replace(/</g,"&lt;");
    ch = ch.replace(/>/g,"&gt;");
    return ch ;
}

function restorehtmlspecialchars(ch){
    ch = ch.replace(/&quot;/g,"\"");
    ch = ch.replace(/&amp;/g,"&");
    ch = ch.replace(/&lt;/g,"<");
    ch = ch.replace(/&gt;/g,">");
    ch = ch.replace(/&nbsp;/g," ");
    ch = ch.replace(/&apos;/g,"'");
    return ch;
}

function syslog(txt){
    let tmp = GetDateString( GetCurrentTime()*1000 );
    txt = tmp + " " +txt;
    if( $('syslog-textbox') )
	$('syslog-textbox').value += txt + "\n";
}

function debugprint(txt){
    if( $('debug-textbox') )
	$('debug-textbox').value += txt + "\n";
    //Application.console.log(txt);
}

function debugconsole(txt){
    Application.console.log(txt);
}

function debugalert(txt){
    AlertPrompt(txt,'');
}


var noticeid;
function ShowNotice(txt, dontclear){
    debugprint(txt);
    $('noticewin').removeAllNotifications(false);
    $('noticewin').appendNotification(txt,null,null,
				      $('noticewin').PRIORITY_WARNING_LOW,null);
    clearInterval(noticeid);
    if( dontclear ) return;
    noticeid = setInterval( function(){
				$('noticewin').removeAllNotifications(false);
				clearInterval(noticeid);
			    }, 15*1000 );
}

function ShowPopupNotification(imageURL,title,text,request_id){
    // request_id: lvXXXXXX
    let listener = null;
    /*
    {
	observe: function(subject, topic, data) {
	    if(topic=='alertclickcallback'){
		let url = 'http://live.nicovideo.jp/watch/'+data;
		Application.console.log('open:'+url);
		gBrowser.addTab(url);
	    }
	}
    };
     */

    let clickable = false;
    let cookie = request_id;
    try {
	let alertserv = Components.classes['@mozilla.org/alerts-service;1'].getService(Components.interfaces.nsIAlertsService);
	//	    alertserv.showAlertNotification(imageURL, title, text, clickable, cookie, listener, 'NicoLiveAlertExtension');
	alertserv.showAlertNotification(imageURL, title, text, clickable, cookie, listener);
    } catch(e) {
	// prevents runtime error on platforms that don't implement nsIAlertsService
	let image = imageURL;
	let win = Components.classes['@mozilla.org/embedcomp/window-watcher;1'].getService(Components.interfaces.nsIWindowWatcher)
	    .openWindow(null, 'chrome://global/content/alerts/alert.xul','_blank', 'chrome,titlebar=no,popup=yes', null);
	win.arguments = [image, title, text, clickable, cookie, 0, listener];
    }
}

/**
 * ウィンドウを最前面に持ってくる.
 * @param w ウィンドウ
 * @param b 最前面に持ってくるかどうか
 */
function SetWindowTopMost(w,b){
    let Ci = Components.interfaces;
    let XULWindow = w
	.QueryInterface(Ci.nsIInterfaceRequestor)
	.getInterface(Ci.nsIWebNavigation)
	.QueryInterface(Ci.nsIDocShellTreeItem)
	.treeOwner
	.QueryInterface(Ci.nsIInterfaceRequestor)
	.getInterface(Ci.nsIXULWindow);
    XULWindow.zLevel = b ? Ci.nsIXULWindow.highestZ : Ci.nsIXULWindow.normalZ;
}

function GetUTF8ConverterInputStream(istream)
{
    let cis = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
    cis.init(istream,"UTF-8",0,Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
    return cis;
}

function GetUTF8ConverterOutputStream(os)
{
    let cos = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
    cos.init(os,"UTF-8",0,Components.interfaces.nsIConverterOutputStream.DEFAULT_REPLACEMENT_CHARACTER);
    return cos;
}


/**
 *  現在時刻を秒で返す(UNIX時間).
 */
function GetCurrentTime(){
    let d = new Date();
    return Math.floor(d.getTime()/1000);
}

function GetDateString(ms){
    let d = new Date(ms);
    return d.toLocaleFormat("%Y/%m/%d %H:%M:%S");
}

function GetFormattedDateString(format,ms){
    let d = new Date(ms);
    return d.toLocaleFormat(format);
}

// レート数値をスターの個数の文字列にする.
function GetFavRateString(rate){
    let tmp;
    let str = "";
    let i;
    tmp = rate / 10;
    for(i=0;i<tmp;i++){
	str += "★";
    }
    if(!str) str="なし";
    return str;
}


function GetSelectedTag(tags,selection,color){
    let r = new Array();
    let i,tag;
    for(i=0; tag=tags[i]; i++){
	for(let j=0,sel;sel=selection[j]; j++){
	    let reg = new RegExp(sel,"i");
	    if(tag.match(reg)){
		r.push(tag);
		break;
	    }
	}
    }
    // 正規表現でうまく色付きに置換できなかったので強引に.
    let s = "";
    let len = 0;
    for(i=0; tag=r[i]; i++){
	let l = tag.length;
	for(let j=0,sel;sel=selection[j]; j++){
	    let reg = new RegExp(sel,"i");
	    if( tag.match(reg) ){
		if(color[j]){
		    tag = "<font color=\""+color[j]+"\">"+tag+"</font>";
		}
		break;
	    }
	}
	s += tag;
	len += l;
	if(len>=35 && r[i+1]){
	    s += "<br>";
	    len = 0;
	}else if( r[i+1] ){
	    s+="　";
	    len++;
	}
    }
    return s;
}

function GetColoredTag(tags,selection,color){
    let s = "";
    let len = 0;
    for(let i=0,tag; tag=tags[i]; i++){
	let l = tag.length;
	for(let j=0,sel;sel=selection[j]; j++){
	    let reg = new RegExp(sel,"i");
	    if( tag.match(reg) ){
		if(color[j]){
		    tag = "<font color=\""+color[j]+"\">"+tag+"</font>";
		}
		break;
	    }
	}
	s += tag;
	len += l;
	if(len>=35 && tags[i+1]){
	    s += "<br>";
	    len = 0;
	}else if( tags[i+1] ){
	    s+="　";
	    len++;
	}
    }
    return s;
}

// string bundleから文字列を読みこむ.
function LoadString(name){
    return $('string-bundle').getString(name);
}
function LoadFormattedString(name,array){
    return $('string-bundle').getFormattedString(name,array);
}

// min:sec の文字列を返す.
function GetTimeString(sec){
    let str = "";
    if(sec<0) str = "-";
    sec = Math.abs(sec);
    str += parseInt(sec/60) + ":";
    str += (sec%60)<10?"0"+parseInt(sec%60):parseInt(sec%60);
    return str;
}

// min以上、max以下の範囲で乱数を返す.
function GetRandomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


// LCGの疑似乱数はランダム再生専用のため、他の用途では使用禁止.
var g_randomseed = GetCurrentTime();
function srand(seed)
{
    g_randomseed = seed;
}
function rand()
{
    g_randomseed = (g_randomseed * 214013 + 2531011) & 0x7fffffff;
    return g_randomseed;
}
// min以上、max以下の範囲で乱数を返す.
function GetRandomIntLCG(min,max)
{
    let tmp = rand() >> 4;
    return (tmp % (max-min+1)) + min;
}

function ZenToHan(str){
    return str.replace(/[ａ-ｚＡ-Ｚ０-９－（）＠]/g,
		       function(s){ return String.fromCharCode(s.charCodeAt(0)-65248); });
}

function HiraToKana(str){
    return str.replace(/[\u3041-\u3094]/g,
		      function(s){ return String.fromCharCode(s.charCodeAt(0)+0x60); });
}

/*
 *  convertKana JavaScript Library beta4
 *  
 *  MIT-style license. 
 *  
 *  2007 Kazuma Nishihata [to-R]
 *  http://www.webcreativepark.net
 * 
 * よりアルゴリズムを拝借.
 */
function HanToZenKana(str){
    let fullKana = new Array("ヴ","ガ","ギ","グ","ゲ","ゴ","ザ","ジ","ズ","ゼ","ゾ","ダ","ヂ","ヅ","デ","ド","バ","ビ","ブ","ベ","ボ","パ","ピ","プ","ペ","ポ","゛","。","「","」","、","・","ヲ","ァ","ィ","ゥ","ェ","ォ","ャ","ュ","ョ","ッ","ー","ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ","タ","チ","ツ","テ","ト","ナ","ニ","ヌ","ネ","ノ","ハ","ヒ","フ","ヘ","ホ","マ","ミ","ム","メ","モ","ヤ","ユ","ヨ","ラ","リ","ル","レ","ロ","ワ","ン","゜");
    let halfKana = new Array("ｳﾞ","ｶﾞ","ｷﾞ","ｸﾞ","ｹﾞ","ｺﾞ","ｻﾞ","ｼﾞ","ｽﾞ","ｾﾞ","ｿﾞ","ﾀﾞ","ﾁﾞ","ﾂﾞ","ﾃﾞ","ﾄﾞ","ﾊﾞ","ﾋﾞ","ﾌﾞ","ﾍﾞ","ﾎﾞ","ﾊﾟ","ﾋﾟ","ﾌﾟ","ﾍﾟ","ﾎﾟ","ﾞ","｡","｢","｣","､","･","ｦ","ｧ","ｨ","ｩ","ｪ","ｫ","ｬ","ｭ","ｮ","ｯ","ｰ","ｱ","ｲ","ｳ","ｴ","ｵ","ｶ","ｷ","ｸ","ｹ","ｺ","ｻ","ｼ","ｽ","ｾ","ｿ","ﾀ","ﾁ","ﾂ","ﾃ","ﾄ","ﾅ","ﾆ","ﾇ","ﾈ","ﾉ","ﾊ","ﾋ","ﾌ","ﾍ","ﾎ","ﾏ","ﾐ","ﾑ","ﾒ","ﾓ","ﾔ","ﾕ","ﾖ","ﾗ","ﾘ","ﾙ","ﾚ","ﾛ","ﾜ","ﾝ","ﾟ");
    for(let i = 0; i < 89; i++){
	let re = new RegExp(halfKana[i],"g");
	str=str.replace(re, fullKana[i]);
    }
    return str;
}

function FormatCommas(str){
    try{
	return str.toString().replace(/(\d)(?=(?:\d{3})+$)/g,"$1,");
    } catch (x) {
	return str;
    }
}

function clearTable(tbody)
{
   while(tbody.rows.length>0){
      tbody.deleteRow(0);
   }
}

function IsWINNT()
{
    let osString = Components.classes["@mozilla.org/xre/app-info;1"]
        .getService(Components.interfaces.nsIXULRuntime).OS;
    if(osString=="WINNT"){
	return true;
    }
    return false;
}

function IsDarwin()
{
    let osString = Components.classes["@mozilla.org/xre/app-info;1"]
        .getService(Components.interfaces.nsIXULRuntime).OS;
    if(osString=="Darwin"){
	return true;
    }
    return false;
}

function IsLinux()
{
    let osString = Components.classes["@mozilla.org/xre/app-info;1"]
        .getService(Components.interfaces.nsIXULRuntime).OS;
    if(osString=="Linux"){
	return true;
    }
    return false;
}
