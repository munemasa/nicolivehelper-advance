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
    /**
     * 読み上げプロセスを起ち上げる.
     * @param exe 実行ファイル名
     * @param text 読み上げるテキスト
     * @param type 読み上げ方法(指定無効)
     */
    runProcess: function( exe, text, type ){
	if( $( 'use-webspeech-api' ).checked ){
	    this.webspeech( text );
	    return;
	}
	if( $( 'nlhaddon-use-external' ).checked ){
	    this.runExternalProcess( exe, text, type );
	    return;
	}
	this.callBouyomichan( text );
    },

    webspeech: function( text ){
	let n = $( 'webspeech-select-voice' ).value;

	var synthes = new SpeechSynthesisUtterance( text );
	synthes.voice = this._webvoices[n];
	synthes.rate = this._speed;
	synthes.volume = this._volume;
	speechSynthesis.speak( synthes );
    },

    /**
     * 読み上げ用外部プロセスを実行する.
     * 民安Talkを想定。
     * @param exe 実行ファイル名
     * @param text テキスト
     * @param type 読み上げ方法(指定無効)
     */
    runExternalProcess:function(exe,text, type){
	var file = Components.classes["@mozilla.org/file/local;1"]
                     .createInstance(Components.interfaces.nsIFile);
	var path = $('nlhaddon-external-program').value;
	file.initWithPath(path);
	var process = Components.classes["@mozilla.org/process/util;1"]
            .createInstance(Components.interfaces.nsIProcess);
	process.init(file);

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
	var unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
            .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
	unicodeConverter.charset = "Shift_JIS";
	text = unicodeConverter.ConvertFromUnicode( text ) + unicodeConverter.Finish();
	var args = [text];
	process.run(false, args, args.length);
    },

    /**
     * 外部プログラムの設定ダイアログを表示.
     */
    selectExternalProgram:function(){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "外部プログラムを指定してください", nsIFilePicker.modeOpen);
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	    var file = fp.file;
	    var path = fp.file.path;
	    $('nlhaddon-external-program').value = path;
	}
    },

    test:function(){
	this.runProcess("", $('nlhaddon-testbox').value);
    },

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
	}catch( e ){
	    console.log( e );
	}
    },

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

    changeVolume: function( v ){
	this._volume = v;
	console.log( 'volume:' + v );
	$('webspeech-volume-text' ).value = v;
    },

    changeSpeed: function( v ){
	this._speed = v;
	console.log( 'speed:', +v );
	$('webspeech-speed-text' ).value = v;
    },

    resetWebSpeechParameters: function(){
	$('webspeech-volume' ).value = 1.0;
	$('webspeech-speed' ).value = 1.0;
    },

    initWebSpeech: function(){
	let n = $( 'webspeech-select-voice' ).value;
	try{
	    let menu = $('webspeech-select-menupopup');
	    this._webvoices = speechSynthesis.getVoices();
	    for( let i = 0; i < this._webvoices.length; i++ ){
		let item = CreateMenuItem( this._webvoices[i].name, i );
		menu.appendChild(item);
	    }
	    $( 'webspeech-select-voice' ).value = n;
	}catch(e){
	}
    },

    init:function(){
	debugprint('CommentTalker init.');
	this.initWebSpeech();

	let prefs = Config.getBranch();
	try{ $('enable-comment-talker').checked = prefs.getBoolPref("ext.comment-talker.enable"); }catch(x){}
	try{ $('nlhaddon-restrictlength').value = prefs.getIntPref("ext.comment-talker.length"); }catch (x){}
	try{ $('nlhaddon-format').value = prefs.getUnicharPref("ext.comment-talker.format"); }catch (x){}
	try{ $('nlhaddon-external-program').value = prefs.getUnicharPref("ext.comment-talker.ext-program"); }catch (x){}
    },
    destroy:function(){
	let prefs = Config.getBranch();
	prefs.setBoolPref("ext.comment-talker.enable", $('enable-comment-talker').checked);
	prefs.setIntPref("ext.comment-talker.length", $('nlhaddon-restrictlength').value);
	prefs.setUnicharPref("ext.comment-talker.format",$('nlhaddon-format').value);
	prefs.setUnicharPref("ext.comment-talker.ext-program",$('nlhaddon-external-program').value);
    }
};

window.addEventListener("load", function(e){ NicoLiveTalker.init(); }, false);
window.addEventListener("unload", function(e){ NicoLiveTalker.destroy(); }, false);
