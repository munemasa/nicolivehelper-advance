/*
 * コマンドメニューとそこで必要とするもの
 */


var CommandMenu = {

    /**
     * 現在、自身が放送中の番組に接続する.
     */
    openCurrentBroadcasting:function(){
	let url = "http://live.nicovideo.jp/my";
	let req = CreateXHR("GET",url);
	if(!req) return;

	// コントロールパネルの「放送中の番組に接続」の扱い
	$('btn-connect-to-current-broadcast').disabled = true;
	req.onreadystatechange = function(){
	    if( req.readyState==4 ){
		$('btn-connect-to-current-broadcast').disabled = false;
		if( req.status==200 ){
		    let str = req.responseText;
		    try{
			let lvid = str.match(/href=\"http.*\/watch\/(lv\d+)\"\s*class=\"now\"/)[1];
			debugprint( lvid );
			if(lvid){
			    $('debug-textbox').value = '';
			    NicoLiveHelper.openNewBroadcast(lvid,"",true,"");
			}
		    } catch (x) {
			AlertPrompt("放送中の番組が見つかりませんでした。",'NicoLive Helper Advance');
		    }
		}
	    }
	};
	req.send('');
	return;
    },

    /**
     * Nsenの放送IDを取得する.
     * @param ch Nsenのチャンネル名
     */
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
		    $('debug-textbox').value = '';
		    NicoLiveHelper.openNewBroadcast(request_id,"",false,"");
		} catch (x) {
		    debugprint(x);
		}
	    }
	};
	req.send("");
    },

    /**
     * Safariブラウザで表示しているページのURLを取得.
     * @return URLを返す
     */
    readSafariUrl:function(){
	try{
	    let path = GetExtensionPath();
	    path.append("libs");
	    path.append("safariurl.as");
	    debugprint(path.path);

	    var file = Components.classes["@mozilla.org/file/local;1"]
		.createInstance(Components.interfaces.nsILocalFile);
	    file.initWithPath("/bin/sh");
	    var process = Components.classes["@mozilla.org/process/util;1"]
		.createInstance(Components.interfaces.nsIProcess);
	    process.init(file);
	    debugprint(file.path);

	    let path2 = GetExtensionPath();
	    path2.append("libs");
	    path2.append("safariurl.tmp");
	    debugprint(path2.path);
	    var arg = "osascript \"" + path.path + "\" > \"" + path2.path+"\"";
	    debugprint(arg);
	    var args = [ "-c", arg ];
	    process.run(true, args, args.length);

	    var output = OpenFile( path2.path );
	    var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	    istream.init(output, 0x01, 0444, 0);
	    istream.QueryInterface(Components.interfaces.nsILineInputStream);
    
	    var cis = GetUTF8ConverterInputStream(istream);
    	    // 行を配列に読み込む
	    var line = {}, hasmore;
	    var str = "";
	    do {
		hasmore = cis.readString(1024,line);
		str += line.value;
	    } while(hasmore);
	    istream.close();
	    
	    debugprint(str);
	    return str;
	} catch (x) {
	    debugprint(x);
	}
	return "";
    },

    openBroadcasting: function(){
	var str = "";
	if( $('use-mac-safari').hasAttribute('checked') ){
	    str = this.readSafariUrl();
	}

	let lvid = InputPrompt("接続する番組の放送ID、コミュニティ・チャンネルID、URLを入力してください。\n何も入力せずにOKすると、現在放送中の番組に接続します。","放送IDを入力",str);
	let request_id;
	if( lvid==null ) return;
	if( lvid=="" ){
	    this.openCurrentBroadcasting();
	    return;
	}
	request_id = lvid.match(/lv\d+/);
	if(request_id){
	    $('debug-textbox').value = '';
	    NicoLiveHelper.openNewBroadcast(request_id,"",true,"");
	}
	request_id = lvid.match(/co\d+/) || lvid.match(/ch\d+/);
	if(request_id){
	    $('debug-textbox').value = '';
	    NicoLiveHelper.openNewBroadcast(request_id,"",true,request_id);
	}

	request_id = lvid.match(/nsen\/(.*)$/);
	if( request_id[1] ){
	    this.getNsenId(request_id[1]);
	}
    }

};
