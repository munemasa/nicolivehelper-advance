
var NicoLiveMylist = {
    mylists: {},               // マイリストグループ
    mylist_itemdata: {},       // 動画のマイリスト登録日とマイリストコメント

    /**
     * マイリスト登録時につぶやく
     * @param video_id 動画ID
     * @param additional_msg マイリストコメント
     */
    tweet:function(video_id, additional_msg){
	// TODO
	return;
	let video = NicoLiveHelper.findVideoInfo(video_id);
	if( video==null ) return;

	if( NicoLivePreference.twitter.when_addmylist ){
	    NicoLiveTweet.tweet(additional_msg+" 【マイリスト】"+video.title+" http://nico.ms/"+video.video_id+" #"+video.video_id);
	}
    },

    /**
     * マイリストコメントのデフォルト文字列を返す.
     */
    getDefaultMylistComment:function(){
	let msg = "";
	try{
	    let lvid = NicoLiveHelper.liveinfo.request_id;
	    let coid = NicoLiveHelper.liveinfo.default_community;
	    let title = NicoLiveHelper.liveinfo.title;
	    msg = ""+coid+" "+title+" "+lvid+" から登録\n";
	    if( lvid=="lv0" ){
		msg = "";
	    }
	} catch (x) {
	    msg = "";
	}
	return msg;
    },

    /**
     * とりマイに追加する(本処理)
     * @param video_id 動画ID
     * @param item_id
     * @param token
     * @param additional_msg マイリストコメント
     */
    addDeflistExec:function(video_id, item_id, token, additional_msg){
	// 二段階目は取得したトークンを使ってマイリス登録をする.
	let f = function(xml,xmlhttp){
	    if( xmlhttp.readyState==4 && xmlhttp.status==200 ){
		let result = JSON.parse(xmlhttp.responseText);
		switch(result.status){
		case 'ok':
		    NicoLiveMylist.tweet(video_id, additional_msg);
		    ShowNotice(video_id+'をとりあえずマイリストしました');
		    break;
		case 'fail':
		    ShowNotice(LoadString('STR_ERR_MYLIST_HEADER')+result.error.description);
		    break;
		default:
		    break;
		}
	    }
	};
	NicoApi.addDeflist( item_id, token, additional_msg, f );
    },
    /**
     * とりマイに登録する.
     * @param video_id 動画ID
     * @param additional_msg マイリストコメント
     */
    addDeflist:function(video_id, additional_msg){
	// 一段階目はトークンを取得する.
	if( !video_id ) return;
	let f = function(xml,xmlhttp){
	    if(xmlhttp.readyState==4 && xmlhttp.status==200){
		try{
		    let token = xmlhttp.responseText.match(/NicoAPI\.token\s*=\s*\"(.*)\";/);
		    let item_id = xmlhttp.responseText.match(/item_id\"\s*value=\"(.*)\">/);
		    token = token[1];
		    item_id = item_id[1];
		    NicoLiveMylist.addDeflistExec(video_id, item_id, token, additional_msg);
		} catch (x) {
		    debugprint(x);
		    ShowNotice(LoadString('STR_FAILED_ADDMYLIST'));
		}
	    }
	};
	NicoApi.getMylistToken( video_id, f );
    },

    /**
     * マイリストに登録する(本処理)
     * @param item_id
     * @param mylist_id マイリストID
     * @param token
     * @param video_id 動画ID
     * @param additional_msg マイリストコメント
     */
    addMyListExec:function(item_id,mylist_id,token,video_id, additional_msg){
	// 二段階目は取得したトークンを使ってマイリス登録をする.
	let f = function(xml,req){
	    if( req.readyState==4 && req.status==200 ){
		let result = JSON.parse(req.responseText);
		switch(result.status){
		case 'ok':
		    NicoLiveMylist.tweet(video_id, additional_msg);
		    ShowNotice(video_id+'をマイリストしました');
		    break;
		case 'fail':
		    ShowNotice(LoadString('STR_ERR_MYLIST_HEADER')+result.error.description);
		    break;
		default:
		    break;
		}
	    }
	};
	NicoApi.addMylist(item_id, mylist_id, token, additional_msg, f );
    },

    /**
     * マイリストに登録する.
     * @param mylist_id マイリストID、とりマイならdefaultにする
     * @param mylist_name マイリストの名前(デバッグログ用)
     * @param video_id 動画ID
     * @param ev DOMイベント
     */
    addMyList:function(mylist_id,mylist_name,video_id, ev){
	try{
	    let additional_msg = this.getDefaultMylistComment();
	    if( ev.ctrlKey ){
		additional_msg = InputPrompt("マイリストコメントを入力してください","マイリストコメント入力",additional_msg);
		if( additional_msg==null ) additional_msg = "";
	    }

	    if( mylist_id=='default' ){
		this.addDeflist(video_id, additional_msg);
		return;
	    }
	    // 一段階目はトークンを取得する.
	    let f = function(xml,req){
		if( req.readyState==4 && req.status==200 ){
		    try{
			let token = req.responseText.match(/NicoAPI\.token\s*=\s*\"(.*)\";/);
			let item_id = req.responseText.match(/item_id\"\s*value=\"(.*)\">/);
			debugprint('token='+token[1]);
			debugprint('item_id='+item_id[1]);
			NicoLiveMylist.addMyListExec(item_id[1],mylist_id,token[1],video_id, additional_msg);
		    } catch (x) {
			ShowNotice(LoadString('STR_FAILED_ADDMYLIST'));
		    }
		}
	    };
	    NicoApi.getMylistToken( video_id, f );
	    debugprint('add to mylist:'+video_id+'->'+mylist_name);
	} catch (x) {
	    ShowNotice(LoadString('STR_FAILED_ADDMYLIST'));
	}
    },

    /**
     * とりあえずマイリストからストックに追加する.
     */
    addStockFromDeflist:function(){
	let f = function(xml,req){
	    if( req.readyState==4 && req.status==200 ){
		let result = JSON.parse(req.responseText);
		switch(result.status){
		case 'ok':
		    let videos = new Array();
		    for(let i=0;i<result.mylistitem.length;i++){
			videos.push(result.mylistitem[i].item_data.video_id);
		    }
		    NicoLiveStock.addStock( videos.join(' ') );
		    break;
		case 'fail':
		    break;
		default:
		    break;
		}
	    }
	};
	NicoApi.getDeflist( f );
    },

    /**
     * マイリストからストックに追加する.
     * @param mylist_id マイリストのID
     * @param mylist_name マイリストの名前(未使用)
     */
    addStockFromMylist:function(mylist_id,mylist_name){
	let f = function(xml,req){
	    if( req.readyState==4 && req.status==200 ){
		let xml = req.responseXML;
		let items = xml.getElementsByTagName('item');
		let videos = new Array();
		debugprint('mylist rss items:'+items.length);
		for(let i=0,item;item=items[i];i++){
		    let video_id;
		    let description;
		    try{
			video_id = item.getElementsByTagName('link')[0].textContent.match(/(sm|nm)\d+/);
		    } catch (x) {
			video_id = "";
		    }
		    if(video_id){
			videos.push(video_id[0]);
			try{
			    description = item.getElementsByTagName('description')[0].textContent;
			    description = description.replace(/[\r\n]/mg,'<br>');
			    description = description.match(/<p class="nico-memo">(.*?)<\/p>/)[1];
			} catch (x) {
			    description = "";
			}

			let d = new Date(item.getElementsByTagName('pubDate')[0].textContent);

			let dat = {
			    "pubDate": d.getTime()/1000,  // 登録日 UNIX time
			    "description": description
			};
			NicoLiveMylist.mylist_itemdata["_"+video_id[0]] = dat;
		    }
		}// end for.
		NicoLiveStock.addStock(videos.join(' '));
	    }
	};
	NicoApi.mylistRSS( mylist_id, f );
    },

    /**
     * マイリストグループを読み込む.
     */
    readMylistGroup: function(){
	let f = function(xml,req){
	    if( req.readyState==4 && req.status==200 ){
		try{
		    NicoLiveMylist.mylists = JSON.parse(req.responseText);
		} catch (x) {
		    return;
		}

		if( NicoLiveMylist.mylists.status=='fail'){
		    ShowNotice(LoadString('STR_ERR_MYLIST_HEADER')+NicoLiveMylist.mylists.error.description);
		    return;
		}

		let mylists = NicoLiveMylist.mylists.mylistgroup;
		let elem;
		for(let i=0,item;item=mylists[i];i++){
		    let tmp = item.name.match(/.{1,20}/);

		    // マイリスト読み込み(stock)
		    elem = CreateMenuItem(tmp,item.id);
		    elem.setAttribute("tooltiptext",item.name);
		    elem.setAttribute("oncommand","NicoLiveMylist.addStockFromMylist(event.target.value,event.target.label);");
		    $('stock-from-mylist').appendChild(elem);

		    /*
		    // マイリスト読み込み(db)
		    elem = CreateMenuItem(tmp,item.id);
		    elem.setAttribute("tooltiptext",item.name);
		    elem.setAttribute("oncommand","NicoLiveMylist.addDatabase(event.target.value,event.target.label);");
		    $('menupopup-from-mylist-to-db').appendChild(elem);
		     */
		}
	    }
	};
	NicoApi.getmylistgroup( f );
    },

    init: function(){
	this.readMylistGroup();
    }
};


window.addEventListener("load", function(){ NicoLiveMylist.init(); }, false);
