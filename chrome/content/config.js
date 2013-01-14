

var Config = {

    play_interval: 8,
    videoinfo_interval: 8,

    max_playtime: 0,           // 最大再生時間(minute)

    getBranch:function(){
	var prefs = new PrefsWrapper1("extensions.nicolivehelperadvance.");
	return prefs;
    },
    getSpecificBranch:function(branch){
	// "greasemonkey.scriptvals.http://miku39.jp/nicolivehelper/WakutoriF modified-1."
	var prefs = new PrefsWrapper1(branch);
	return prefs;
    },

    loadPrefs: function(){
	let branch = this.getBranch();
	// 動画情報.
	this.videoinfo = new Array();
	for(let i=0;i<4;i++){
	    this.videoinfo[i] = new Object();
	    this.videoinfo[i].comment = branch.getUnicharPref("videoinfo"+(i+1));
	    this.videoinfo[i].command = branch.getUnicharPref("videoinfo"+(i+1)+"-command");
	}
    },

    init: function(){
	this.loadPrefs();
    },
    destroy: function(){
    }
};

window.addEventListener("load", function(e){ Config.init(); }, false);
window.addEventListener("unload", function(e){ Config.destroy(); }, false);
