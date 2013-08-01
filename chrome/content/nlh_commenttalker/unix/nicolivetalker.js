Components.utils.import("resource://gre/modules/NetUtil.jsm");
Components.utils.import("resource://gre/modules/FileUtils.jsm");

var NicoLiveTalker = {
  talking: false,

  /**
   * 読み上げを行う.
   * @param chat コメント
   */
  talkComment:function(chat){
    if( !$('enable-comment-talker').checked ) return; // 読み上げしない.
    if(chat.date<NicoLiveHelper.connecttime){ return; } // 過去ログ無視.

    if(chat.premium==3){
      if( !$('nlhaddon-read-castercomment').checked ) return; // 運営コメ読まない.
      if(chat.text.indexOf('/')==0) return; // 運営コマンドは読まない.
    }
    // 改行文字を含むコメントを読まない.
    //if( $('nlhaddon-dontread-crlfincluded').checked && chat.text.match(/(\r|\n)/)) return;
    // / で始まるコメを読まない.
    if( $('nlhaddon-dontread-leadingslash').checked && chat.text.indexOf('/')==0 ) return;
    // n 文字以上のコメは読まない.
    if( $('nlhaddon-restrictlength').value>0 &&
	chat.text.length >= $('nlhaddon-restrictlength').value ) return;
    
    let str;
    let replacefunc = function(s,p){
      let tmp = s;
      switch(p){
      case 'comment':
	tmp = chat.text_notag;
	tmp = tmp.replace(/[8８]{2,}$/,"ぱちぱち");
	tmp = tmp.replace(/[wｗ]{2,}$/,"わらわら");
	tmp = tmp.replace(/[wｗ]$/,"わら");
	tmp = tmp.replace(/http:\/\/[\w.%\&=/-?]+/,"ゆーあーるえるしょうりゃく");
	break;
      case 'name':
	try{
	  tmp = NicoLiveComment.namemap[chat.user_id].name;
	} catch (x) {
	  tmp = null;
	}
	if( !tmp ) tmp = "";
	break;
      }
      return tmp;
    };
    str = $('nlhaddon-format').value.replace(/{(.*?)}/g,replacefunc);
    this.runProcess(str);
  },

  /**
   * 読み上げプロセスを起ち上げる.
   * @param text 読み上げるテキスト
   */
  runProcess:function(text){
    text = text.replace(/[ω]/g,"");
    text = text.replace(/うp/g,"うぷ");
    text = text.replace(/[!！]+/g,'！');
    text = text.replace(/[?？]+/g,'？');
    text = text.replace(/。+/g,'。　');
    text = text.replace(/！？/g,'？');
    text = text.replace(/／/g,'');
    text = text.replace(/([！？])/g,'$1　');
    text = text.replace(/\s*$/,'');
    if( text.match(/^[！？]$/,'') ){
      return;
    }
    this.runExternalProcess(text);
    return;
  },

  /**
   * 読み上げ用外部プロセスを起ち上げる.
   * @param text 読み上げるテキスト
   */
  runExternalProcess:function(text) {
    if (this.talking) {
      // 喋り中だったら少し後に回す
      setTimeout(function(){
                   NicoLiveTalker.runExternalProcess(text);
                 }, 100);
    }
    else {
      NicoLiveTalker.talking = true;
      this.writeTextToTmp(text, 
                          function(textpath) {
                            var wavpath = NicoLiveTalker.createTalkingWav(textpath);
                            NicoLiveTalker.playWav(wavpath);
                          });
    }
  },

  writeTextToTmp:function(text, onSuccess) {
    var path = "/tmp/nlhcommenttalker_comment.txt";
    var file = Components.classes["@mozilla.org/file/local;1"]
      .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(path);

    var ostream = FileUtils.openSafeFileOutputStream(file);

    var converter =
      Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
      createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
    converter.charset = "UTF-8";
    var istream = converter.convertToInputStream(text);

    // open_jtalkに食わせるため一旦tmpファイルにコメント内容を書き込む。
    NetUtil.asyncCopy(istream, ostream,
      function(status) {
        if (Components.isSuccessCode(status)) {
          // 成功したら再生
          onSuccess(path);
          return;
        }
    });
  },
  
  createTalkingWav:function(textpath) {
    var wavpath = "/tmp/nlhcommenttalker_comment.wav";
    var file = Components.classes["@mozilla.org/file/local;1"]
      .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(this.openJtalkPath());

    var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
    process.init(file);

    var args = [
      "-td", this.voiceDir() + "tree-dur.inf",
      "-tf", this.voiceDir() + "tree-lf0.inf",
      "-tm", this.voiceDir() + "tree-mgc.inf",
      "-mm", this.voiceDir() + "mgc.pdf",
      "-md", this.voiceDir() + "dur.pdf",
      "-mf", this.voiceDir() + "lf0.pdf",
      "-dm", this.voiceDir() + "mgc.win1",
      "-dm", this.voiceDir() + "mgc.win2",
      "-dm", this.voiceDir() + "mgc.win3",
      "-df", this.voiceDir() + "lf0.win1",
      "-df", this.voiceDir() + "lf0.win2",
      "-df", this.voiceDir() + "lf0.win3",
      "-dl", this.voiceDir() + "lpf.win1",
      "-ef", this.voiceDir() + "tree-gv-lf0.inf",
      "-em", this.voiceDir() + "tree-gv-mgc.inf",
      "-cf", this.voiceDir() + "gv-lf0.pdf",
      "-cm", this.voiceDir() + "gv-mgc.pdf",
      "-k" , this.voiceDir() + "gv-switch.inf",
      "-s", "16000",
      "-a", "0.00",
      "-u", "0.0",
      "-jm", "1.0",
      "-jf", "1.0",
      "-jl", "1.0",
      "-x", "/var/lib/mecab/dic/open-jtalk/naist-jdic",
      "-ow", wavpath,
      textpath
    ];
    process.run(true, args, args.length);
    return wavpath;
  },

  playWav:function(wavpath) {
    var file = Components.classes["@mozilla.org/file/local;1"]
      .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath("/usr/bin/aplay");
    var process = Components.classes["@mozilla.org/process/util;1"].
      createInstance(Components.interfaces.nsIProcess);
    process.init(file);
    var args = ["--quiet", wavpath];
    process.run(false, args, args.length);

    // 上記プロセスの停止を見張る
    var timerId = setInterval(function(){
                       if (!process.isRunning) {
                         clearInterval(timerId);
                         NicoLiveTalker.talking = false;
                       }
                }, 10);
  },
  
  
  init:function(){
    debugprint('CommentTalker init.');

    let prefs = Config.getBranch();
    try{
      try{ $('enable-comment-talker').checked = prefs.getBoolPref("ext.comment-talker.enable"); }catch(x){}
      try{ $('nlhaddon-restrictlength').value = prefs.getIntPref("ext.comment-talker.length"); }catch(x){}
      try{ $('nlhaddon-format').value = prefs.getUnicharPref("ext.comment-talker.format"); }catch(x){}
      try{ $('nlhaddon-openjtalk-path').value = prefs.getUnicharPref("ext.comment-talker.openjtalk-path"); }catch(x){}
      try{ $('nlhaddon-voice-dir').value = prefs.getUnicharPref("ext.comment-talker.voice-dir"); }catch(x){}
    } catch (x) {
    }
  },

  destroy:function(){
    let prefs = Config.getBranch();
    prefs.setBoolPref("ext.comment-talker.enable", $('enable-comment-talker').checked);
    prefs.setIntPref("ext.comment-talker.length", $('nlhaddon-restrictlength').value);
    prefs.setUnicharPref("ext.comment-talker.format",$('nlhaddon-format').value);
    prefs.setUnicharPref("ext.comment-talker.ext-program",$('nlhaddon-external-program').value);
    prefs.setUnicharPref("ext.comment-talker.openjtalk-path",this.openJtalkPath);
    prefs.setUnicharPref("ext.comment-talker.voice-dir",this.voiceDir);
  },

  openJtalkPath:function() {
    return $('nlhaddon-openjtalk-path').value;
  },

  voiceDir:function() {
    return $('nlhaddon-voice-dir').value;
  },

  test:function() {
    this.runProcess($('nlhaddon-testbox').value);
  }
};

window.addEventListener("load", function(e){ NicoLiveTalker.init(); }, false);
window.addEventListener("unload", function(e){ NicoLiveTalker.destroy(); }, false);
