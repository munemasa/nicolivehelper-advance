

var Config = {
    play_interval: 0,          // 動作再生の間隔
    videoinfo_interval: 0,     // 動画情報コメントの送信間隔

    max_playtime: 0,           // 最大再生時間(minute)

    msg: {},      // 各種応答メッセージ

    // コメント関連の設定
    comment184: 0,           // 184コメントするかどうか
    comment: {
	'view_lines': 500,   // コメント表示行数
	'backlogs': 100      // サーバー接続時のバックログ取得行数
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
     * 設定を全てロードする
     */
    loadPrefs: function(){
	debugprint("load preferences.");
	let branch = this.getBranch();
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

	this.play_interval  = branch.getIntPref("play.interval");
	this.max_playtime   = branch.getIntPref("play.maxtime");

	this.allow_seiga    = branch.getBoolPref("request.seiga");

	// 各種応答メッセージ
        this.loadReplyMessage(branch);

	this.setVideoDetail();
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
    },
    destroy: function(){
	this.unregister();
    }
};

window.addEventListener("load", function(e){ Config.init(); }, false);
window.addEventListener("unload", function(e){ Config.destroy(); }, false);
