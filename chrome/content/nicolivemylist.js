
var NicoLiveMylist = {
    mylists: {},               // マイリストグループ
    mylist_itemdata: {},       // 動画のマイリスト登録日とマイリストコメント

    /**
     * マイリスト登録時につぶやく
     * @param video_id 動画ID
     * @param additional_msg マイリストコメント
     */
    tweet:function(video_id, additional_msg){
	let video = NicoLiveHelper.findVideoInfoFromMemory(video_id);
	if( video==null ) return;

	if( Config.twitter.when_addmylist ){
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
		    if( !token ){
			token = xmlhttp.responseText.match(/NicoAPI\.token\s*=\s*\'(.*)\';/);
		    }
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
     * @param ev DOMイベント(CTRL押しながらだとマイリスコメを入力できるので、そのチェック用)
     */
    addMyList:function(mylist_id,mylist_name,video_id, ev){
	try{
	    let additional_msg = this.getDefaultMylistComment();
	    if( ev && ev.ctrlKey ){
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
			if( !token ){
			    token = req.responseText.match(/NicoAPI\.token\s*=\s*\'(.*)\';/);
			}
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
    addStockFromMylist: function( mylist_id, mylist_name ){
	let f = function( xml, req ){
	    if( req.readyState == 4 ){
		if( req.status == 200 ){
		    let xml = req.responseXML;
		    let items = xml.getElementsByTagName( 'item' );
		    let videos = new Array();
		    debugprint( 'mylist rss items:' + items.length );
		    for( let i = 0, item; item = items[i]; i++ ){
			let video_id;
			let description;
			try{
			    video_id = item.getElementsByTagName( 'link' )[0].textContent.match( /(sm|nm)\d+|\d{10}/ );
			}catch( x ){
			    video_id = "";
			}
			if( video_id ){
			    videos.push( video_id[0] );
			    try{
				description = item.getElementsByTagName( 'description' )[0].textContent;
				description = description.replace( /[\r\n]/mg, '<br>' );
				description = description.match( /<p class="nico-memo">(.*?)<\/p>/ )[1];
			    }catch( x ){
				description = "";
			    }

			    let d = new Date( item.getElementsByTagName( 'pubDate' )[0].textContent );

			    let dat = {
				"pubDate": d.getTime() / 1000,  // 登録日 UNIX time
				"description": description
			    };
			    NicoLiveMylist.mylist_itemdata["_" + video_id[0]] = dat;
			}
		    }// end for.
		    NicoLiveStock.addStock( videos.join( ' ' ) );
		}else{
		    console.log( req );
		    NicoLiveMylist.addStockFromMylistViaApi( mylist_id, mylist_name );
		}
	    }
	};
	NicoApi.mylistRSS( mylist_id, f );
    },

    /**
     * マイリストからストックに追加する(API使用).
     * @param mylist_id マイリストのID
     * @param mylist_name マイリストの名前(未使用)
     */
    addStockFromMylistViaApi: function( mylist_id, mylist_name ){
	let f = function( xml, req ){
	    if( req.readyState == 4 ){
		if( req.status == 200 ){
		    let mylistobj = JSON.parse( req.responseText );
		    let videos = new Array();
		    console.log( mylistobj );
		    for( let item of mylistobj.mylistitem ){
			videos.push( item.item_data.video_id ); // もしくは watch_id
			let dat = {
			    "pubDate": item.create_time,  // 登録日 UNIX time
			    "description": item.description
			};
			NicoLiveMylist.mylist_itemdata["_" + item.item_data.video_id] = dat;
		    }
		    NicoLiveStock.addStock( videos.join( ' ' ) );
		}
	    }
	};

	// http://www.nicovideo.jp/my/mylist の token を得る
	let url = "http://www.nicovideo.jp/my/mylist";
	NicoApi.getApiToken( url, function( token ){
	    NicoApi.getMylist( mylist_id, token, f );
	} );
    },

    /**
     * マイリストに追加のメニューを作成する
     * @param mylists マイリストグループ
     * @return メニューを返す
     */
    createMenuToAddMylist: function( mylists ){
	let popupmenu = CreateElement('menu');
	popupmenu.setAttribute('label',LoadString('STR_ADD_MYLIST')); // 'マイリストに追加'

	let popup = CreateElement('menupopup');
	popupmenu.appendChild(popup);

	let elem = CreateMenuItem(LoadString('STR_DEF_MYLIST'),'default'); // 'とりあえずマイリスト'
	popup.appendChild(elem);

	for(let i=0,item;item=mylists[i];i++){
	    let elem;
	    let tmp = item.name.match(/.{1,25}/);
	    elem = CreateMenuItem(tmp,item.id);
	    elem.setAttribute("tooltiptext",item.name);
	    popup.appendChild(elem);
	}
	return popupmenu;
    },

    /**
     * メニューからマイリストに追加.
     * @param mylist_id マイリストID
     * @param mylist_name マイリスト名
     * @param node メニューがポップアップしたノード
     * @param ev eventオブジェクト
     */
    addMylistFromMenu: function( mylist_id, mylist_name, triggernode, ev ){
	debugprint(mylist_id);
	debugprint(mylist_name);
	debugprint(triggernode);
	this.triggernode = triggernode;

	let videoinfo;
	if( triggernode.tagName=='statusbarpanel' ){
	    // ステータスバーから
	    videoinfo = NicoLiveHelper.getCurrentVideoInfo();
	}else if( triggernode.tagName=='label' ){
	    // メイン、サブの再生曲タイトル表示のところから
	    if( triggernode.id=='main-video-title' ){
		videoinfo = NicoLiveHelper.getCurrentVideoInfo( MAIN );
	    }else if( triggernode.id=='sub-video-title' ){
		videoinfo = NicoLiveHelper.getCurrentVideoInfo( SUB );
	    }
	}else{
	    let elem = FindParentElement(triggernode,'vbox');
	    if( elem ){
		let video_id = elem.getAttribute('nicovideo_id'); // 動画IDを取れる.
		videoinfo = new Object();
		videoinfo.video_id = video_id;
	    }
	}

	if( videoinfo ){
	    this.addMyList( mylist_id, mylist_name, videoinfo.video_id, ev );
	}
    },

    /**
     * マイリストグループを処理する.
     * マイリス追加メニューを作ったり、いろいろ。
     */
    processMylistGroup:function () {
        let mylists = NicoLiveMylist.mylists.mylistgroup;

	let popup = this.createMenuToAddMylist( mylists );
	popup.setAttribute("oncommand",
			   "NicoLiveMylist.addMylistFromMenu( event.target.value, event.target.label, $('popup-add-mylist').triggerNode, event);");
	$('popup-add-mylist').appendChild( popup );

	// リクエストのポップアップメニューに追加
	popup = popup.cloneNode(true);
	popup.setAttribute("oncommand",
			   "NicoLiveMylist.addMylistFromMenu( event.target.value, event.target.label, $('popup-request').triggerNode, event);");
	$('popup-request').insertBefore( popup, $('popup-request-marker').nextSibling );

	// ストックのポップアップメニューに追加
	popup = popup.cloneNode(true);
	popup.setAttribute("oncommand",
			   "NicoLiveMylist.addMylistFromMenu( event.target.value, event.target.label, $('popup-stock').triggerNode, event);");
	$('popup-stock').insertBefore( popup, $('popup-stock-marker').nextSibling );

	// 再生履歴(詳細)のポップアップメニューに追加
	popup = popup.cloneNode(true);
	popup.setAttribute("oncommand",
			   "NicoLiveMylist.addMylistFromMenu( event.target.value, event.target.label, $('popup-playlist').triggerNode, event);");
	$('popup-playlist').insertBefore( popup, $('popup-playlist-marker').nextSibling );

	// 再生履歴(テキスト)のメニューに追加
	popup = popup.cloneNode(true);
	NicoLiveHistory.appendMenu( popup );

	// ステータスバーのポップアップメニューに追加
	popup = popup.cloneNode(true);
	popup.setAttribute("oncommand",
			   "NicoLiveMylist.addMylistFromMenu( event.target.value, event.target.label, $('popup-statusbar').triggerNode, event);");
	$('popup-statusbar').insertBefore( popup, $('popup-statusbar-marker') );

        let elem;
        for (let i = 0, item; item = mylists[i]; i++) {
            let tmp = item.name.match(/.{1,20}/);

            // マイリスト読み込み(stock)
            elem = CreateMenuItem(tmp, item.id);
            elem.setAttribute("tooltiptext", item.name);
            elem.setAttribute("oncommand", "NicoLiveMylist.addStockFromMylist(event.target.value,event.target.label);");
            $('stock-from-mylist').appendChild(elem);

             // マイリスト読み込み(db)
             elem = CreateMenuItem(tmp,item.id);
             elem.setAttribute("tooltiptext",item.name);
             elem.setAttribute("oncommand","NicoLiveMylist.addDatabase(event.target.value, event.target.label);");
             $('menupopup-from-mylist-to-db').appendChild(elem);
        }
    },

    /**
     * マイリストからDBに登録する.
     * @param mylist_id マイリストID
     * @param mylist_name マイリスト名(未使用)
     * @param callback DB追加後のコールバック関数
     */
    addDatabase:function(mylist_id,mylist_name,callback){
	let f = function(xml,req){
	    if( req.readyState==4 && req.status==200 ){
		let xml = req.responseXML;
		let link = xml.getElementsByTagName('link');
		let videos = new Array();
		for(let i=0,item;item=link[i];i++){
		    let video_id = item.textContent.match(/(sm|nm)\d+/);
		    if(video_id){
			videos.push(video_id[0]);
		    }
		}
		Database.addVideos(videos.join(','), callback);
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
                NicoLiveMylist.processMylistGroup();
            }
	};
	NicoApi.getmylistgroup( f );
    },

    init: function(){
	this.readMylistGroup();
    }
};


window.addEventListener("load", function(){ NicoLiveMylist.init(); }, false);
