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

	// TODO コントロールパネルの「放送中の番組に接続」の扱い
	//$('btn-connect-to-current-broadcast').disabled = true;
	req.onreadystatechange = function(){
	    if( req.readyState==4 ){
		//$('btn-connect-to-current-broadcast').disabled = false;
		if( req.status==200 ){
		    let str = req.responseText;
		    try{
			let lvid = str.match(/href=\"http.*\/watch\/(lv\d+)\"\s*class=\"now\"/)[1];
			debugprint( lvid );
			if(lvid){
			    NicoLiveHelper.openNewBroadcast(lvid,"",true,"");
			}
		    } catch (x) {
			ShowNotice("放送中の番組が見つかりませんでした。");
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
		    NicoLiveHelper.openNewBroadcast(request_id,"",false,"");
		} catch (x) {
		    debugprint(x);
		}
	    }
	};
	req.send("");
    },

    openBroadcasting: function(){
	let lvid = InputPrompt("接続する番組の放送ID(lvXXXX)、コミュニティ・チャンネルID、もしくはURLを入力してください。\n何も入力せずにOKすると、現在放送中の番組に接続します。","放送IDを入力","");
	let request_id;
	if( lvid==null ) return;
	if( lvid=="" ){
	    this.openCurrentBroadcasting();
	    return;
	}
	request_id = lvid.match(/lv\d+/);
	if(request_id){
	    NicoLiveHelper.openNewBroadcast(request_id,"",true,"");
	}
	request_id = lvid.match(/co\d+/) || lvid.match(/ch\d+/);
	if(request_id){
	    NicoLiveHelper.openNewBroadcast(request_id,"",true,request_id);
	}

	request_id = lvid.match(/nsen\/(.*)$/);
	if( request_id[1] ){
	    this.getNsenId(request_id[1]);
	}
    }

};
