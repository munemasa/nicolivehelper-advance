/*
Copyright (c) 2009 amano <amano@miku39.jp>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

Components.utils.import("resource://gre/modules/ctypes.jsm");

var NicoLiveTalker = {

    callBouyomichan: function( text, ipaddr ){
	/*
	 struct bouyomichan_header{
	 short command;
	 short speed;
	 short tone;
	 short volume;
	 short voice;
	 char character_code; // no padding
	 long length;
	 }
	 */
	try{
	    let server = ipaddr || "127.0.0.1";
	    let port = 50001;

	    let socketTransportService = Components.classes["@mozilla.org/network/socket-transport-service;1"].getService( Components.interfaces.nsISocketTransportService );
	    let socket = socketTransportService.createTransport( null, 0, server, port, null );
	    let ostream = socket.openOutputStream( 0, 0, 0 );
	    let binout = Components.classes["@mozilla.org/binaryoutputstream;1"].createInstance( Components.interfaces.nsIBinaryOutputStream );
	    binout.setOutputStream( ostream );

	    function write16le( val ){
		binout.write8( val & 0xff );
		binout.write8( (val >> 8) & 0xff );
	    };
	    function write32le( val ){
		binout.write8( val & 0xff );
		binout.write8( (val >> 8) & 0xff );
		binout.write8( (val >> 16) & 0xff );
		binout.write8( (val >> 24) & 0xff );
	    };

	    write16le( 1 ); // command
	    write16le( -1 ); // speed
	    write16le( -1 ); // tone
	    write16le( -1 ); // volume
	    write16le( 0 ); // voice
	    binout.write8( 1 ); // 0:UTF-8, 1:Unicode, 2:Shift-JIS

	    write32le( text.length * 2 );

	    for( let i = 0; i < text.length; i++ ){
		let ch = text.charCodeAt( i );
		binout.write8( ch & 0xff );
		binout.write8( (ch >> 8) & 0xff );
	    }

	    binout.flush();
	    ostream.flush();
	    ostream.close();
	    socket.close();
	}catch( e ){
	    console.log( e );
	}
    },

    runProcess:function(exe,text){
	try{
	    if( $('use-saykotoeri').selected || $('use-saykotoeri2').selected){
		// system()使うのでコマンドラインパラメータとして渡すのに危険なもの削除.
		text = text.replace(/[;\"'&]/g,"");
		this.talkqueue.push(text);
		//obj.sayKotoeri(text);
	    }
	    if( $('use-yukkuroid').selected ){
		text = text.replace(/[;\"'&]/g,"");
		this.talkqueue.push(text);
	    }
	} catch (x) {
	    debugprint(x);
	}

	return;
    },

    talk_bysaykotoeri:function(){
	try{
	    
	if( this.talkqueue.length==0 ){
	    $('talker-left').value = this.talkqueue.length + "行";
	    return;
	}
	let saykotoeri = 0;
	if( $('use-saykotoeri').selected ) saykotoeri = 1;
	if( $('use-saykotoeri2').selected ) saykotoeri = 2;
	if( $('use-yukkuroid').selected ) saykotoeri = 3;

	let text = this.talkqueue.shift();
	switch(saykotoeri){
	case 1:
	    if( !this.saykotoeri(text) ){
		this.talkqueue.unshift(text);
	    }
	    break;
	case 2:
	    let speed = "-s "+ $('nlhaddon-talk-speed').value;
	    let volume = "-b " + $('nlhaddon-talk-volume').value;
	    if( !this.saykotoeri2(speed+" "+volume,text) ){
		this.talkqueue.unshift(text);
	    }
	    break;

	case 3:
	    //debugprint( this.isYukkuroidSaying(0) );
	    if( !this.isYukkuroidSaying(0) ){
		let utf8 = ctypes.char.array()(text);
		this.yukkuroidSetText(utf8);
		this.yukkuroidPlay();
	    }else{
		this.talkqueue.unshift(text);
	    }
	    break;

	default:
	    break;
	}

	$('talker-left').value = this.talkqueue.length + "行";

	} catch (x) {
	}
    },

    test:function(){
	//this.runProcess("","人付");
	//this.runProcess("","工エエェェ(´д｀)ェェエエ工");
	this.runProcess("","コメント読み上げのテストです");
	this.runProcess("","sm683164");
    },

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
	    chat.text_notag.length >= $('nlhaddon-restrictlength').value ) return;
	let text;
	text = chat.text_notag.replace(/[wｗ]{2,}$/,"わらわら");
	text = text.replace(/[wｗ]$/,"わら");
	text = text.replace(/http:\/\/[\w.%\&=/-?]+/,"ゆーあーるえるしょうりゃく");

	let str;
	let replacefunc = function(s,p){
	    let tmp = s;
	    switch(p){
	    case 'comment':
		tmp = text;
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
	//this.runProcess('',chat.text);
	this.runProcess('',str);
    },

    init_jsctypes:function(){
	try{
	    var path = GetExtensionPath();
	    path.append("libs");
	    path.append("libxpcom_commenttalker-mac.dylib");
	    debugprint(path.path);
	    this.lib = ctypes.open(path.path);
	    this.bouyomichan = this.lib.declare("bouyomichan", ctypes.default_abi, ctypes.int32_t, ctypes.jschar.ptr, ctypes.jschar.ptr);
	    this.saykotoeri = this.lib.declare("saykotoeri", ctypes.default_abi, ctypes.int32_t, ctypes.jschar.ptr);
	    this.saykotoeri2 = this.lib.declare("saykotoeri2", ctypes.default_abi, ctypes.int32_t, ctypes.jschar.ptr, ctypes.jschar.ptr);

	    this.yukkuroidSetText = this.lib.declare("yukkuroidSetText", ctypes.default_abi, ctypes.int32_t, ctypes.char.ptr);
	    this.isYukkuroidSaying = this.lib.declare("isYukkuroidSaying", ctypes.default_abi, ctypes.int32_t, ctypes.int32_t);
	    this.yukkuroidPlay = this.lib.declare("yukkuroidPlay", ctypes.default_abi, ctypes.int32_t);

	} catch (x) {
	    debugprint(x);
	}
    },

    init:function(){
	debugprint('CommentTalker init.');

	this.init_jsctypes();

	this.talkqueue = new Array();
	setInterval(function(){
			NicoLiveTalker.talk_bysaykotoeri();
		    }, 1000 );

	let prefs = Config.getBranch();
	try{
	    $('enable-comment-talker').checked = prefs.getBoolPref("ext.comment-talker.enable");
	    $('use-what-talker-program').selectedIndex = prefs.getIntPref("ext.comment-talker.program");
	    $('nlhaddon-restrictlength').value = prefs.getIntPref("ext.comment-talker.length");
	    $('nlhaddon-format').value = prefs.getUnicharPref("ext.comment-talker.format");
	    $('nlhaddon-talk-speed').value = prefs.getIntPref("ext.comment-talker.speed");
	    $('nlhaddon-talk-volume').value = prefs.getIntPref("ext.comment-talker.volume");
	} catch (x) {
	    debugprint(x);
	}
    },

    destroy:function(){
	try{
	    this.lib.close();
	} catch (x) {
	    debugprint(x);
	}

	let prefs = Config.getBranch();
	prefs.setBoolPref("ext.comment-talker.enable", $('enable-comment-talker').checked);
	prefs.setIntPref("ext.comment-talker.program", $('use-what-talker-program').selectedIndex);
	prefs.setIntPref("ext.comment-talker.length", $('nlhaddon-restrictlength').value);
	prefs.setUnicharPref("ext.comment-talker.format",$('nlhaddon-format').value);
	prefs.setIntPref("ext.comment-talker.speed", $('nlhaddon-talk-speed').value);
	prefs.setIntPref("ext.comment-talker.volume", $('nlhaddon-talk-volume').value);
    }
};

window.addEventListener("load", function(e){ NicoLiveTalker.init(); }, false);
window.addEventListener("unload", function(e){ NicoLiveTalker.destroy(); }, false);
