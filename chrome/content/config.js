

var Config = {
    play_interval: 0,          // 動作再生の間隔
    videoinfo_interval: 0,     // 動画情報コメントの送信間隔

    japanese_standard_time: false,
    timezone_offset: 0,

    request:{}, // リクエスト設定
    play:{},    // 再生設定

    max_playtime: 0,           // 最大再生時間(minute)

    msg: {},      // 各種応答メッセージ

    // コメント関連の設定
    comment184: 0,           // 184コメントするかどうか
    comment: {
	'savefile': false,   // コメントのファイル保存
	'view_lines': 500,   // コメント表示行数
	'backlogs': 100      // サーバー接続時のバックログ取得行数
    },
    twitter: {},

    /**
     * NG動画かどうか判定する.
     * @param video_id 動画ID
     */
    isNGVideo:function(video_id){
	return this.request.ngvideos["_"+video_id];
    },

    isAutoWindowClose:function(){
	let iscaster = IsCaster();
	let prefs = this.getBranch();
	if( (iscaster && prefs.getBoolPref("window.auto-close")) ||
	    (!iscaster && prefs.getBoolPref("window.auto-close-listener")) ){
	    return true;
	}
	return false;
    },

    isSingleWindow: function(){
	let prefs = this.getBranch();
	return prefs.getBoolPref("window.singlewindow");
    },

    isAutoTabClose:function(){
	let prefs = this.getBranch();
	return prefs.getBoolPref("window.auto-close-tab");
    },

    getBranch:function(){
	var prefs = new PrefsWrapper1("extensions.nicolivehelperadvance.");
	return prefs;
    },
    getSpecificBranch:function(branch){
	// "greasemonkey.scriptvals.http://miku39.jp/nicolivehelper/WakutoriF modified-1."
	var prefs = new PrefsWrapper1(branch);
	return prefs;
    },

    getBool:function(path){
	var branch = this.getBranch();
	var b;
	try{
	    b = branch.getBoolPref(path);	    
	} catch (x) {
	    b = false;
	}
	return b;
    },
    getUnichar:function(path){
	var branch = this.getBranch();
	var b;
	try{
	    b = branch.getUnicharPref(path);	    
	} catch (x) {
	    b = "";
	}
	return b;
    },

    /**
     * 応答メッセージのロード.
     * @param branch 設定のブランチ
     */
    loadReplyMessage:function (branch) {
        this.msg = new Object();
        this.msg.deleted = branch.getUnicharPref("msg.deleted");
        this.msg.notaccept = branch.getUnicharPref("msg.notaccept");
        this.msg.newmovie = branch.getUnicharPref("msg.newmovie");
        this.msg.played = branch.getUnicharPref("msg.played");
        this.msg.requested = branch.getUnicharPref("msg.requested");
        this.msg.accept = branch.getUnicharPref("msg.accept");
        this.msg.no_live_play = branch.getUnicharPref("msg.no-live-play");
        this.msg.requestok = branch.getUnicharPref("msg.requestok");
        this.msg.requestng = branch.getUnicharPref("msg.requestng");
        this.msg.requestok_command = branch.getUnicharPref("msg.requestok-command");
        this.msg.requestng_command = branch.getUnicharPref("msg.requestng-command");
        this.msg.lessmylists = branch.getUnicharPref("msg.lessmylists");
        this.msg.greatermylists = branch.getUnicharPref("msg.greatermylists");
        this.msg.lessviews = branch.getUnicharPref("msg.lessviews");
        this.msg.greaterviews = branch.getUnicharPref("msg.greaterviews");
        this.msg.longertime = branch.getUnicharPref("msg.longertime");
        this.msg.shortertime = branch.getUnicharPref("msg.shortertime");
        this.msg.outofdaterange = branch.getUnicharPref("msg.outofdaterange");
        this.msg.requiredkeyword = branch.getUnicharPref("msg.requiredkeyword");
        this.msg.forbiddenkeyword = branch.getUnicharPref("msg.forbiddenkeyword");
        this.msg.limitnumberofrequests = branch.getUnicharPref("msg.limitnumberofrequests");
        this.msg.within_livespace = branch.getUnicharPref("msg.within-livespace");
        this.msg.requiredkeyword_title = branch.getUnicharPref("msg.requiredkeyword-title");
        this.msg.forbiddenkeyword_title = branch.getUnicharPref("msg.forbiddenkeyword-title");
        this.msg.highbitrate = branch.getUnicharPref("msg.high-bitrate");
        this.msg.ngvideo = branch.getUnicharPref("msg.ng-video-reply-message");
    },

    /**
     * リクエスト制限設定を読み込む.
     */
    loadRestrictionSetting:function(branch){
	// リクエスト制限設定.
	let restrict = {};
	restrict.numberofrequests = this.request.accept_nreq;
	restrict.dorestrict = branch.getBoolPref("request.restrict.enabled"); // リクエスト制限を行う
	restrict.date_from  = branch.getCharPref("request.restrict.date-from");
	restrict.date_to    = branch.getCharPref("request.restrict.date-to");
	restrict.mylist_from= branch.getIntPref("request.restrict.mylist-from");
	restrict.mylist_to  = branch.getIntPref("request.restrict.mylist-to");
	let exclude = branch.getUnicharPref("request.restrict.tag-exclude");
	restrict.tag_exclude = new Array();
	if(exclude.length>0){
	    restrict.tag_exclude = exclude.split(/\s+/);
	}
	let include = branch.getUnicharPref("request.restrict.tag-include");
	restrict.tag_include = new Array();
	if(include.length>0){
	    restrict.tag_include = include.split(/\s+/);
	}
	restrict.videolength_from = branch.getIntPref("request.restrict.videolength-from"); // Advance+
	restrict.videolength_to   = branch.getIntPref("request.restrict.videolength-to");
	restrict.view_from   = branch.getIntPref("request.restrict.view-from");
	restrict.view_to     = branch.getIntPref("request.restrict.view-to");
	// 1.1.22+
	exclude = branch.getUnicharPref("request.restrict.title-exclude");
	restrict.title_exclude = new Array();
	if(exclude.length>0){
	    restrict.title_exclude = exclude.split(/\s+/);
	}
	include = branch.getUnicharPref("request.restrict.title-include");
	restrict.title_include = new Array();
	if(include.length>0){
	    restrict.title_include = include.split(/\s+/);
	}
	// 1.1.35+
	restrict.bitrate = branch.getIntPref("request.restrict.bitrate");
	this.request.restrict = restrict;
    },

    /**
     * 動画説明の表示を設定する.
     */
    setVideoDetail: function(){
	let branch = this.getBranch();
	let isshow = branch.getBoolPref("display.show_detail");

	let n = document.styleSheets[1].cssRules.length;
	let i;
	for(i=0;i<n;i++){
	    let css = document.styleSheets[1].cssRules[i];
	    if(css.selectorText==".detail"){
		if( isshow ){
		    css.style.display="block";
		}else{
		    css.style.display="none";
		}
	    }
	}
    },

    /**
     * 壁紙設定をする.
     */
    setWallPaper: function(){
	let branch = this.getBranch();
	let wallpaper = branch.getUnicharPref("display.wallpaper");
	if( wallpaper ){
	    let sheet = document.styleSheets[1];
	    wallpaper = wallpaper.replace(/\\/g,'/');
	    let rule = "vbox { background-image: url('file://"+wallpaper+"'); }";
	    sheet.insertRule(rule,1);
	}
    },

    /**
     * コメント関係の設定を読む
     */
    loadCommentSettings:function (branch) {
	this.comment.savefile = branch.getBoolPref("comment.savefile");
        this.comment184 = branch.getBoolPref("comment.184comment");
        this.comment.backlogs = branch.getIntPref("comment.backlog");
	this.comment.view_lines = branch.getIntPref("comment.viewlines");

	// オートコンプリートはNicoLiveCommentの初期化で読んでる
	//this.comment.preset_autocomplete = branch.getUnicharPref("comment.preset-autocomplete");
    },

    /**
     * Twitter設定を読む.
     */
    loadTwitterSettings:function (branch) {
        this.twitter.api = branch.getCharPref('twitter.use-api');
        this.twitter.when_beginlive = branch.getBoolPref('twitter.when-beginlive');
        this.twitter.when_playmovie = branch.getBoolPref('twitter.when-playmovie');
        this.twitter.when_addmylist = branch.getBoolPref('twitter.when-addmylist');
        this.twitter.beginlive = branch.getUnicharPref('twitter.begin');
        this.twitter.play = branch.getUnicharPref('twitter.play');
    },

    /**
     * 表示設定を読み込む.
     */
    loadDisplaySettings: function(branch){
	try{
	    this.font = branch.getUnicharPref("display.font");
	    $('mainwindow').style.fontFamily = this.font;
	} catch (x) {
	}
	try{
	    let col = branch.getUnicharPref("display.font-color");
	    $('tabpanels').style.color = col;
	} catch (x) {
	}
	let fontscale = branch.getIntPref("display.font-scale");
	$('mainwindow-tab').style.fontSize = fontscale + "pt";
    },

    /**
     * NG動画設定を読み込む.
     */
    loadNGVideosSetting:function(branch){
	let str = branch.getUnicharPref("request.restrict.ng-video");
	let videos = str.match(/(sm|nm)\d+/g);
	this.request.ngvideos = new Object();
	try{
	    for(let i=0,v; v=videos[i]; i++){
		this.request.ngvideos["_"+v] = true;
	    }
	} catch (x) {
	    debugprint("No NG-video settings");
	}
    },

    /**
     * 再生時設定をロードする.
     */
    loadPlaySettings:function (branch) {
        this.play_interval = branch.getIntPref("play.interval");
        this.max_playtime = branch.getIntPref("play.maxtime");

	this.play.do_prepare = branch.getBoolPref("play.prepare");
	this.play.prepare_timing = branch.getIntPref("play.prepare-timing");

	// 枠に収まるように選曲
	this.play.in_time = branch.getBoolPref("play.in-time");

	// ジングル動画設定
	this.play_jingle = branch.getBoolPref("play.jingle");
	this.jinglemovie = branch.getCharPref("play.jingle-movie");
    },

    /**
     * 分類器のデフォルトをセットする.
     */
    setDefaultClass:function(){
	this.classes = new Array();
	this.classes.push({"name":"初音ミク","label":"Miku","color":"#7fffbf"});
	this.classes.push({"name":"鏡音リン・レン","label":"RinLen","color":"#ffff00"});
	this.classes.push({"name":"巡音ルカ","label":"Luka","color":"#ffb2d3"});
	this.classes.push({"name":"その他","label":"Other","color":"#ffeeee"});
	this.classes.push({"name":"NG","label":"NG","color":"#888888"});
    },

    // 動画分類設定を読みこむ.
    loadClasses:function(){
	let branch = this.getBranch();
	this.do_classify = branch.getBoolPref("ml.do-classify");
	try{
	    this.classes = eval(branch.getUnicharPref("ml.classes-value"));
	} catch (x) {
	    this.classes = new Array();
	}
	if( !this.classes || this.classes.length<=0 ) this.setDefaultClass();
	for(let i=0;i<this.classes.length;i++){
	    this.classes["_"+this.classes[i].label] = this.classes[i].color;
	}

	// 学習メニューを作成
	let menus = evaluateXPath(document,"//*[@class='training-menu']");
	for(let i=0,menu; menu=menus[i];i++){
	    while(menu.firstChild) RemoveElement(menu.firstChild);
	    for(let j=0,cls; cls=this.classes[j]; j++){
		menu.appendChild( CreateMenuItem(cls['name'],cls['label']) );
	    }
	}
    },

    /**
     * リスナーコマンド設定を読み込む.
     */
    loadListenerCommandSettings:function (branch) {
        this.listenercommand = new Object();
        try {
            this.listenercommand.enable = branch.getBoolPref("listenercommand.enable");
            this.listenercommand.s = branch.getUnicharPref("listenercommand.s");
            this.listenercommand.del = branch.getUnicharPref("listenercommand.del");
        } catch (x) {
            this.listenercommand.enable = false;
            this.listenercommand.s = "";
            this.listenercommand.del = "";
        }
    },

    /**
     * 設定を全てロードする
     */
    loadPrefs: function(){
	debugprint("load preferences.");
	let branch = this.getBranch();
	// リクエスト可否
	this.allowrequest = branch.getBoolPref( "request.allow" );
	// 自動応答
	this.request.autoreply = branch.getBoolPref( "request.autoreply" );
	// 重複許可
	this.request.allow_duplicative = branch.getBoolPref( "request.allow-duplicative" );
	// 新着規制
	this.request.disable_newmovie = branch.getBoolPref( "request.limit-newmovie" );
	// 再生済みのリク許可
	this.request.accept_played = branch.getBoolPref( "request.accept-playedvideo" );
	// 何分前の再生済みを許可するか
	this.request.allow_n_min_ago = branch.getIntPref( "request.allow-req-n-min-ago" );
	// 何件までリクOKか
	this.request.accept_nreq = branch.getIntPref( "request.accept-nreq" );
	// 枠内までリクOK
	this.request.within_livepsave = branch.getBoolPref( "request.accept-within-livespace" );
	// 静画リクエストOKか
	this.allow_seiga    = branch.getBoolPref("request.seiga");
	// 自動でP名を抽出しない
	this.no_auto_pname  = branch.getBoolPref("no-auto-pname");
	// 動画投稿者のユーザー名取得
	this.getusername  = branch.getBoolPref("getusername");
	// カスタムスクリプト
	this.do_customscript = branch.getBoolPref("custom-script");
	this.customscript = Storage.readObject('nico_live_customscript',{});

	this.japanese_standard_time = branch.getBoolPref("japanese-standard-time");
	this.timezone_offset = (new Date()).getTimezoneOffset();

	// NG動画
	this.loadNGVideosSetting(branch);

	// リクエスト制限
	try{
	    this.loadRestrictionSetting(branch);
	} catch (x) {
	    debugprint(x);
	}
        this.loadCommentSettings(branch);
	this.loadDisplaySettings(branch);

        // 動画情報.
	this.videoinfo_interval    = branch.getIntPref("videoinfo.interval");
	this.videoinfo_type        = branch.getIntPref("videoinfo.comment-type");
	this.videoinfo_revert_line = branch.getIntPref("videoinfo.revert-line");
	this.videoinfo_playfailed  = branch.getUnicharPref("videoinfo.playfailed");

	this.videoinfo = new Array();
	for(let i=0;i<4;i++){
	    this.videoinfo[i] = new Object();
	    this.videoinfo[i].comment = branch.getUnicharPref("videoinfo"+(i+1));
	    this.videoinfo[i].command = branch.getUnicharPref("videoinfo"+(i+1)+"-command");
	}

	// 放送終了通知の設定.
	this.notice = {};
	this.notice.area      = branch.getBoolPref("notice.area");
	this.notice.dialog    = branch.getBoolPref("notice.dialog");
	this.notice.comment   = branch.getBoolPref("notice.comment");
	this.notice.popup     = branch.getBoolPref("notice.popup");
	this.notice.sound     = branch.getBoolPref("notice.sound");
	this.notice.infobar   = branch.getBoolPref("notice.infobar");
	this.notice.soundfile = branch.getUnicharPref("notice.soundfile");
	this.notice.time      = branch.getIntPref("notice.time");

	// 再生時設定
        this.loadPlaySettings(branch);
        // 各種応答メッセージ
        this.loadReplyMessage(branch);

	// Twitter設定
        this.loadTwitterSettings(branch);

        this.setVideoDetail();
	this.setWallPaper();

	this.loadClasses();
        this.loadListenerCommandSettings(branch);
    },

    /**
     * コメントログの保存先を返す
     */
    getCommentDir:function(){
	try{
	    return this.getBranch().getFilePref('comment.commentlogDir');
	} catch (x) {
	    return null;
	}
    },
    /**
     * 連続コメントディレクトリを返す
     */
    getContinuousCommentDir:function(){
	try{
	    return this.getBranch().getFilePref('comment.continuous-commentDir');
	} catch (x) {
	    return null;
	}
    },

    /**
     * ユーザー定義値の場所を取得.
     */
    getUserDefinedValueURI:function(){
	let branch = this.getBranch();
	let uri;
	try{
	    uri = branch.getCharPref("videoinfo.userdefined-data-uri");
	} catch (x) {
	    uri = "";
	}
	return uri;
    },

    register:function(){
	let prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
	this._branch = prefService.getBranch("extensions.nicolivehelperadvance.");
	this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
	this._branch.addObserver("", this, false);
    },
    unregister:function(){
	if(!this._branch) return;
	this._branch.removeObserver("", this);
    },

    observe:function(aSubject, aTopic, aData){
	if(aTopic != "nsPref:changed") return;
	this.loadPrefs();
    },

    init: function(){
	this.loadPrefs();
	this.register();

	let b = this.getBranch().getBoolPref( "request.allow" );
	NicoLiveHelper.setAllowRequest( b, null, true ); // nomsg=true

	let style = this.getBranch().getIntPref( "play.style" );
	NicoLiveHelper.setPlayStyle( style );
    },
    destroy: function(){
	this.getBranch().setBoolPref( "request.allow", NicoLiveHelper.allowrequest );
	this.getBranch().setIntPref( "play.style", NicoLiveHelper._playstyle );

	this.unregister();
    }
};

window.addEventListener("load", function(e){ Config.init(); }, false);
window.addEventListener("unload", function(e){ Config.destroy(); }, false);
