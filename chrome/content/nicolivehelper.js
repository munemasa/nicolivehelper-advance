/* NicoLive Helper Advance for Firefox/XULRunner */


//Components.utils.import("resource://nicolivehelperadvancemodules/usernamecache.jsm");
//Components.utils.import("resource://nicolivehelperadvancemodules/httpobserve.jsm");
//Components.utils.import("resource://nicolivehelperadvancemodules/alert.jsm");


var NicoLiveHelper = {
    // getplayerstatusの情報
    liveinfo: {},      // LiveInfo
    userinfo: {},      // UserInfo
    serverinfo: {},    // ServerInfo
    twitterinfo: {},   // TwitterInfo

    allowrequest: true, // リクエストの可否

    iscaster: false,    // 主かどうか
    post_token: "",     // 主コメ用のトークン

    connecttime: 0,     // コメントサーバーへの接続時刻
    currentRoom: ARENA,
    connectioninfo: [], // ConnectionInfo 複数のコメントサーバ接続管理用。0:アリーナ 1:立ち見A 2:立ち見B 3:立ち見C
    lastReceived: [],   // 最後に受信した時刻

    ticket: "",         // 視聴者コメント用のチケット(アリーナ席用のみ)
    postkey: "",        // 視聴者コメント用のキー
    last_res: 0,        // 最後のコメント番号

    // 再生ステータス 0:main 1:sub
    // .videoinfo 再生中の動画情報
    // .play_begin 再生開始時刻
    // .play_end 再生終了時刻
    play_status: [],
    play_target: 0,  // 0:main 1:sub

    // 再生方法
    autoplay: false,
    playstyle: PLAY_SEQUENTIAL,

    // 各種リスト
    request_list: [],   // リクエスト
    stock_list: [],     // ストック
    playlist_list: [],  // 再生履歴
    reject_list: [],    // リジェクト
    request_setno: 0,   // リクエストのセット番号
    stock_setno: 0,     // ストックのセット番号

    product_code: {},   // JWID作品コード

    // リクエスト、ストックを順番通りに処理するためのキュー
    request_q: [],
    stock_q: [],

    postclsfunc: null,   // /cls,/clearを受け取ったときに実行する関数

    commentViewState: COMMENT_VIEW_NORMAL,
    commentstate: COMMENT_STATE_NONE,

    /**
     * 生放送に接続しているかどうかを返す
     */
    isOffline: function(){
	return this.liveinfo.request_id=='lv0';
    },

    /**
     * 放送IDを返す
     */
    getRequestId: function(){
	return this.liveinfo.request_id;
    },

    /**
     * リクエストセット番号を返す
     */
    getRequestSetNo: function(){
	return this.request_setno;
    },
    /**
     * ストックセット番号を返す
     */
    getStockSetNo: function(){
	return this.stock_setno;
    },

    /**
     * リクエスト可否を切り替える.
     * @param flg 可否のフラグ
     * @param ev 押されているキーを取得するためのevent
     * @param nomsg リクエスト可否切り替え時に運営コメントしない
     */
    setAllowRequest:function(flg, ev, nomsg){
	this.allowrequest = flg;
	//debugprint("リクエスト"+(flg?"許可":"不可")+"に切り替えました");
	let str = flg ? Config.msg.requestok : Config.msg.requestng;
	let command = flg ? Config.msg.requestok_command : Config.msg.requestng_command;
	if(!command) command = "";
	if( ev && ev.ctrlKey ){
	    // CTRLキーが押されていたら運営コメントを入力して、それを使用.
	    let tmp = InputPrompt('リクエスト'+(flg?"許可":"不可")+'に切り替える時の運営コメントを入力してください','リクエスト可否切り替えコメントの入力',str);
	    if( tmp ) str = tmp;
	}
	if(str && !nomsg){
	    if( this.iscaster ) this.postComment(str,command);
	}
	if( !flg ) this.anchor = {};
	let e = evaluateXPath(document,"//*[@id='toolbar-allowrequest']//*[@allowrequest='"+flg+"']");
	if(e.length){
	    $('toolbar-allowrequest').label = e[0].label;
	}
    },

    /**
     * メインとサブ画面のどちらで再生するか指定する.
     * @param is_sub サブならtrueを渡す
     */
    setPlayTarget: function( is_sub ){
	debugprint( is_sub?"Play Subscreen":"Play Mainscreen");
	this.play_target = is_sub?SUB:MAIN;

	if( is_sub ){
	    $('cp-mainscreen-label').style.fontWeight = 'normal';
	    $('cp-subscreen-label').style.fontWeight = 'bold';
	}else{
	    $('cp-mainscreen-label').style.fontWeight = 'bold';
	    $('cp-subscreen-label').style.fontWeight = 'normal';
	}
    },

    /**
     * 再生スタイルを指定する.
     */
    setPlayStyle: function(playstyle){
	this._playstyle = playstyle;
	switch(playstyle){
	case 0:// 手動(順次)
	default:
	    this.autoplay = false;
	    this.playstyle = PLAY_SEQUENTIAL;
	    break;
	case 1:// 自動(順次)
	    this.autoplay = true;
	    this.playstyle = PLAY_SEQUENTIAL;
	    break;
	case 2:// 手動(ランダム)
	    this.autoplay = false;
	    this.playstyle = PLAY_RANDOM;
	    break;
	case 3:// 自動(ランダム)
	    this.autoplay = true;
	    this.playstyle = PLAY_RANDOM;
	    break;
	case 4:// 手動(消化数順)
	    this.autoplay = false;
	    this.playstyle = PLAY_CONSUMPTION;
	    break;
	case 5:// 自動(消化数順)
	    this.autoplay = true;
	    this.playstyle = PLAY_CONSUMPTION;
	    break;
	}

	let e = evaluateXPath(document,"//*[@id='toolbar-playstyle']//*[@playstyle='"+playstyle+"']");
	if(e.length){
	    $('toolbar-playstyle').label = e[0].label;
	}
    },

    /**
     * プレイリストに追加する(テキストのみ).
     */
    addPlaylistText:function(item){
	let elem = $('playlist-textbox');
	if( GetCurrentTime()-this.liveinfo.start_time < 150 ){
	    // 放送開始して最初の再生らしきときには番組名と番組IDを付加.
	    if( !this._first_play ){
		elem.value += "\n"+this.liveinfo.title+" "
		    + this.liveinfo.request_id
		    + " ("+GetFormattedDateString("%Y/%m/%d %H:%M",this.liveinfo.start_time*1000)+"-)\n";
		this._first_play = true;
	    }
	}
	elem.value += item.video_id+" "+item.title+"\n";
    },

    /**
     * プレイリストに追加する.
     */
    addPlaylist: function( item, notext ){
	// プレイリストに追加する.
	let elem = $('playlist-textbox');
	let now = GetCurrentTime();
	if( now-this.liveinfo.start_time < 180 ){
	    // 放送開始して最初の再生らしきときには番組名と番組IDを付加.
	    if( !this._first_play ){
		if( !notext ){
		    elem.value += "\n"+this.liveinfo.title+" "+this.liveinfo.request_id+" ("+GetFormattedDateString("%Y/%m/%d %H:%M",this.liveinfo.start_time*1000)+"-)\n";
		    this._first_play = true;
		}
	    }
	}
	item.playedtime = now;
	this.playlist_list.push(item); // 再生済みリストに登録.
	this.playlist_list["_"+item.video_id] = now;
	if( !notext ){
	    elem.value += item.video_id+" "+item.title+"\n";
	}
	NicoLiveHistory.addPlayList(item);
    },

    /**
     * 指定の動画を再生する
     */
    play: function( request ){
	let str;
	let is_sub = $('do-subdisplay').checked;
	if( request.video_id.indexOf("im")==0 ){
	    str = "/play " + request.video_id + " " + (is_sub?"sub":"main");
	}else{
	    str = "/play" + ($('menuid-soundonly').checked?"sound ":" ")+ request.video_id;
	    if( is_sub ){
		str += " sub"; // サブ画面で再生する.
	    }
	}
	this.postCasterComment( str, "" ); // 再生
	this.addPlaylist( request, true ); // notext=true

	let i = is_sub?SUB:MAIN;
	this.play_target = i;
	// 再生時間は /play受信時に再設定するので、ここでは仮設定扱い
	request.is_played = true;
	this.play_status[ i ].videoinfo = request;
	this.play_status[ i ].play_begin = GetCurrentTime();
	this.play_status[ i ].play_end = this.play_status[i].play_begin + request.length_ms/1000 +1;

	// 再生コマンドを投げたあと、コマンドが返ってこずに飲み込まれる場合がある
	// 自動再生タイマーは/play受信時なので、その対策として、60秒タイマーを仕掛ける
	// 正常に /play を受信できれば、その時に改めて再設定される
	let l = request.length_ms/1000;
	if( l > 60) l = 60;
	this.setupPlayNext( i, l, true ); // no prepare
    },

    /**
     * 次曲ボタンを押したときのアクション.
     */
    playNext: function(){
	let request = this.request_list;
	let stock = this.stock_list;

	switch( this.playstyle ){
	case PLAY_SEQUENTIAL:
	default:
	    if( request.length ){
		NicoLiveRequest.playRequest(0);
		return;
	    }else if( stock.length ){
		for(let i=0,item; item=stock[i]; i++){
		    if( !item.is_played && item.errno!=REASON_NO_LIVE_PLAY ){
			NicoLiveStock.playStock( i );
			return;
		    }
		}
	    }
	    ShowNotice("再生できる動画がありませんでした");
	    break;

	case PLAY_RANDOM:
	    break;

	case PLAY_CONSUMPTION:
	    break;
	}
    },

    /**
     * 次曲の自動再生の確認して、再生する.
     */
    checkPlayNext: function(){
	if( $('do-pauseplay').checked ){
	    // 一時停止が押されているので自動で次曲に行かない.
	    return;
	}
	this.playNext();
    },

    /**
     * n1,n2のリクエストを入れ替える
     * @param n1 0,1,2,...
     * @param n2 0,1,2,...
     * @param q 入れ替えするリスト(optional) 指定しなければリクエストリストを対象とする
     */
    swapRequest: function( n1, n2, q ){
	if( !q ) q = this.request_list;
	let tmp = q[n1];
	q[n1] = q[n2];
	q[n2] = tmp;
    },

    /**
     * リクエストを一番上に移動する.
     * @param n 移動するリクエストのindex
     * @param q 入れ替えするリスト(optional) 指定しなければリクエストリストを対象とする
     */
    goTopRequest: function( n, q ){
	if( !q ) q = this.request_list;

	let t;
	t = q.splice(n,1);
	if(t){
	    q.unshift(t[0]);
	}
    },
    /**
     * リクエストを一番下に移動する.
     * @param n 移動するリクエストのindex
     * @param q 入れ替えするリスト(optional) 指定しなければリクエストリストを対象とする
     */
    goBottomRequest: function( n, q ){
	if( !q ) q = this.request_list;
	let t;
	t = q.splice(n,1);
	if(t){
	    q.push(t[0]);
	}
    },

    /**
     * リクエストを1つ削除して、それを返す
     * @param n 0,1,2,...
     */
    removeRequest: function(n){
	let removeditem = this.request_list.splice(n,1);
	return removeditem[0];
    },
    /**
     * ストックを1つ削除して、それを返す
     * @param n 0,1,2,...
     */
    removeStock: function(n){
	let removeditem = this.stock_list.splice(n,1);
	return removeditem[0];
    },

    _shuffle: function(list){
	let i = list.length;
	while(i){
	    let j = Math.floor(Math.random()*i);
	    let t = list[--i];
	    list[i] = list[j];
	    list[j] = t;
	}
    },
    shuffleRequest: function(){
	this._shuffle( this.request_list );
	NicoLiveRequest.updateView( this.request_list );
    },
    shuffleStock: function(){
	this._shuffle( this.stock_list );
	NicoLiveStock.updateView( this.stock_list );
    },

    /**
     * リクエストを再生する.
     * 再生すると、そのリクエストは削除される。
     * @param n リクエスト先頭から0,1,2,3,....
     */
    playRequest: function(n){
	if( this.isOffline() || !this.iscaster ) return;
	
	let request = this.removeRequest( n );
	if( !request ) return;

	this.play( request );
    },
    playStock: function(n){
	if( this.isOffline() || !this.iscaster ) return;
	let item = this.stock_list[n];
	this.play( item );
    },
    playHistory: function(n){
	if( this.isOffline() || !this.iscaster ) return;
	let item = this.playlist_list[n];
	this.play( item );
    },

    /**
     * サウンドオンリーのON/OFFを行う.
     * @param target 0:MAIN 1:SUB
     * @param b true(ON) or false(OFF)
     */
    setSoundOnly:function(target,b){
	switch(target){
	case 0:
	    this.postCasterComment("/soundonly "+(b?"on":"off"));
	    break;
	case 1:
	    this.postCasterComment("/soundonly "+(b?"on":"off")+" sub");
	    break;
	}
    },

    /**
     * 現在再生している動画情報を返す
     * @param n メインかサブかのターゲット指定。なければ現在の再生ターゲット。
     */
    getCurrentVideoInfo: function(n){
	try{
	    if( n==MAIN || n==SUB ){
		return this.play_status[ n ].videoinfo;
	    }else{
		return this.play_status[ this.play_target ].videoinfo;
	    }
	} catch (x) {
	    return null;
	}
    },

    getTotalPlayTime:function(list,excludeplayed,checkmaxplay){
	let t=0;
	let maxplay = parseInt(Config.max_playtime*60*1000);
	let s;

	for(let i=0,item;item=list[i];i++){
	    if( excludeplayed && item.is_played ) continue;
	    if( maxplay>0 && checkmaxplay ){
		s = maxplay>item.length_ms?item.length_ms:maxplay;
	    }else{
		s = item.length_ms;
	    }
	    t += s;
	}
	t /= 1000;
	let min,sec;
	min = parseInt(t/60);
	sec = t%60;
	return {"min":min, "sec":sec};
    },

    getTotalRequestTime: function(){
	return this.getTotalPlayTime( this.request_list, true, true );
    },
    getTotalStockTime: function(){
	return this.getTotalPlayTime( this.stock_list, true, true );
    },

    /**
     * 文字列のマクロ展開を行う.
     * @param str 置換元も文字列
     * @param info 動画情報
     */
    replaceMacros:function(str,info){
	let replacefunc = function(s,p){
	    let tmp = s;
	    let expression;
	    if(expression = p.match(/^=(.*)/)){
		try{
		    tmp = eval(expression[1]);
		    if(tmp==undefined || tmp==null) tmp = "";
		} catch (x) {
		    tmp = "";
		}
		return tmp;
	    }
	    switch(p){
	    case 'id':
		if( !info.video_id ) break;
		tmp = info.video_id;
		break;
	    case 'title':
		if( !info.title ) break;
		tmp = info.title;
		break;
	    case 'date':
		if( !info.first_retrieve ) break;
		tmp = GetDateString(info.first_retrieve*1000);
		break;
	    case 'length':
		if( !info.length ) break;
		tmp = info.length;
		break;
	    case 'view':
		if( !info.view_counter ) break;
		tmp = FormatCommas(info.view_counter);
		break;
	    case 'comment':
		if( !info.comment_num ) break;
		tmp = FormatCommas(info.comment_num);
		break;
	    case 'mylist':
		if( !info.mylist_counter ) break;
		tmp = FormatCommas(info.mylist_counter);
		break;
	    case 'mylistrate':
		if( !info.mylist_counter || !info.view_counter ) break;
		if( info.view_counter==0 ){
		    tmp = "0.0%";
		}else{
		    tmp = (100*info.mylist_counter/info.view_counter).toFixed(1) + "%";
		}
		break;
	    case 'tags':
		// 1行40文字程度までかなぁ
		if( !info.tags['jp'] || info.tags['jp'].length==0 ) break;
		tmp = info.tags['jp'].join('　');
		tmp = tmp.replace(/(.{35,}?)　/g,"$1<br>");
		break;
	    case 'username':
		// TODO 動画の投稿者名
		//tmp = UserNameCache[info.user_id] || "";
		break;
	    case 'pname':
		if(info.video_id==null || info.tags['jp']==null) break;
		tmp = NicoLiveHelper.getPName(info);
		break;
	    case 'additional':
		// TODO 動画DBに登録してある追加情報
		if(info.video_id==null) break;
		tmp = NicoLiveDatabase.getAdditional(info.video_id);
		break;
	    case 'description':
		// 詳細を40文字まで(世界の新着と同じ)
		tmp = info.description.match(/.{1,40}/);
		break;

	    case 'comment_no':
		// リク主のコメント番号
		tmp = info.comment_no || "";
		break;

	    case 'requestnum': // リク残数.
		tmp = NicoLiveHelper.request_list.length;
		break;
	    case 'requesttime': // リク残時間(mm:ss).
		let reqtime = NicoLiveHelper.getTotalRequestTime();
		tmp = GetTimeString(reqtime.min*60+reqtime.sec);
		break;
	    case 'stocknum':  // ストック残数.
		let remainstock = 0;
		NicoLiveHelper.stock_list.forEach( function(item){
						       if( !item.is_played ) remainstock++;
						   });
		tmp = remainstock;
		break;
	    case 'stocktime': // ストック残時間(mm:ss).
		let stocktime = NicoLiveHelper.getTotalStockTime();
		tmp = GetTimeString(stocktime.min*60+stocktime.sec);
		break;
		
	    case 'json':
		try {
		    // TODO ユーザー定義値
		    let t = NicoLiveHelper.userdefinedvalue[info.video_id];
		    if( t ){
			tmp = t;
		    }else{
			tmp = "0";
		    }
		} catch (x) {
		    tmp = "";
		}
		break;
		
	    case 'mylistcomment':
		// マイリストコメント
		tmp = info.mylistcomment;
		if(!tmp) tmp = "";
		break;

	    case 'pref:min-ago':
		// TODO 枠終了 n 分前通知の設定値.
		tmp = NicoLivePreference.notice.time;
		break;

	    case 'end-time':
		// 放送の終了時刻.
		tmp = GetDateString( NicoLiveHelper.liveinfo.end_time * 1000 );
		break;

	    case 'progress':
		// TODO 現在の動画の進行具合の棒グラフ.
		if( NicoLiveHelper.musicinfo.length_ms<=0 ) return "";
		let progress = GetCurrentTime()-NicoLiveHelper.musicstarttime;
		let progressbar = Math.floor(progress / (NicoLiveHelper.musicinfo.length_ms/1000) * 100);
		tmp = "0:00 <font color=\"#0000ff\">";
		let j;
		for(j=0;j<progressbar;j++){
		    tmp += "|";
		}
		tmp += "</font>";
		for(;j<100;j++){
		    tmp += "|";
		}
		tmp += " " + NicoLiveHelper.musicinfo.length;
		break;
	    case 'live-id':
		tmp = NicoLiveHelper.liveinfo.request_id;
		break;
	    case 'live-title':
		tmp = NicoLiveHelper.liveinfo.title;
		break;
	    case 'hashtag':
		tmp = NicoLiveHelper.liveinfo.twitter_tag;
		break;
	    }
	    return tmp;
	};
	// String.replace()だとネストするとダメなので自前で置換
	let r = "";
	let token = "";
	let nest = 0;
	for(let i=0,ch; ch=str.charAt(i);i++){
	    switch(nest){
	    case 0:
		if( ch=='{' ){
		    nest++;
		    token += ch;
		    break;
		}
		r += ch;
		break;
	    default:
		token += ch;
		if(ch=='{') nest++;
		if(ch=='}'){
		    nest--;
		    if(nest<=0){
			try{
			    r += replacefunc(token,token.substring(1,token.length-1));
			} catch (x) {
			}
			token = "";
		    }
		}
		break;
	    }
	}
	return r;
    },

    /**
     * 運営コメントを行う.
     * @param comment 運営コメント
     * @param mail コマンド(hiddenや色など)
     * @param name 名前欄に表示する名前
     * @param type コメント種別(undefined or null:自動応答, 1:動画情報, 2:普通の主コメ
     * @param retry 送信エラーになったときのリトライ時にtrue
     */
    postCasterComment: function(comment,mail,name,type,retry){
	if( !this.iscaster || this.isOffline() ) return;
	if( comment.length<=0 ) return;
	if( !mail ) mail = "";
	if( !name ) name = "";

	let f = function(xml, req){
	    if( req.readyState==4 && req.status==200 ){
		debugprint('castercomment: '+req.responseText);
		// status=error&error=0
		if( req.responseText.indexOf("status=error")!=-1 ){
		    if( !retry ){
			setTimeout( function(){
					NicoLiveHelper.postCasterComment(comment,mail,name,type,true); // retry=true
				    }, 3000 );
		    }else{
			// 世界の新着、生放送引用拒否動画は、/playコマンドはエラーになる.
			ShowNotice("コメント送信に失敗しました:"+comment);
		    }
		}else{
		    // 運営コメント送信に成功
		}
	    }
	};

	let videoinfo = this.getCurrentVideoInfo();
	let truecomment = this.replaceMacros(comment, videoinfo);
	if(truecomment.length<=0) return; // マクロ展開したあとにコメが空なら何もしない

	// 主コメは184=falseにしても効果がないので常時trueに.
	let data = new Array();
	data.push("body="+encodeURIComponent(truecomment));
	data.push("is184=true");
	if(name){
	    data.push("name="+encodeURIComponent(name));
	}
	data.push("token="+NicoLiveHelper.post_token);
	// コマンドは mail=green%20shita と付ける.
	data.push("mail="+encodeURIComponent(mail));
	NicoApi.broadcast( this.liveinfo.request_id, data, f );

	// 主コメ送信のレスポンスが来たときにセットアップしていたのをここに移動.
	switch( NicoLiveHelper.commentstate ){
	case COMMENT_STATE_MOVIEINFO_DONE:
	    try{
		if( type==COMMENT_MSG_TYPE_MOVIEINFO ) break;
		if( type!=COMMENT_MSG_TYPE_MOVIEINFO && comment.indexOf('/')==0 ) break;
		if( NicoLiveHelper._comment_video_id==comment ) break; // 主コメ経由で動画IDを流したときには動画情報の復元は不要.
		if( mail.indexOf("hidden")==-1 && NicoLiveHelper.commentViewState==COMMENT_VIEW_HIDDEN_PERM ){
		    // hiddenコメじゃなければ上コメは上書きされないので復帰必要なし.
		    break;
		}
		NicoLiveHelper.setupRevertVideoInfo();
	    } catch (x) {
		debugprint(x);
	    }
	    break;
	default:
	    break;
	}
    },

    /**
     * BSPコメントをする.
     * @param comment コメント
     * @param name 名前
     * @param color 色
     */
    postUserPress:function(comment,name,color){
	if( !comment ) return;
	if( !name ) name = this.userinfo.nickname;
	if( !color ) color = "#45bc38";
	if( !this.user_press_token ){
	    let tab = NicoLiveWindow.findTab(this.liveinfo.request_id) || NicoLiveWindow.findTab(this.liveinfo.default_community);
	    if( tab ){
		try{
		    this.user_press_token = tab.linkedBrowser._contentWindow.window.document.getElementById('presscast_token').value;
		} catch (x) {
		    ShowNotice("BSPコメント用トークンを取得できませんでした");
		    return;
		}
	    }else{
		ShowNotice("生放送のページを開いていないため、BSPコメント用トークンを取得できませんでした");
	    }
	}

	let data = new Array();
	data.push("v="+this.liveinfo.request_id);
	data.push("body="+encodeURIComponent(comment));
	data.push("name="+encodeURIComponent(name));
	data.push("token="+encodeURIComponent(this.user_press_token));
	data.push("color="+encodeURIComponent(color));
	data.push("mode=json");

	let f = function(xml, req){
	    if( req.readyState==4 && req.status==200 ) {
		let result = JSON.parse(req.responseText);
		if(result.status=="error"){
		    ShowNotice("投稿エラーです");
		}
	    }
	};
	NicoApi.presscast( data, f );
    },

    /**
     * リスナーコメントを送信する
     * @param comment コメント
     * @param mail コマンド
     */
    postListenerComment: function(comment,mail){
	if(this.isOffline()) return;
	if(!comment) return;
	if(comment.length<=0) return;
	if( !mail ) mail = "";

	// JASRACコードの-を=に変換
	comment = comment.replace(/((...)[-](....)[-](.))/g,"$2=$3=$4");

	/*
	if( this.previouschat==comment ){
	    ShowNotice("同じコメントの連投はできません");
	    return;
	}
	 */

	this._getpostkeycounter = 0;
	setTimeout(function(){
		       NicoLiveHelper._postListenerComment( ARENA, comment, mail);
		   }, 0);
    },

    /**
     * リスナーコメントを送信する(本体)
     * @param target コメント送信先のサーバー(ARENA, STAND_A, STAND_B, STAND_C)
     * @param comment コメント
     * @param mail コマンド
     */
    _postListenerComment: function(target, comment, mail){
	this.chatbuffer = comment;
	this.mailbuffer = mail;

	if(!this.postkey){
	    this.getpostkey(); // ポストキーがまだないときはまず取ってこないとね.
	    return;
	}
	let str;
	let vpos = Math.floor((GetCurrentTime()-this.liveinfo.open_time)*100);
	// mailアトリビュートに空白区切りでコマンド(shita greenとか)を付ける.
	str = "<chat thread=\""+this.serverinfo.thread+"\""
	    + " ticket=\""+this.ticket+"\""
	    + " vpos=\""+vpos+"\""
	    + " postkey=\""+this.postkey+"\""
	    + " mail=\""+mail+(Config.comment184?" 184\"":"\"")
	    + " user_id=\""+this.userinfo.user_id+"\""
	    + " premium=\""+this.userinfo.is_premium+"\" locale=\"jp\">"
	    + htmlspecialchars(comment)
	    + "</chat>\0";
	//debugprint(str);

	this.connectioninfo[target].ostream.writeString(str);
    },

    /**
     * リスナーコメント投稿用のキーを取得して、コメント送信する.
     * NicoLiveHelper.chatbuffer と NicoLiveHelper.mailbuffer に
     * あらかじめ送信データをセットしておくこと。
     */
    getpostkey:function(){
	if( this.isOffline() ) return;
	let thread = this.serverinfo.thread;
	if( !thread ) return;
	let block_no;
	if( this._getpostkeycounter<=0 ){
	    block_no = parseInt(this.last_res/100) + this._getpostkeycounter;
	    this._bk_block_no = block_no;
	}else{
	    block_no = this._bk_block_no + this._getpostkeycounter;
	}
	this._getpostkeycounter++;
	if( this._getpostkeycounter > 3){
	    // リトライは最大3回まで.
	    debugprint('getpostkey: retry failed\n');
	    return;
	}

	let f = function(xml,req){
	    if( req.readyState==4 ){
		if( req.status==200 ){
		    let tmp = req.responseText.match(/postkey=(.*)/);
		    if(tmp){
			NicoLiveHelper.postkey = tmp[1];
			debugprint('postkey='+NicoLiveHelper.postkey);
			if(NicoLiveHelper.postkey){
			    // 取得終わったら、コメ送信する.
			    NicoLiveHelper._postListenerComment( ARENA,
								 NicoLiveHelper.chatbuffer,
								 NicoLiveHelper.mailbuffer );
			}
		    }else{
			NicoLiveHelper.postkey = "";
		    }
		}else{
		    ShowNotice("postkeyの取得に失敗しました");
		    NicoLiveHelper.getpostkey();
		}
	    }
	};
	NicoApi.getpostkey( thread, block_no, f );
    },

    /**
     * コメントを投稿する.
     * 生主、視聴者両用。
     * コメントタブからのコメント送信はここを経由します。
     * @param text コメント
     * @param mail コマンド
     * @param name 名前
     */
    postComment: function( text, mail, name ){
	if( this.iscaster ){
	    if( text.match(/^((sm|nm|so)\d+|\d{10})$/) ){
		debugprint(text+'を手動で再生します');
		this._comment_video_id = text;
		this.postCasterComment( text, mail, name, COMMENT_MSG_TYPE_NORMAL );
	    }else{
		if( text.indexOf('/')==0 ){
		    // コマンドだった場合/clsを送らない.
		    this.postCasterComment( text, mail, name, COMMENT_MSG_TYPE_NORMAL );
		}else{
		    // 直前のコメがhidden+/permで、上コメ表示にチェックがされていたら、/clsを送ってから.
		    let func = function(){
			NicoLiveHelper.postCasterComment( text, mail, name, COMMENT_MSG_TYPE_NORMAL );
		    };
		    this.clearCasterCommentAndRun( func );
		}
	    }
	}else{
	    if ( $('use_presscomment').hasAttribute('checked') ){
		let color = "";
		this.postUserPress( text, mail, color );
	    }else{
		this.postListenerComment( text, mail );
	    }
	}
    },

    /**
     * 運営コメント欄を/clsで消去したあと、指定の関数を実行する.
     * 消去の必要がない場合は消去せずに指定の関数を実行する.
     * @param func /cls後に実行する関数
     */
    clearCasterCommentAndRun:function(func){
	if( this.isOffline() ) return;

	// /clsが飲み込まれて送られてこなかったらどうしよう.
	// というときのために、/clsを送る必要があるときは
	// /clsか/clearを受けとるまで6秒間隔で/clsを送信.
	if( 'function'!=typeof func ) return;

	let sendclsfunc = function(){
	    NicoLiveHelper.postCasterComment("/cls","");
	    NicoLiveHelper._clscounter++;
	    if(NicoLiveHelper._clscounter>=5){
		clearInterval( NicoLiveHelper._sendclstimer );
		NicoLiveHelper.postclsfunc = null;
	    }
	};

	if( this.commentViewState==COMMENT_VIEW_HIDDEN_PERM ){
	    // hidden/permのときは先に/clsを送らないといけない.
	    if('function'!=typeof this.postclsfunc){
		// postclsfuncが空いているので、登録したのち/cls
		this.postclsfunc = func;
		this.postCasterComment("/cls","");
		clearInterval(this._sendclstimer);
		this._clscounter = 0;
		// /clsがきちんと送れるように6秒間隔でリトライする
		this._sendclstimer = setInterval( sendclsfunc, 6000 );
	    }else{
		// 1秒ごとにpost /cls関数が空いてないかチェック.
		let timer = setInterval(
		    function(){
			if( 'function'!=typeof NicoLiveHelper.postclsfunc ){
			    // postclsfuncが空いた.
			    if( NicoLiveHelper.commentViewState!=COMMENT_VIEW_HIDDEN_PERM ){
				// hidden/permじゃないので、/clsは不要.
				func();
			    }else{
				// 登録したのち/cls
				NicoLiveHelper.postclsfunc = func;
				NicoLiveHelper.postCasterComment("/cls","");
				clearInterval(NicoLiveHelper._sendclstimer);
				NicoLiveHelper._clscounter = 0;
				NicoLiveHelper._sendclstimer = setInterval( sendclsfunc, 6000 );
			    }
			    clearInterval(timer);
			}
		    }, 1000);
	    }
	}else{
	    func();
	}
    },

    /**
     *  リクエストの処理状況を表示する.
     */
    setupRequestProgress:function(){
	if( this.request_q.length==0 ){
	    $('request-progress').style.display = 'none';
	}else{
	    let processlist = "";
	    for(let i=0,item; (item=this.request_q[i]) && i<10; i++){
		processlist += item.video_id + " ";
	    }
	    $('request-progress-label').value = processlist;
	    $('request-progress').style.display = '';
	}
    },

    /**
     *  与えられたstrがP名かどうか.
     */
    isPName:function(str){
	/*
	if( pname_whitelist["_"+str] ){
	    return true;
	}
	if( NicoLivePreference.no_auto_pname ) return false;
	 */
	if(str.match(/(PSP|アイドルマスターSP|m[a@]shup|drop|step|overlap|vocaloid_map|mikunopop|mikupop|ship|dump|sleep)$/i)) return false;
	if(str.match(/(M[A@]D|joysound|MMD|HD|2D|3D|4D|vocaloud|world|頭文字D|イニシャルD|(吸血鬼|バンパイア)ハンターD|TOD|oid|clannad|2nd|3rd|second|third|append|CD|DVD|solid|vivid|hard)$/i)) return false;
	let t = str.match(/.*([^jO][pP]|jP)[)]?$/);
	if(t){
	    return true;
	}
	// D名
	t = str.match(/.*[^E][D]$/);
	if(t){
	    return true;
	}
	return false;
    },

    /**
     * P名を取得する
     */
    getPName: function(item){
	// DBに設定してあるP名があればそれを優先.
	let pname = null; //NicoLiveDatabase.getPName(item.video_id);
	if(!pname){
	    pname = new Array();
	    let i,j,tag;
	    try{
		// まずはP名候補をリストアップ.
		for(i=0;tag=item.tags['jp'][i];i++){
		    if( this.isPName(tag) ){
			pname.push(tag);
		    }
		}
	    } catch (x) { }
	    if(pname.length){
		/* ラマーズP,嫁に囲まれて本気出すラマーズP
		 * とあるときに、後者だけを出すようにフィルタ.
		 * てきとう実装.
		 * 組み合わせの問題なのでnlognで出来るけど、
		 * P名タグは数少ないしn*nでもいいよね.
		 */
		let n = pname.length;
		for(i=0;i<n;i++){
		    let omitflg=false;
		    if(!pname[i]) continue;
		    for(j=0;j<n;j++){
			if(i==j) continue;

			if(pname[j].match(pname[i]+'$')){
			    omitflg = true;
			}
			/* 曲名(誰P)となっているものが含まれていたらそれを除外する
			 * ために (誰P) を含むものを除外する.
			 */
			if(pname[j].indexOf('('+pname[i]+')') != -1 ){
			    pname[j] = "";
			}
		    }
		    if(omitflg) pname[i] = "";
		}
		let tmp = new Array();
		for(i=0;i<n;i++){
		    if(pname[i]) tmp.push(pname[i]);
		}
		pname = tmp.join(', ');
	    }else{
		pname = "";
	    }
	}
	return pname;	
    },

    /**
     * 静画情報を展開する.
     * @param video_id 静画ID
     * @param text 静画情報のテキスト
     */
    extractSeigaInfo: function(video_id, text){
	let info = new Object();
	let title = "ニコニコ静画";
	// <div class="illust_ttl"><a href="http://seiga.nicovideo.jp/seiga/im2681108" target="_blank">ぷちかる</a></div>
	if( text.match(/illust_ttl.*?target="_blank">(.*?)<\/a><\/div>/) ){
	    title = RegExp.$1;
	}

	info.video_id = video_id.replace(/^im/,'img');
	info.title = title;
	info.thumbnail_url = "http://lohas.nicoseiga.jp/thumb/" + video_id.replace(/^im(\d+)/,'$1q');
	info.description = "";
	info.length = "1:00";
	info.length_ms = 60*1000;
	return info;
    },

    /**
     * 動画情報のXMLをJavascriptオブジェクトにする.
     * @throw String エラーコードを例外として投げる
     */
    extractVideoInfo: function(xml){
	// ニコニコ動画のgetthumbinfoのXMLから情報抽出.
	let info = new Object();

	let error = GetXmlText(xml,"/nicovideo_thumb_response/error/code");
	if( error ){
	    // COMMUNITY or NOT_FOUND
	    throw error;
	}

	let root;
	root = xml.getElementsByTagName('thumb')[0];
	if( !root ) throw "no thumb tag";

	for(let i=0,elem; elem=root.childNodes[i]; i++){	    	
	    switch( elem.tagName ){
	    case "user_id":
		info.user_id = elem.textContent;
		break;
	    case "video_id":
		info.video_id = elem.textContent;
		break;
	    case "title":
		info.title = restorehtmlspecialchars(elem.textContent);
		break;
	    case "description":
		info.description = restorehtmlspecialchars(elem.textContent).replace(/　/g,' ');
		break;
	    case "thumbnail_url":
		info.thumbnail_url = elem.textContent;
		break;
	    case "first_retrieve":
		// Firefox 4からISO 8601フォーマットを読めるのでそのまま利用
		let d = new Date( elem.textContent );
		info.first_retrieve = d.getTime() / 1000; // seconds from epoc.
		break;
	    case "length":
		// TODO
		if( 0 && this._videolength["_"+info.video_id] ){
		    // getthumbinfo のデータと実際が合わない動画があるので調整データベースから
		    info.length = this._videolength["_"+info.video_id];
		}else{
		    info.length = elem.textContent;
		}
		let len = info.length.match(/\d+/g);
		info.length_ms = (parseInt(len[0],10)*60 + parseInt(len[1],10))*1000;
		break;
	    case "view_counter":
		info.view_counter = parseInt(elem.textContent);
		break;
	    case "comment_num":
		info.comment_num = parseInt(elem.textContent);
		break;
	    case "mylist_counter":
		info.mylist_counter = parseInt(elem.textContent);
		break;
	    case "tags":
		// attribute domain=jp のチェックが必要.
		// また、半角に正規化.
		let domain = elem.getAttribute('domain') || 'jp';
		let tag = elem.getElementsByTagName('tag');
		if( !info.tags ){
		    info.tags = new Object();
		}
		if( !info.tags[domain] ) info.tags[domain] = new Array();
		for(let i=0,item;item=tag[i];i++){
		    let tag = restorehtmlspecialchars(ZenToHan(item.textContent));
		    info.tags[domain].push(tag);
		}
		break;
	    case "size_high":
		info.filesize = parseInt(elem.textContent);
		info.highbitrate = elem.textContent;
		info.highbitrate = (info.highbitrate*8 / (info.length_ms/1000) / 1000).toFixed(2); // kbps "string"
		break;
	    case "size_low":
		info.lowbitrate = elem.textContent;
		info.lowbitrate = (info.lowbitrate*8 / (info.length_ms/1000) / 1000).toFixed(2); // kbps "string"
		break;
	    case "movie_type":
		info.movie_type = elem.textContent;
		break;
	    case "no_live_play":
		info.no_live_play = parseInt(elem.textContent);
		break;
	    default:
		break;
	    }
	}
	// video_id がないときはエラーとしておこう、念のため.
	if( !info.video_id ){
	    throw "no video id.";
	}

	return info;
    },

    /**
     * すでにリクエスト済みかどうかチェックする.
     * 重複許可なら常にtrueを返す。
     * @param video_id 動画ID
     */
    isAlreadyRequested: function( video_id ){
	if( Config.request.allow_duplicative ) return true;

	for( let i=0,item; item=this.request_list[i]; i++ ){
	    if( item.video_id==video_id ){
		return true;
	    }
	}
	return false;
    },

    /**
     * 再生済みかどうかチェックする.
     * @param video_id 動画ID
     */
    isAlreadyPlayed: function( video_id ){
	if(this.playlist_list["_"+video_id]) return true;
	return false;
    },

    /**
     * すでにストックに持っているかどうか
     * @param video_id 動画ID
     */
    hasStock: function( video_id ){
	for( let i=0,item; item=this.stock_list[i]; i++ ){
	    if( item.video_id==video_id ){
		return true;
	    }
	}
	return false;
    },

    /**
     * リクエストをチェックして可否を返す.
     * リクエストを拒否する場合は例外を投げる.
     * @throws RequestException (datastruct.js)
     */
    checkRequest: function( videoinfo ){
	// TODO NG動画のチェック

	if( videoinfo.no_live_play ){
	    // 生拒否
	    videoinfo.errno = REASON_NO_LIVE_PLAY;
	    videoinfo.errmsg = Config.msg.no_live_play;
	    throw videoinfo;
	}

	if( !this.allowrequest ){
	    // リクエスト不可
	    videoinfo.errno = REASON_NOT_ACCEPT;
	    videoinfo.errmsg = Config.msg.notaccept;
	    throw videoinfo;
	}

	if( this.isAlreadyRequested( videoinfo.video_id ) ){
	    // すでにリクエスト済み
	    videoinfo.errno = REASON_ALREADY_REQUESTED;
	    videoinfo.errmsg = Config.msg.requested;
	    throw videoinfo;
	}

	if( this.isAlreadyPlayed( videoinfo.video_id ) ){
	    // 再生済み
	    videoinfo.errno = REASON_ALREADY_PLAYED;
	    videoinfo.errmsg = Config.msg.played;
	    throw videoinfo;
	}

	return true;
    },

    /**
     * 動画情報を取ってきてリクエストに追加する
     * @param retryobj
     * @param q 操作するキュー
     * @param isstock ストックならtrueで、リクエストならfalse
     * @param request リクエスト情報
     */
    getVideoInfoToAddRequest:function (retryobj, q, isstock, request) {
        let f = function (xml, req) {
            if (req.status != 200) {
                if (retryobj) {
                    // リトライ失敗
                    ShowNotice(LoadString('STR_FAILED_TO_GET_VIDEOINFO'));
                    q.shift();
                    if (!isstock) NicoLiveHelper.setupRequestProgress();
                    // 動画情報取得失敗は無視して次へ
                    if (q.length) {
                        NicoLiveHelper.runAddRequest(isstock);
                    }
                    return;
                }
                debugprint("Retry to get video information after 2 sec: " + request.video_id);
                setTimeout(function () {
                    NicoLiveHelper.runAddRequest(isstock, request);
                }, 2000);
                return;
            }

	    let sendmsg = "";    // 応答メッセージ
            let videoinfo = null;
	    try{
		videoinfo = NicoLiveHelper.extractVideoInfo(xml);
		// リク主の情報を追加
		videoinfo.video_id = request.video_id; // 動画IDはリクエスト時のものを使う
		videoinfo.comment_no = request.comment_no;
		videoinfo.request_user_id = request.user_id;
		videoinfo.request_time = GetCurrentTime();
		videoinfo.is_self_request = request.is_self_request;
		videoinfo.product_code = request.product_code;
		if ( videoinfo.comment_no==0 ) {
                    videoinfo.is_casterselection = true;
		}
		
		// リクエストチェックでリクエストを拒否する場合は例外を投げる
                NicoLiveHelper.checkRequest( videoinfo );
                if ( !isstock ) {
		    // リクエスト
		    NicoLiveHelper.request_list.push( videoinfo );
		    NicoLiveRequest.addRequestView( videoinfo ); // 表示追加
		    sendmsg = Config.msg.accept;
                } else {
		    // ストック
		    if( !NicoLiveHelper.hasStock(videoinfo.video_id) ){
			videoinfo.is_casterselection = true;
			NicoLiveHelper.stock_list.push( videoinfo );
			NicoLiveStock.addStockView( videoinfo );
		    }
                }
	    } catch (x) {
		if( videoinfo ){
		    if( isstock ){
			// ストックの場合は拒否する必要のないケースがあるので
			switch( x.errno ){
			case REASON_NOT_ACCEPT:
			case REASON_ALREADY_REQUESTED:
			case REASON_ALREADY_PLAYED:
			    if( NicoLiveHelper.hasStock(videoinfo.video_id) ) break;
			    videoinfo.is_casterselection = true;
			    NicoLiveHelper.stock_list.push( videoinfo );
			    NicoLiveStock.addStockView( videoinfo );
			    break;
			default:
			    NicoLiveHelper.reject_list.push( videoinfo );
			    NicoLiveRejectRequest.addRejectRequest( videoinfo );
			    break;
			}
		    }else{
			// リクエストはリジェクトされた
			NicoLiveHelper.reject_list.push( videoinfo );
			NicoLiveRejectRequest.addRejectRequest( videoinfo );
			debugprint( x.errmsg );
			// 応答メッセージ
			sendmsg = x.errmsg;
		    }
		}else{
		    debugprint(x);
		    ShowNotice( request.video_id+"の動画情報取得に失敗しました" );
		    sendmsg = Config.msg.deleted;

		    videoinfo = new Object();
		    videoinfo.video_id = request.video_id; // 動画IDはリクエスト時のものを使う
		    videoinfo.comment_no = request.comment_no;
		}
	    }

	    if( !isstock && NicoLiveHelper.iscaster && Config.request.autoreply ){
		sendmsg = NicoLiveHelper.replaceMacros(sendmsg, videoinfo);
		if( sendmsg ){
		    let func = function(){
			NicoLiveHelper.postCasterComment( sendmsg, "" );
		    };
		    NicoLiveHelper.clearCasterCommentAndRun( func );
		}
	    }

            q.shift(); // リク処理したので一個削除
            if (!isstock) NicoLiveHelper.setupRequestProgress();

            if (q.length) {
                NicoLiveHelper.runAddRequest(isstock);
            }
        };
        NicoApi.getthumbinfo(request.video_id, f);
    },

    /**
     * 静画の情報を取ってきてリクエストやストックに追加する
     * @param request リクエスト情報
     * @param q リクエストやストックの処理キュー
     * @param isstock ストックならtrue、リクエストならfalse
     */
    getSeigaInfoToAddRequest:function (request, q, isstock) {
        let req = new XMLHttpRequest();
        if (!req) {
            debugprint("failed to create XMLHttpRequest.");
        }
        req.open('GET', "http://ext.seiga.nicovideo.jp/thumb/" + request.video_id);
        req.timeout = 30 * 1000; // 30sec timeout for Gecko 12.0+
        req.onreadystatechange = function () {
            if (req.readyState != 4) return;
            if (req.status != 200) {
                // TODO 静画情報取得に失敗
                debugprint(" getting seiga info failed.");
                q.shift();
                if (!isstock) NicoLiveHelper.setupRequestProgress();
                // 動画情報取得失敗は無視して次へ
                if (q.length) {
                    NicoLiveHelper.runAddRequest(isstock);
                }
                return;
            }
            let text = req.responseText;
            let seigainfo = NicoLiveHelper.extractSeigaInfo(request.video_id, text);
            seigainfo.comment_no = request.comment_no;
            if ( seigainfo.comment_no==0 ) {
                seigainfo.is_casterselection = true;
            }

	    if( Config.allow_seiga ){
		if (!isstock) {
		    // リクエスト
		    if( !NicoLiveHelper.isAlreadyRequested(seigainfo.video_id) ){
			NicoLiveHelper.request_list.push(seigainfo);
			NicoLiveRequest.addRequestView(seigainfo);
		    }
		} else {
		    // ストック
		    if( !NicoLiveHelper.hasStock(seigainfo.video_id) ){
			NicoLiveHelper.stock_list.push(seigainfo);
			NicoLiveStock.addStockView(seigainfo);
		    }
		}
	    }else{
		// 静画のリクエスト受け付けはなし
	    }
            q.shift(); // リク処理したので一個削除
            if (!isstock) NicoLiveHelper.setupRequestProgress();

            if (q.length) {
                NicoLiveHelper.runAddRequest(isstock);
            }
        };
        req.send('');
    },

    /**
     * リクエストやストックに動画を追加する
     * @param isstock ストックならtrue
     */
    runAddRequest: function( isstock, retryobj ){
	let request;
	let q = isstock ? this.stock_q : this.request_q;
	if( retryobj ){
	    request = retryobj;
	}else{
	    if( q.length<=0 ) return;
	    request = q[0];
	}
	if( request.video_id.indexOf("im")==0 ){
	    this.getSeigaInfoToAddRequest(request, q, isstock);
        }else{
            this.getVideoInfoToAddRequest(retryobj, q, isstock, request);
        }
    },

    /**
     * リクエストに追加する.
     * @param video_id 動画IDや静画ID
     * @param comment_no リク主のコメント番号
     * @param user_id リク主のユーザーID
     * @param is_self_request 自貼りかどうか
     * @param code JWIDの作品コード
     */
    addRequest: function(video_id, comment_no, user_id, is_self_request, code ){
	if( !video_id ) return;
	if( video_id.length < 3 ) return;

	let n = this.request_q.length;

	let req = new Object();
	req.video_id = video_id;
	req.comment_no = comment_no;
	req.user_id = user_id;
	req.is_self_request = is_self_request;
	req.product_code = code; // JWIDの作品コード

	this.request_q.push( req );
	this.setupRequestProgress();	

	if( n==0 ){
	    this.runAddRequest( false ); // isstock=false
	}
    },

    addStock: function(video_id){
	if( !video_id ) return;
	if( video_id.length < 3 ) return;

	let n = this.stock_q.length;

	let req = new Object();
	req.video_id = video_id;
	req.comment_no = 0;
	req.user_id = '0';
	req.is_self_request = false;

	this.stock_q.push( req );

	if( n==0 ){
	    this.runAddRequest( true ); // isstock=true
	}
    },
    
    /**
     * 動画情報をリクエストに直接追加する.
     * @param videoinfo 動画情報
     */
    addRequestDirect: function(videoinfo){
	if( !this.isAlreadyRequested( videoinfo.video_id ) ){
	    NicoLiveHelper.request_list.push( videoinfo );
	    NicoLiveRequest.addRequestView( videoinfo ); // 表示追加
	}else{
	    ShowNotice(videoinfo.video_id+"はすでにリクエストされています");
	}
    },
    /**
     * 動画情報をストックに直接追加する.
     * @param videoinfo 動画情報
     */
    addStockDirect: function(videoinfo){
	if( !this.hasStock( videoinfo.video_id ) ){
	    videoinfo.is_casterselection = true;
	    NicoLiveHelper.stock_list.push( videoinfo );
	    NicoLiveStock.addStockView( videoinfo );
	}else{
	    ShowNotice( videoinfo.video_id+"はすでにストックに存在しています" );
	}
    },

    /**
     * リジェクトされた動画を取得する.
     * @param n インデックス(範囲チェックなし)
     */
    getRejectedVideo: function(n){
	return this.reject_list[n];
    },
    /**
     * 再生済み動画を取得する.
     * @param n インデックス(範囲チェックなし)
     */
    getPlayedVideo: function(n){
	return this.playlist_list[n];
    },

    /**
     * リクエストを全削除する.
     * 画面の更新あり
     */
    clearAllRequest: function(){
	this.request_list = new Array();
	NicoLiveRequest.updateView( this.request_list );
    },

    /**
     * 再生済みのリクエストを削除する.
     */
    clearPlayedRequest: function(){
	let newstock = new Array();
	for( let i=0,item; item=this.request_list[i]; i++ ){
	    if( !this.isAlreadyPlayed( item.video_id ) ) newstock.push(item);
	}
	this.request_list = newstock;
	NicoLiveRequest.updateView( this.request_list );

	this.saveRequest();
    },

    /**
     * ストックを全削除する.
     * 画面の更新あり
     */
    clearAllStock: function(){
	this.stock_list = new Array();
	NicoLiveStock.updateView( this.stock_list );
    },

    /**
     * 再生済みのストックを削除する.
     */
    clearPlayedStock: function(){
	let newstock = new Array();
	for( let i=0,item; item=this.stock_list[i]; i++ ){
	    if( !item.is_played ) newstock.push(item);
	}
	this.stock_list = newstock;
	NicoLiveStock.updateView( this.stock_list );

	this.saveStock();
    },

    /**
     * リジェクト動画一覧をクリアする.
     * 画面の更新あり
     */
    clearRejectList: function(){
	this.reject_list = new Array();
	NicoLiveRejectRequest.updateView( this.reject_list );
    },

    /**
     * プレイリストを全消去する.
     */
    clearPlayList: function(){
	$('playlist-textbox').value = '';
	this.playlist_list = new Array();
	NicoLiveHistory.updateView( this.playlist_list );
	this.savePlaylist();
    },

    /**
     * メモリ上から動画情報を探して返す.
     * @param video_id 動画ID
     */
    findVideoInfoFromMemory: function(video_id){
	let i,item;
	for(i=0; item=this.request_list[i]; i++){
	    if( item.video_id==video_id ) return item;
	}
	for(i=0; item=this.stock_list[i]; i++){
	    if( item.video_id==video_id ) return item;
	}
	for(i=0; item=this.playlist_list[i]; i++){
	    if( item.video_id==video_id ) return item;
	}
	return null;
    },

    /**
     * 動画情報を送信開始する.
     * @param videoinfo 動画情報(現在は未使用)
     */
    sendVideoInfo: function(videoinfo){
	let func = function(){
	    clearInterval( NicoLiveHelper._sendvideoinfo_timer );

	    NicoLiveHelper._sendvideoinfo_counter = 0;
	    NicoLiveHelper._sendvideoinfo_timer = setInterval(
		function(){
		    NicoLiveHelper._sendVideoInfo(videoinfo);
		}, Config.videoinfo_interval*1000 );
	    NicoLiveHelper._sendVideoInfo(videoinfo);
	};
	this.clearCasterCommentAndRun(func);
    },

    /**
     * 動画情報を送信する.
     * @param videoinfo 動画情報(現在は未使用)
     */
    _sendVideoInfo: function(videoinfo){
	let n = this._sendvideoinfo_counter++;
	let str = Config.videoinfo[n].comment;
	let cmd = Config.videoinfo[n].command || "";
	if( !str ){
	    this.commentstate = COMMENT_STATE_MOVIEINFO_DONE;
	    clearInterval( this._sendvideoinfo_timer );
	    return;
	}

	switch( Config.videoinfo_type ){
	case 1: // /perm
	    str = "/perm "+str;
	    break;
	case 2: // hidden
	    cmd += " hidden";
	    break;
	case 3: // /perm + hidden
	    str = "/perm "+str;
	    cmd += " hidden";
	    break;
	case 0: // default
	default:
	    break;
	}

	this.commentstate = COMMENT_STATE_MOVIEINFO_BEGIN;
	this.postCasterComment( str, cmd, '', COMMENT_MSG_TYPE_MOVIEINFO );
    },

    /**
     * 15秒後に動画情報再送信を行う.
     */
    setupRevertVideoInfo:function(){
	clearInterval( this._revertcommenttimer );
	this._revertcommenttimer = setInterval(
	    function(){
		NicoLiveHelper.revertVideoInfo();
		clearInterval( NicoLiveHelper._revertcommenttimer );
	    }, 15*1000 );
    },

    /**
     *  動画情報を復元する.
     */
    revertVideoInfo:function(){
	// 動画情報送信が終わっていないときは復元不要だし.
	if( this.commentstate!=COMMENT_STATE_MOVIEINFO_DONE ) return;
	let n = Config.videoinfo_revert_line;
	if(n<=0) return;
	let sendstr = Config.videoinfo[n-1].comment;
	if(!sendstr) return;
	let cmd = Config.videoinfo[n-1].command;
	if(!cmd) cmd = "";
	switch( Config.videoinfo_type ){
	case 1: // /perm
	    sendstr = "/perm "+sendstr;
	    break;
	case 2: // hidden
	    cmd += " hidden";
	    break;
	case 3: // /perm + hidden
	    sendstr = "/perm "+sendstr;
	    cmd += " hidden";
	    break;
	case 0: // default
	default:
	    break;
	}
	// revertMusicInfoが直接呼ばれた場合タイマー動作は不要になるので.
	clearInterval( this._revertcommenttimer );
	let ismovieinfo = COMMENT_MSG_TYPE_MOVIEINFO;
	this.postCasterComment( sendstr, cmd, "", ismovieinfo );
    },

    /**
     * 現在の再生動画の情報を取得して再生状態を設定する.
     * あらかじめtargetのplay_beginをセットしておくこと.
     * @param video_id 動画ID
     * @param target MAIN or SUB
     * @param retry リトライフラグ
     */
    setCurrentPlayVideo: function(video_id, target, retry){
        let f = function (xml, req) {
            if (req.status != 200) {
                if (retry) {
                    // リトライ失敗
                    return;
                }
		NicoLiveHelper.setCurrentPlayVideo( video_id, target, true ); // retry=true
                return;
            }

	    try{
		let videoinfo = NicoLiveHelper.extractVideoInfo(xml);
		NicoLiveHelper.play_status[ target ].videoinfo = videoinfo;
		NicoLiveHelper.play_status[ target ].play_end =
		    NicoLiveHelper.play_status[target].play_begin + videoinfo.length_ms/1000+1;
		NicoLiveHelper.addPlaylist( videoinfo );
	    } catch (x) {
                debugprint(x);
	    }
        };
        NicoApi.getthumbinfo(video_id, f);
    },

    /**
     * 放送終了時の処理.
     */
    finishBroadcasting: function(){
	this._donotshowdisconnectalert = true;
	this.stopTimers();
	this.closeAllConnection();

	PlayAlertSound();
	let msg = this.liveinfo.request_id+' '+this.liveinfo.title+' は終了しました';
	syslog(msg);
	ShowNotice(msg,true);
    },

    /** コントロールパネルの再生状態の更新処理
     * @param text コメントテキスト
     */
    processPlayState:function(text){
	let main = $('main-state-soundonly');
	let sub = $('sub-state-soundonly');

	if( text.match(/^\/play(sound)*\s*smile:.*(main|sub).*\"(.*)\"$/) ){
	    // 動画の再生
	    let is_soundonly = RegExp.$1;
	    let target = RegExp.$2;
	    let title = RegExp.$3;
	    let b = is_soundonly ? true:false;
	    if( target=='sub' ){
		let subtitle = $('sub-video-title');
		sub.checked = b;
		subtitle.value = title;
		subtitle.setAttribute('tooltiptext',title);
	    }else{
		let maintitle = $('main-video-title');
		main.checked = b;
		maintitle.value = title;
		maintitle.setAttribute('tooltiptext',title);
	    }
	    return;
	}

	if( text.match(/^\/swap/) ){
	    // メイン・サブ切り替え
	    let tmp = main.checked;
	    main.checked = sub.checked;
	    sub.checked = tmp;

	    let maintitle = $('main-video-title');
	    let subtitle = $('sub-video-title');
	    tmp = maintitle.value;
	    maintitle.value = subtitle.value;
	    subtitle.value = tmp;

	    maintitle.setAttribute('tooltiptext', maintitle.value );
	    subtitle.setAttribute('tooltiptext', subtitle.value );

	    tmp = this.play_status[ MAIN ];
	    this.play_status[ MAIN ] = this.play_status[ SUB ];
	    this.play_status[ SUB ] = tmp;
	}

	if( text.match(/^\/stop\s*(sub)*/) ){
	    let target = RegExp.$1;
	    if( target=='sub' ){
		let subtitle = $('sub-video-title');
		subtitle.value = "";
		subtitle.setAttribute('tooltiptext',"");
		this.play_status[ SUB ].videoinfo = null;
	    }else{
		let maintitle = $('main-video-title');
		maintitle.value = "";
		maintitle.setAttribute('tooltiptext',"");
		this.play_status[ MAIN ].videoinfo = null;
	    }
	    return;
	}

	if( text.match(/^\/play rtmp/) ){
	    // カメラ映像
	    main.checked = false;
	    $('main-video-title').value = "";

	    // カメラのときは動画情報は何もなしで
	    this.play_status[MAIN] = new Object();
	    this.play_status[MAIN].videoinfo = null;
	    this.play_status[MAIN].play_begin = 0;
	    this.play_status[MAIN].play_end = 0;
	    return;
	}
	if( text.match(/^\/soundonly (on|off)\s*(.*)/) ){
	    // soundonlyコマンド
	    let onoff = RegExp.$1;
	    let target = RegExp.$2;
	    let b = onoff=='on'?true:false;
	    if( target=='sub' ){
		sub.checked = b;
	    }else{
		main.checked = b;
	    }
	    return;
	}
    },

    /**
     * 運営コメント系を処理する.
     */
    processCastersComment: function(chat){
	if( chat.text.match(/^\/play(sound)*\s*smile:(((sm|nm|ze|so)\d+)|\d+)\s*(main|sub)\s*\"(.*)\"$/) ) {
	    let video_id = RegExp.$2;
	    let target = RegExp.$5;
	    let title = RegExp.$6;
	    syslog(title+"の再生を開始します。");

	    target = target=="main"?MAIN:SUB;
	    let current = this.getCurrentVideoInfo( target );
	    if( current && (current.video_id==video_id) ){
		// 再生ボタンから再生された動画
		this.play_status[target].play_begin = GetCurrentTime();
		this.play_status[target].play_end = this.play_status[target].play_begin + current.length_ms/1000 + 1;
		this.addPlaylistText( current );
		this.sendVideoInfo( current );
		this.setupPlayNext( target, current.length_ms/1000 );
	    }else{
		this.play_status[ target ].play_begin = GetCurrentTime();
		this.setCurrentPlayVideo(video_id, target);
	    }
	}
	if( chat.text.match(/^\/play\s*seiga:(\d+)\s*(main|sub)/) ){
	    
	}

	if( chat.text.match(/^\/disconnect/) ){
	    this.finishBroadcasting();
	    return;
	}

	if( chat.text.match(/^\/prepare\s*(.*)/) ){
	    let video_id = RegExp.$1;
	    syslog(video_id+"を読み込み開始します。");
	    return;
	}
	if( chat.text.match(/^\/info\s*\d\s*"(.*)"$/) ){
	    let info = RegExp.$1;
	    syslog(info);
	    return;
	}
	if( chat.text_notag.match(/^\/koukoku\s*show\d*\s*(.*)$/) ){
	    let info = RegExp.$1;
	    syslog(info);
	    return;
	}

	if( chat.text.indexOf("/perm")==0 && chat.mail.indexOf("hidden")!=-1 ){
	    NicoLiveHelper.commentViewState = COMMENT_VIEW_HIDDEN_PERM;
	    clearInterval(NicoLiveHelper._commentstatetimer);
	    return;
	}
	if( chat.mail.indexOf("hidden")!=-1 ){
	    // hiddenだけの場合は、15秒間だけHIDDEN_PERM.
	    NicoLiveHelper.commentViewState = COMMENT_VIEW_HIDDEN_PERM;
	    clearInterval(NicoLiveHelper._commentstatetimer);
	    NicoLiveHelper._commentstatetimer = setInterval(
		function(){
		    NicoLiveHelper.commentViewState = COMMENT_VIEW_NORMAL;
		    clearInterval(NicoLiveHelper._commentstatetimer);
		}, 15*1000 );
	}
	if( chat.text.indexOf("/cls")==0 || chat.text.indexOf("/clear")==0 ){
	    clearInterval(NicoLiveHelper._sendclstimer);
	    NicoLiveHelper.commentViewState = COMMENT_VIEW_NORMAL;
	    if( 'function'==typeof NicoLiveHelper.postclsfunc ){
		NicoLiveHelper.postclsfunc();
		NicoLiveHelper.postclsfunc = null;
	    }
	}
    },

    /**
     * 視聴者コメントを処理する.
     */
    processListenersComment: function(chat){
	if( chat.text.match(/((sm|nm|so|im)\d+)/) ){
	    let video_id = RegExp.$1;
	    let is_self_request = chat.text.match(/[^他](貼|張)|自|関/);
	    let code = "";
	    try{
		// TODO 作品コードの処理
		code = chat.text.match(/(...[-+=/]....[-+=/].)/)[1];
		code = code.replace(/[-+=/]/g,"-"); // JWID用作品コード.
		NicoLiveHelper.product_code["_"+video_id] = code;
	    } catch (x) {
	    }
	    this.addRequest( video_id, chat.comment_no, chat.user_id, is_self_request, code );
	    return;
	}
	if( chat.text.match(/(\d{10})/) ){
	    let video_id = RegExp.$1;
	    if( video_id=="8888888888" ) return;
	    let is_self_request = chat.text.match(/[^他](貼|張)|自|関/);
	    let code = "";
	    this.addRequest( video_id, chat.comment_no, chat.user_id, is_self_request, code );
	    return;
	}

	if( chat.text.match(/\/ver$/) ){
	    let str = "NicoLive Helper Advance version "+GetAddonVersion();
	    this.postCasterComment( str, "" );
	}
    },

    /**
     * コメントを処理する本体.
     */
    processComment: function(chat, target_room){
	if( target_room==ARENA ){
	    // アリーナ席はコメントログは取る
	    NicoLiveComment.addCommentLog( chat, target_room );
	}

	if( this.currentRoom!=target_room ){
	    return;
	}
	NicoLiveComment.addComment( chat, target_room );

	switch(chat.premium){
	case 2: // チャンネル生放送の場合、こちらの場合もあり。/infoコマンドなどもココ
	case 3: // 運営コメント
	    // 接続時(getplayerstatus)に取得した古いコメントに反応しない
	    if( chat.date < NicoLiveHelper.connecttime || NicoLiveHelper._timeshift ) return;

	    // 再生ステータスを更新
	    this.processPlayState(chat.text);
	    this.processCastersComment(chat);
	    break;

	default:
	    // 視聴者コメント
	    // 接続時(getplayerstatus)に取得した古いコメントに反応しない
	    if( chat.date < NicoLiveHelper.connecttime || NicoLiveHelper._timeshift ) return;

	    this.processListenersComment(chat);
	    break;
	}
    },

    /**
     * コメントのXMLからJavascriptのオブジェクトに変換する.
     * @param xmlchat コメントのXML
     */
    extractComment: function(xmlchat){
	let chat = new Object();
	chat.text = restorehtmlspecialchars( xmlchat.textContent );
	chat.date      = xmlchat.getAttribute('date');
	chat.premium   = xmlchat.getAttribute('premium');
	chat.user_id   = xmlchat.getAttribute('user_id');
	chat.no        = xmlchat.getAttribute('no');
	chat.anonymity = xmlchat.getAttribute('anonymity');
	chat.mail      = xmlchat.getAttribute('mail') || "";
	chat.name      = xmlchat.getAttribute('name') || "";
	chat.locale    = xmlchat.getAttribute('locale') || "";
	chat.origin    = xmlchat.getAttribute('origin') || "";
	chat.score     = xmlchat.getAttribute('score'); // スコアは負の数

	chat.date      = chat.date && parseInt(chat.date) || 0;
	chat.premium   = chat.premium && parseInt(chat.premium) || 0;
	chat.user_id   = chat.user_id || "0";
	chat.anonymity = chat.anonymity && parseInt(chat.anonymity) || 0;
	chat.no        = chat.no && parseInt(chat.no) || 0;
	chat.comment_no = chat.no;
	// 強・中・弱の閾値は、-1000 〜 -4800 〜 -10000 〜 負の最大数
	chat.score      = chat.score && parseInt(chat.score) || 0;

	if( chat.premium==3 || chat.premium==2 ){
	    chat.text_notag = chat.text.replace(/<.*?>/g,"");
	}else{
	    chat.text_notag = chat.text;
	}

	this.last_res = chat.no;
	return chat;
    },

    /**
     * コメントサーバーから受信した1行を処理する.
     * @param line 1行分のデータ
     * @param target_room どこのルームのコメントか(ARENA, STAND_A,...)
     */
    processLine: function(line, target_room){
	this.lastReceived[ target_room ] = GetCurrentTime();

	if(line.match(/^<chat\s+.*>/)){
	    //debugprint(line);
	    let parser = new DOMParser();
	    let dom = parser.parseFromString(line,"text/xml");
	    let chat = this.extractComment(dom.getElementsByTagName('chat')[0]);
	    this.processComment( chat, target_room );
	    return;
	}

	if( line.match(/<chat_result.*status=\"(\d+)\".*\/>/) ){
	    let result = RegExp.$1;
	    let r = parseInt( result );
	    debugprint("chat result="+r);
	    switch(r){
	    case 0: // success
		this.previouschat = this.chatbuffer;
		break;
	    case 8:
	    case 4: // need getpostkey
		this.getpostkey();
		break;
	    case 1: // リスナーコメ投稿規制.
		ShowNotice(LoadString('STR_FAILED_TO_COMMENT_BY_CONTROL'));
		break;
	    default:
		break;
	    }
	    return;
	}

	// リスナー接続時にしかリスナーコメントしないので、
	// ARENA(初期に入るコメントサーバー)の分しか扱わない
	if( target_room!=ARENA ) return;
	// 16進数表すキーワードってなんだったっけ….
	if( line.match(/<thread.*ticket=\"([0-9a-fA-Fx]*)\".*\/>/) ){
	    //debugprint(line);
	    let newticket = RegExp.$1;
	    if( this.ticket != newticket ){
		syslog("コメントサーバーに接続しました。");
		ShowNotice("コメントサーバに接続しました");
	    }
	    this.ticket = newticket;
	}
	if( line.match(/<thread.*last_res=\"([0-9a-fA-Fx]*)\".*\/>/) ){
	    let last_res = RegExp.$1;
	    this.last_res = parseInt( last_res );
	    //debugprint('last_res='+this.last_res);
	}
    },

    /**
     * 部屋を移動する.
     * @param target_room 移動先(ARENA, STAND_A, STAND_B, STAND_C)
     */
    changeCommentRoom: function( target_room ){
	if( this.isOffline() ) return;

	let old_target = this.currentRoom;
	if( old_target==target_room ) return;

	if( old_target!=ARENA ){
	    this.closeConnection( old_target );
	}
	if( target_room!=ARENA ){
	    this.connectSelectedCommentServer( target_room );
	}

	this.currentRoom = target_room;

	NicoLiveComment.clear();
	if( target_room==ARENA ){
	    NicoLiveComment.revertArenaComment();
	}
    },

    /**
     * コメントサーバーに接続する.
     * @param addr アドレス
     * @param port ポート番号
     * @param thread コメントのスレッド番号
     * @param dataListener データリスナ
     * @param lines 取得する過去ログの行数
     */
    connectCommentServer: function(addr, port, thread, dataListener, lines){
	debugprint("Connecting "+addr+":"+port+" ...");
	if( !thread ){
	    debugprint("存在しないスレッドです");
	    return null;
	}

	let iostream = TcpLib.connectTcpServer( addr, port, dataListener );
	iostream.thread = thread;

	let str = "<thread thread=\""+thread+"\" res_from=\""+lines+"\" version=\"20061206\"/>\0";
	iostream.ostream.writeString(str);
	return iostream;
    },

    /**
     * アリーナ以外の任意のコメントサーバーに接続する.
     * @param target_room 接続先の部屋
     */
    connectSelectedCommentServer: function( target_room ){
	if( target_room==ARENA ) return;
	let dataListener = {
	    line: "",
	    onStartRequest: function(request, context){},
	    onStopRequest: function(request, context, status){
		try{
		    if( !NicoLiveHelper._donotshowdisconnectalert ){
			//PlayAlertSound();
			//ShowNotice( ROOM_NAME[target_room]+' から切断されました。', true );
			syslog( ROOM_NAME[target_room]+' から切断されました。' );
		    }
		    NicoLiveHelper.closeConnection( target_room );
		} catch (x) {}
	    },
	    onDataAvailable: function(request, context, inputStream, offset, count) {
		let lineData = {};
		let r;
		while(1){
		    try{
			r = NicoLiveHelper.connectioninfo[ target_room ].istream.readString(1,lineData);
		    } catch (x) { debugprint(x); return; }
		    if( !r ){ break; }
		    if( lineData.value=="\0" ){
			try{
			    NicoLiveHelper.processLine( this.line, NicoLiveHelper.currentRoom );
			} catch (x) {
			    debugprint(x);
			}
			this.line = "";
			continue;
		    }
		    this.line += lineData.value;
		}
	    }
	};

	let lines;
	try{
	    // コメントのバックログ取得数(アリーナ席以外は50固定でいいかな)
	    lines = -50; //Config.comment.backlogs * -1;
	} catch (x) {
	    lines = -50;
	}

	this.connecttime = GetCurrentTime();

	this.currentRoom = target_room;
	let tmp = this.connectCommentServer(
	    this.serverinfo.addr,
	    this.serverinfo.port + parseInt(target_room),
	    this.serverinfo.tid[ target_room ],
	    dataListener,
	    lines
	);
	this.connectioninfo[ target_room ] = tmp;
    },

    /**
     * コメントサーバー(アリーナ)接続前処理
     */
    preprocessConnectServer: function(request_id){
	let dataListener = {
	    line: "",
	    onStartRequest: function(request, context){},
	    onStopRequest: function(request, context, status){
		try{
		    if( !NicoLiveHelper._donotshowdisconnectalert ){
			let musictime = $('statusbar-music-name');
			musictime.label="コメントサーバから切断されました。";
			PlayAlertSound();
			ShowNotice('コメントサーバから切断されました。',true);
			setTimeout( function(){
					AlertPrompt('コメントサーバから切断されました。(code='+status+')',
						    NicoLiveHelper.liveinfo.request_id);
				    }, 5000 );
		    }
		    NicoLiveHelper.closeAllConnection();
		} catch (x) {}
	    },
	    onDataAvailable: function(request, context, inputStream, offset, count) {
		let lineData = {};
		let r;
		while(1){
		    try{
			r = NicoLiveHelper.connectioninfo[ARENA].istream.readString(1,lineData);
		    } catch (x) { debugprint(x); return; }
		    if( !r ){ break; }
		    if( lineData.value=="\0" ){
			try{
			    NicoLiveHelper.processLine( this.line, ARENA );
			} catch (x) {
			    debugprint(x);
			}
			this.line = "";
			continue;
		    }
		    this.line += lineData.value;
		}
	    }
	};

	let lines;
	try{
	    // コメントのバックログ取得数
	    lines = Config.comment.backlogs * -1;
	} catch (x) {
	    lines = -100;
	}

	this.initLiveUpdateTimers();

	this.currentRoom = ARENA;

	if( !this.iscaster ){
	    let tmp = this.connectCommentServer(
		this.serverinfo.addr,
		this.serverinfo.port,
		this.serverinfo.thread,
		dataListener,
		lines
	    );
	    this.connectioninfo[ARENA] = tmp;

	    $('id-select-comment-room').disabled = true;
	    // リスナーの場合はここで終わり
	    return;
	}

	let f = function(xml,req){
	    if( req.readyState==4 && req.status==200 ){
		let publishstatus = req.responseXML;
		NicoLiveHelper.post_token = publishstatus.getElementsByTagName('token')[0].textContent;
		NicoLiveHelper.liveinfo.start_time = parseInt(publishstatus.getElementsByTagName('start_time')[0].textContent);
		let tmp = parseInt(publishstatus.getElementsByTagName('end_time')[0].textContent);
		if( GetCurrentTime() <= tmp ){
		    // 取得した終了時刻がより現在より未来指していたら更新.
		    NicoLiveHelper.liveinfo.end_time = tmp;
		}else{
		    // ロスタイム突入
		}
		// TODO exclude(排他)は放送開始しているかどうかのフラグ
		//NicoLiveHelper._exclude = parseInt(publishstatus.getElementsByTagName('exclude')[0].textContent);
		//debugprint('exclude='+NicoLiveHelper._exclude);
		debugprint('token='+NicoLiveHelper.post_token);
		debugprint('starttime='+NicoLiveHelper.liveinfo.start_time);
		debugprint('endtime='+NicoLiveHelper.liveinfo.end_time);

		tmp = NicoLiveHelper.connectCommentServer(
		    NicoLiveHelper.serverinfo.addr,
		    NicoLiveHelper.serverinfo.port,
		    NicoLiveHelper.serverinfo.thread,
		    dataListener,
		    lines
		);
		NicoLiveHelper.connectioninfo[ARENA] = tmp;
	    }
	};
	NicoApi.getpublishstatus( request_id, f );
    },


    /**
     * 接続を切断する.
     * @param target 切断したいコメントサーバー
     */
    closeConnection: function( target ){
	let item = this.connectioninfo[ parseInt(target) ];
	if( item ){
	    try{
		item.ostream.close();
	    } catch (x) {
		debugprint(x);
	    }
	    try{
		item.istream.close();
	    } catch (x) {
		debugprint(x);
	    }
	}
	this.connectioninfo[ target ] = null;
    },

    /**
     * 全ての接続を切断する.
     */
    closeAllConnection: function(){
	// 0:アリーナ 1:立ち見A 2:立ち見B 3:立ち見C
	for(let i=0; i<4; i++){
	    this.closeConnection( i );
	}
    },


    /**
     * 生放送で使用するタイマーを初期化する
     */
    initLiveUpdateTimers: function(){
	debugprint("initialize timers...");
	clearInterval( this._update_timer );
	clearInterval( this._keep_timer );
	clearInterval( this._heartbeat_timer );

	this._update_timer = setInterval( function(){
					      NicoLiveHelper.update();
					  }, 1000 );
	this._keep_timer = setInterval( function(){
					    NicoLiveHelper.keepConnection();
					}, 3*60*1000 );
	this._heartbeat_timer = setInterval( function(){
						 NicoLiveHelper.heartbeat();
					     }, 1*60*1000);
    },

    /**
     * getplayerstatus APIのXMLをJavascriptオブジェクトに展開する.
     */
    extractGetPlayerStatus:function(xml){
	let live_info = new LiveInfo();
	try{
	    live_info.request_id = GetXmlText(xml, "/getplayerstatus/stream/id");
	    live_info.title = GetXmlText(xml,"/getplayerstatus/stream/title");
	    live_info.description = GetXmlText(xml,"/getplayerstatus/stream/description");
	    live_info.provider_type = GetXmlText(xml,"/getplayerstatus/stream/provider_type");
	    live_info.default_community = GetXmlText(xml,"/getplayerstatus/stream/default_community");
	    live_info.international = parseInt(GetXmlText(xml,"/getplayerstatus/stream/international"));
	    live_info.is_owner = GetXmlText(xml,"/getplayerstatus/stream/is_owner")!='0';
	    live_info.owner_id = GetXmlText(xml,"/getplayerstatus/stream/owner_id");
	    live_info.owner_name = GetXmlText(xml,"/getplayerstatus/stream/owner_name");
	    live_info.is_reserved = GetXmlText(xml,"/getplayerstatus/stream/is_reserved")!='0';
	    
	    live_info.base_time = parseInt( GetXmlText(xml,"/getplayerstatus/stream/base_time") );
	    live_info.open_time = parseInt( GetXmlText(xml,"/getplayerstatus/stream/open_time") );
	    live_info.start_time = parseInt( GetXmlText(xml,"/getplayerstatus/stream/start_time") );
	    live_info.end_time = parseInt( GetXmlText(xml,"/getplayerstatus/stream/end_time") );
	    
	    live_info.twitter_tag = GetXmlText(xml,"/getplayerstatus/stream/twitter_tag");
	    live_info.nd_token = GetXmlText(xml,"/getplayerstatus/stream/nd_token");
	    live_info.is_priority_prefecture = GetXmlText(xml,"/getplayerstatus/stream/is_priority_prefecture");
	} catch (x) {
	    debugprint(x);
	}

	let user_info = new UserInfo();
	try{
	    user_info.user_id = GetXmlText(xml,"/getplayerstatus/user/user_id");
	    user_info.nickname = GetXmlText(xml,"/getplayerstatus/user/nickname");
	    user_info.is_premium = parseInt( GetXmlText(xml,"/getplayerstatus/user/is_premium") );
	    user_info.userAge = GetXmlText(xml,"/getplayerstatus/user/userAge");
	    user_info.userSex = GetXmlText(xml,"/getplayerstatus/user/userSex");
	    user_info.userDomain = GetXmlText(xml,"/getplayerstatus/user/userDomain");
	    user_info.userPrefecture = GetXmlText(xml,"/getplayerstatus/user/userPrefecture");
	    user_info.userLanguage = GetXmlText(xml,"/getplayerstatus/user/userLanguage");
	    user_info.room_label = GetXmlText(xml,"/getplayerstatus/user/room_label");
	    user_info.room_seetno = GetXmlText(xml,"/getplayerstatus/user/room_seetno");
	    user_info.is_join = GetXmlText(xml,"/getplayerstatus/user/is_join")!='0';
	    user_info.twitter_info.status = GetXmlText(xml,"/getplayerstatus/user/twitter_info/status");
	    user_info.twitter_info.screen_name = GetXmlText(xml,"/getplayerstatus/user/twitter_info/screen_name");
	    user_info.twitter_info.followers_count = GetXmlText(xml,"/getplayerstatus/user/twitter_info/followers_count");
	    user_info.twitter_info.is_vip = GetXmlText(xml,"/getplayerstatus/user/twitter_info/is_vip")!='0';
	    user_info.twitter_info.profile_image_url = GetXmlText(xml,"/getplayerstatus/user/twitter_info/profile_image_url");
	    user_info.twitter_info.after_auth = GetXmlText(xml,"/getplayerstatus/user/twitter_info/after_auth");
	    user_info.twitter_info.tweet_token = GetXmlText(xml,"/getplayerstatus/user/twitter_info/tweet_token");
	} catch (x) {
	    debugprint(x);
	}

	let server_info = new ServerInfo();
	try{
	    server_info.addr = GetXmlText(xml,"/getplayerstatus/ms/addr");
	    server_info.port = parseInt( GetXmlText(xml,"/getplayerstatus/ms/port") );
	    server_info.thread = GetXmlText(xml,"/getplayerstatus/ms/thread");
	    // tidが1増えるたびに接続先ポートが1増える(アリーナ、立見席A,B,C)
	    let tmp = evaluateXPath(xml,"/getplayerstatus/tid_list/tid/text()");
	    for( let i=0,item; item=tmp[i]; i++){
		server_info.tid.push( item.textContent );
	    }
	} catch (x) {
	    debugprint(x);
	}

	let twitter_info = new TwitterInfo();
	try{
	    twitter_info.live_enabled = GetXmlText(xml,"/getplayerstatus/twitter/live_enabled")!='0';
	    twitter_info.vip_mode_count = parseInt( GetXmlText(xml,"/getplayerstatus/twitter/vip_mode_count") );
	    twitter_info.live_api_url = GetXmlText(xml,"/getplayerstatus/twitter/live_api_url");
	} catch (x) {
	    debugprint(x);
	}

	this.liveinfo = live_info;
        this.userinfo = user_info;
	this.serverinfo = server_info;
	this.twitterinfo = twitter_info;
    },

    /**
     * 放送を開始する(手順その2)
     * @param token 主コメのトークン
     */
    beginLive:function(token){
	if( !this.iscaster ) return;

	let f = function(xml,req){
	    if( req.readyState==4 ){
		if( req.status==200 ){
		    let confstatus = req.responseXML.getElementsByTagName('response_configurestream')[0];
		    if( confstatus.getAttribute('status')=='ok' ){
			// 配信中ステータスへ.
			NicoLiveHelper.setLiveStartingStatus(token);
		    }else{
			debugalert(LoadString('STR_FAILED_TO_START_BROADCASTING'));
		    }
		}else{
		    debugalert(LoadString('STR_FAILED_TO_START_BROADCASTING'));
		}
	    }
	};
	NicoApi.configurestream( this.liveinfo.request_id, "key=hq&value=0&version=2&token="+token, f );
    },

    /**
     * 配信開始ステータスに変える.
     * @param token 主コメのトークン
     */
    setLiveStartingStatus:function(token){
	if( !this.iscaster ) return;
	// exclude=0ってパラメタだから
	// 視聴者を排除(exclude)するパラメタをOFF(0)にするって意味だろうな.
	// 新バージョンは version=2 を渡して、開演、終了時刻を知る必要がある.
	// 配信開始前にこれがある
	// 外部配信 http://watch.live.nicovideo.jp/api/configurestream/lv25214688?token=39cf24389dfda675eb2ba996934627794c86fd9b&key=hq&value=1&version=2
	// 簡易配信 http://watch.live.nicovideo.jp/api/configurestream/lv25214688?token=39cf24389dfda675eb2ba996934627794c86fd9b&key=hq&value=0&version=2
	// 配信終了 http://watch.live.nicovideo.jp/api/configurestream/lv25353436?token=8c1fdb8790312869e872ae6617a3ddf43de8eb5b&version=2&key=end%5Fnow

	let f = function(xml,req){
	    if( req.readyState==4 ){
		if( req.status==200 ){
		    let confstatus = req.responseXML.getElementsByTagName('response_configurestream')[0];
		    if( confstatus.getAttribute('status')=='ok' ){
			// TODO 放送開始をツイート
			/*
			if( NicoLivePreference.twitter.when_beginlive ){
			    let msg = NicoLiveHelper.replaceMacros(NicoLivePreference.twitter.beginlive, this.musicinfo);
			    NicoLiveTweet.tweet(msg);
			}
			 */
			try{
			    NicoLiveHelper.liveinfo.start_time = parseInt(req.responseXML.getElementsByTagName('start_time')[0].textContent);
			    NicoLiveHelper.liveinfo.end_time = parseInt(req.responseXML.getElementsByTagName('end_time')[0].textContent);
			} catch (x) {
			    debugprint(x);
			}
		    }else{
			debugalert(LoadString('STR_FAILED_TO_START_BROADCASTING'));
		    }
		}else{
		    debugalert(LoadString('STR_FAILED_TO_START_BROADCASTING'));
		}
	    }
	};
	NicoApi.configurestream( this.liveinfo.request_id, "key=exclude&value=0&version=2&token="+token, f );
    },

    /**
     * 配信開始を行う.
     */
    startBroadcasting:function(){
	// getpublishstatus + configurestream
	let request_id = this.liveinfo.request_id;
	if( !request_id || request_id=="lv0" ) return;

	let f = function(xml, req){
	    if( req.readyState==4 && req.status==200 ){
		let publishstatus = req.responseXML;
		NicoLiveHelper.token = publishstatus.getElementsByTagName('token')[0].textContent;
		NicoLiveHelper.beginLive( NicoLiveHelper.token );
		// TODO
		//NicoLiveHelper.setLiveProgressBarTipText();
	    }
	};
	NicoApi.getpublishstatus( request_id, f );
    },

    /**
     * 生放送に接続する.
     * @param request_id 放送ID
     * @param title 番組のタイトル(事前に分かっていれば)
     * @param iscaster 生主かどうか（〃)
     * @param community_id 放送しているコミュニティID
     */
    openNewBroadcast: function(request_id, title, iscaster, community_id){
	if( request_id=="lv0" ){
	    debugprint("Now offline.");
	    return;
	}

	this.initVars();

	let f = function(xml, req){
	    if( req.readyState!=4 ) return;
	    if( req.status!=200 ){
		debugalert("getplayerstatusに失敗しました。再度、接続してください。");
		return;
	    }

	    let status = evaluateXPath(xml,"/getplayerstatus/@status")[0].value;
	    if( status=='fail' ){
		debugalert("番組情報を取得できませんでした. CODE="+ xml.getElementsByTagName('code')[0].textContent );
		return;
	    }
	    NicoLiveHelper.extractGetPlayerStatus(xml);
	    // ショートカット作成
	    NicoLiveHelper.iscaster = NicoLiveHelper.liveinfo.is_owner;

	    // 現在再生している動画を調べる.
	    let contents = xml.getElementsByTagName('contents');
	    let noprepare = 0;
	    for(let i=0,currentplay;currentplay=contents[i];i++){
		let id = currentplay.getAttribute('id');
		let title = currentplay.getAttribute('title') || "";
		let b = currentplay.getAttribute('disableVideo')=='1'?true:false;
		if( id=="main" ){
		    $('main-state-soundonly').checked = b;
		    $('main-video-title').value = title;
		    $('main-video-title').setAttribute('tooltiptext', title);
		}
		if( id=="sub" ){
		    $('sub-state-soundonly').checked = b;
		    $('sub-video-title').value = title;
		    $('sub-video-title').setAttribute('tooltiptext', title);
		}
		let target = id=="main"?MAIN:SUB;

		let st = currentplay.getAttribute('start_time'); // 再生開始時刻.
		let du = currentplay.getAttribute('duration');   // 動画の長さ.
		st = st && parseInt(st) || 0;
		du = du && parseInt(du) || 0;
		if(du){
		    // 動画の長さが設定されているときは何か再生中.

		    // 再生中の動画情報をセット.
		    let tmp = currentplay.textContent.match(/(sm|nm|ze|so)\d+|\d{10}/);
		    if(tmp){
			NicoLiveHelper.play_status[target].play_begin = st;
			NicoLiveHelper.play_status[target].play_end = st+du+1;
			NicoLiveHelper.setCurrentPlayVideo( tmp[0], target );
		    }

		    if( NicoLiveHelper.liveinfo.is_owner ){
			// 生主なら次曲再生できるようにセット.
			let remain;
			remain = (st+du)-GetCurrentTime(); // second.
			remain = remain + 1; // 1秒ほどゲタ履かせておく
			NicoLiveHelper.setupPlayNext( target, remain, noprepare );
			noprepare++; // 先読みするのは一つだけにしておく
		    }
		}
	    }

	    let serverdate = evaluateXPath(xml,"/getplayerstatus/@time");
	    if(serverdate.length){
		serverdate = serverdate[0].textContent;
	    }else{
		serverdate = GetCurrentTime();
	    }
	    serverdate = new Date(serverdate*1000);
	    NicoLiveHelper.connecttime = serverdate.getTime()/1000;
	    debugprint( "接続時刻: "+GetDateString(NicoLiveHelper.connecttime*1000) );

	    if( title ){
		NicoLiveHelper.liveinfo.title = title;
	    }

	    if( !NicoLiveHelper.iscaster ){
		// リスナーはコメント60文字(公式)に合わせる
		$('textbox-comment').setAttribute('maxlength','60');
	    }

	    NicoLiveHelper.preprocessConnectServer( NicoLiveHelper.liveinfo.request_id );
	};
	NicoApi.getplayerstatus( request_id, f );
    },

    /**
     * ハートビートを実施する.
     * 1分ごとに呼ばれて、来場者数を更新する。
     */
    heartbeat:function(){
	let f = function(xml,req){
	    if( req.readyState==4 && req.status==200 ){
		let xml = req.responseXML;
		try{
		    let watcher = xml.getElementsByTagName('watchCount')[0].textContent;
		    $('statusbar-n-of-listeners').label = LoadFormattedString('STR_WATCHER',[watcher]);
		} catch (x) {
		}
	    }
	};
	let data = new Array();
	data.push("v="+this.liveinfo.request_id);
	NicoApi.heartbeat( data, f );
    },

    /**
     * 接続が切れないように適当に通信する.
     * 3分ごとに呼ばれる。
     */
    keepConnection:function(){
	// 0:アリーナ 1:立ち見A 2:立ち見B 3:立ち見C
	let now = GetCurrentTime();
	for(let i=0; i<4; i++){
	    try{
		let item = this.connectioninfo[i];
		if( !item ) continue;
		if( now - this.lastReceived[i] >= 180 ){
		    let str = "<thread thread=\""+item.thread+"\" res_from=\"0\" version=\"20061206\"/>\0";
		    item.ostream.writeString(str);
		}
	    } catch (x) {
		debugprint(x);
	    }
	}
    },

    /**
     * ステータスバーの表示更新.
     */
    updateStatusBar: function(){
	let now = GetCurrentTime();
	let liveprogress = now - this.liveinfo.start_time;
	let liveremain = this.liveinfo.end_time - now;

	let meter = $('statusbar-music-progressmeter');
	let currentvideo = this.getCurrentVideoInfo();
	let liveprogressmeter = $('statusbar-live-progress');

	liveprogressmeter.label = GetTimeString(liveprogress);

	let videoname = $('statusbar-music-name');
	if( !currentvideo ){
	    videoname.label = '';
	    meter.value = 0;
	    $('statusbar-currentmusic').setAttribute("tooltiptext",'');
	    return;
	}

	let begin_time = this.play_status[ this.play_target ].play_begin;
	let videolength = currentvideo.length_ms/1000;
	let videoprogress = now-begin_time;

	let p = parseInt( videoprogress / videolength * 100 );
	meter.value = p;

	let videoremain = videolength - videoprogress;
	if( videoremain<0 ) videoremain = 0;
	videoname.label = currentvideo.title + '('+'-'+GetTimeString(videoremain)+'/'+currentvideo.length+')';

	// プログレスバーの長さ制限
	let w = window.innerWidth - $('statusbar-n-of-listeners').clientWidth - $('statusbar-live-progress').clientWidth;
	w-=64;
	videoname.style.maxWidth = w + "px";

	// チップヘルプでの動画情報表示
	try{
	    let str;
	    str = "投稿日/"+GetDateString(currentvideo.first_retrieve*1000)
		+ " 再生数/"+currentvideo.view_counter
		+ " コメント/"+currentvideo.comment_num
		+ " マイリスト/"+currentvideo.mylist_counter+"\n"
		+ "タグ/"+currentvideo.tags['jp'].join(' ');
	    if(currentvideo.mylist!=null){
		str = "マイリスト登録済み:"+currentvideo.mylist + "\n"+str;
	    }
	    $('statusbar-currentmusic').setAttribute("tooltiptext",str);
	} catch (x) {
	}
    },

    /**
     * 次曲自動再生タイマーをしかける.
     * @param target MAIN or SUB
     * @param duration 現在の動画の残り時間(秒)
     * @param noprepare /prepareタイマーを設定しない
     */
    setupPlayNext: function(target, duration, noprepare){
	if( !this.liveinfo.is_owner ) return;

	let interval = parseInt(Config.play_interval*1000);
	duration = duration * 1000;

	clearTimeout( this.play_status[target]._playend );
	clearTimeout( this.play_status[target]._playnext );
	clearTimeout( this.play_status[target]._prepare );

	// 再生終了タイマー
	this.play_status[target]._playend = setTimeout(
	    function(){
		NicoLiveHelper.play_status[target].videoinfo = null;
	    }, duration );

	// 次曲再生タイマー
	let next_time = duration + interval;
	this.play_status[target]._playnext = setTimeout(
	    function(){
		let current_target = $('do-subdisplay').checked ? SUB:MAIN;
		if( current_target==target ){
		    if( NicoLiveHelper.autoplay ){
			NicoLiveHelper.checkPlayNext();
		    }
		}
	    }, next_time );
	debugprint( parseInt((next_time)/1000)+'秒後に次曲を再生します');

	if( noprepare ) return;

	// TODO 先読み開始タイマー
	let prepare_time = 1000;
	this.play_status[target]._prepare = setTimeout(
	    function(){
		
	    }, prepare_time );
    },


    /**
     * 毎秒呼び出される関数.
     */
    update: function(){
	this.updateStatusBar();
    },


    /**
     * user_sessionクッキーを読み込む.
     */
    setupCookie:function(){
	this._use_other_browser = false;
	if( !NicoLiveCookie.getCookie("http://www.nicovideo.jp/") ){
	    // getCookieで取れなければサードパーティクッキーの保存にチェックが入ってないので.
	    SetUserSessionCookie( NicoLiveCookie.getCookie2("http://www.nicovideo.jp/","user_session") );
	}
	if( $('use-standard-mode-ie').hasAttribute('checked') ){
	    SetUserSessionCookie( NicoLiveCookie.getStdIECookie("http://www.nicovideo.jp/","user_session") );
	    debugprint("use Standard mode IE");
	    this._use_other_browser = true;
	}
	if( $('use-protected-mode-ie').hasAttribute('checked') ){
	    SetUserSessionCookie( NicoLiveCookie.getIECookie("http://www.nicovideo.jp/","user_session") );
	    debugprint("use Protected mode IE");
	    this._use_other_browser = true;
	}
	if( $('use-google-chrome').hasAttribute('checked') ){
	    SetUserSessionCookie( NicoLiveCookie.getChromeCookie() );
	    debugprint("use Google Chrome");
	    this._use_other_browser = true;
	}
	if( $('use-mac-safari').hasAttribute('checked') ){
	    SetUserSessionCookie( NicoLiveCookie.getMacSafariCookie() );
	    debugprint("use Mac Safari");
	    this._use_other_browser = true;
	}
	if( LibUserSessionCookie ){
	    debugprint("user_session=" + LibUserSessionCookie );
	}
	if( !RUN_ON_FIREFOX && this._use_other_browser ){
	    NicoLiveCookie.setCookie( LibUserSessionCookie );
	}
    },


    /**
     * 配列をソートする.
     */
    sortRequestStock:function(queue,type,order){
	// order:1だと昇順、order:-1だと降順.
	queue.sort( function(a,b){
			let tmpa, tmpb;
			switch(type){
			case 0:// 再生数.
			    tmpa = a.view_counter;
			    tmpb = b.view_counter;
			    break;
			case 1:// コメ.
			    tmpa = a.comment_num;
			    tmpb = b.comment_num;
			    break;
			case 2:// マイリス.
			    tmpa = a.mylist_counter;
			    tmpb = b.mylist_counter;
			    break;
			case 3:// 時間.
			    tmpa = a.length_ms;
			    tmpb = b.length_ms;
			    break;
			case 4:// 投稿日.
			default:
			    tmpa = a.first_retrieve;
			    tmpb = b.first_retrieve;
			    break;
			case 5:// マイリス率.
			    tmpa = a.mylist_counter / a.view_counter;
			    tmpb = b.mylist_counter / b.view_counter;
			    break;
			case 6:// タイトル.
			    if(a.title < b.title){
				return -order;
			    }else{
				return order;
			    }
			    break;
			case 7:// マイリス登録日.
			    tmpa = a.registerDate;
			    tmpb = b.registerDate;
			    break;
			case 8:// 宣伝ポイント.
			    tmpa = a.uadp;
			    tmpb = b.uadp;
			    break;
			case 9:// ビットレート
			    tmpa = a.highbitrate;
			    tmpb = b.highbitrate;
			    break;
			}
			return (tmpa - tmpb) * order;
		    });
    },

    /**
     * リクエストをソート
     */
    sortRequest:function(type,order){
	this.sortRequestStock(this.request_list,type,order);
	NicoLiveRequest.updateView(this.request_list);
	this.saveRequest();	
    },

    /**
     * ストックをソート
     */
    sortStock:function(type,order){
	this.sortRequestStock(this.stock_list,type,order);
	NicoLiveStock.updateView(this.stock_list);
	this.saveStock();
    },

    // コメ番順にソート.
    sortRequestByCommentNo:function(){
	// order:1だと昇順、order:-1だと降順.
	let order = 1;
	this.request_list.sort( function(a,b){
				    if(b.comment_no==undefined) return -1;
				    if(a.comment_no==undefined) return 1;
				    try{
					let a_cno = parseInt((""+a.comment_no).split(",")[0]);
					let b_cno = parseInt((""+b.comment_no).split(",")[0]);
					return (a_cno - b_cno) * order;
				    } catch (x) {
					debugprint(x);
					return 0;
				    }
				});
	NicoLiveRequest.updateView(this.request_list);
	this.saveRequest();
    },


    /**
     * リクエストセットの切り替え
     * @param n セット番号
     */
    changeRequestSet: function(n){
	if( this.request_setno==n ) return;
	Storage.writeObject( "nico_request_setno"+this.request_setno, this.request_list );
	this.request_list = Storage.readObject( "nico_request_setno"+n, [] );
	NicoLiveRequest.updateView( this.request_list );
	this.request_setno = n;
    },
    /**
     * ストックセットの切り替え
     * @param n セット番号
     */
    changeStockSet: function(n){
	if( this.stock_setno==n ) return;
	Storage.writeObject( "nico_stock_setno"+this.stock_setno, this.stock_list );
	this.stock_list = Storage.readObject( "nico_stock_setno"+n, [] );
	NicoLiveStock.updateView( this.stock_list );
	this.stock_setno = n;
    },

    /**
     * リクエストをロードする
     * @param n セット番号
     * @return リクエストの配列を返す
     */
    loadRequest: function(n){
	return Storage.readObject( "nico_request_setno"+n, [] );
    },

    /**
     * ストックをロードする
     * @param n セット番号
     * @return ストックの配列を返す
     */
    loadStock: function(n){
	return Storage.readObject( "nico_stock_setno"+n, [] );
    },

    /**
     * プレイリストをロードする.
     */
    loadPlaylist: function(){
	// load playlist
	this.playlist_list = Storage.readObject( "nico_playlist", [] );
	for(let i=0,item;item=this.playlist_list[i];i++){
	    this.playlist_list["_"+item.video_id] = this.playlist_list[i].playedtime;
	    NicoLiveHistory.addPlayList( item );
	}
	$('playlist-textbox').value = Storage.readObject( "nico_playlist_txt", "" );
    },

    /**
     * リクエストをセーブする
     */
    saveRequest:function(){
	// 視聴者ではリクエストは保存しない.
	if(!this.iscaster && !this.isOffline()) return;
	Storage.writeObject( "nico_request_setno"+this.request_setno, this.request_list );
    },
    /**
     * ストックをセーブする
     */
    saveStock:function(){
	Storage.writeObject( "nico_stock_setno"+this.stock_setno, this.stock_list );
    },
    /**
     * プレイリストをセーブする
     */
    savePlaylist:function(){
	// 視聴者ではプレイリストは保存しない.
	if(!this.iscaster && !this.isOffline()) return;
	Storage.writeObject( "nico_playlist", this.playlist_list );
	Storage.writeObject( "nico_playlist_txt", $('playlist-textbox').value );
    },
    /**
     * リクエスト、ストック、プレイリストを保存する
     */
    saveAll: function(){
	this.saveRequest();
	this.saveStock();
	this.savePlaylist();
    },

    /**
     * 変数の初期化を行う.
     * ただし、放送枠を越えて持続性の持つデータを扱う変数は初期化しない。
     */
    initVars: function(){
	this._donotshowdisconnectalert = false;

	this.liveinfo = new LiveInfo();
	this.userinfo = new UserInfo();
	this.serverinfo = new ServerInfo();
	this.twitterinfo = new TwitterInfo();

	this.request_q = new Array();
	this.stock_q = new Array();

	this.play_status[MAIN] = new Object();
	this.play_status[SUB] = new Object();

	this.connectioninfo = new Array();

	this._first_play = false;
    },

    /**
     * ウィンドウを開くときに真っ先に呼ばれる初期化関数.
     */
    init: function(){
	debugprint('Initializing NicoLive Helper Advance '+GetAddonVersion()+'...');
	document.title = "NicoLive Helper Advance " + GetAddonVersion();
	srand( GetCurrentTime() );

	SetUserAgent("NicoLiveHelperAdvance/"+GetAddonVersion());

	this.initVars();
	this.setPlayTarget( $('do-subdisplay').checked );
	this.setupCookie();

	// 以下、生放送への接続処理など
	let request_id, title, iscaster, community_id;
	try{
	    // XULRunnerではここからコマンドライン引数を取る
	    // window.arguments[0].getArgument(0);
	    if( RUN_ON_FIREFOX ){
		request_id = window.arguments[0];
		title      = window.arguments[1];
		iscaster   = window.arguments[2];
		community_id = window.arguments[3] || "";
		if( request_id==null || title==null || iscaster==null ){
		    request_id = "lv0";
		    title = "";
		    iscaster = true;
		}
	    }else{
		request_id = window.arguments[0].getArgument(0) || "lv0";
		title      = "";
		iscaster   = true;
		community_id = "";
	    }
	} catch (x) {
	    debugprint(x);
	    debugprint("no window.arguments.");
	    request_id = Application.storage.get("nico_request_id","lv0");
	    title      = Application.storage.get("nico_live_title","");
	    iscaster   = Application.storage.get("nico_live_caster",true);
	    community_id = Application.storage.get("nico_live_coid","");
	}
	title = title.replace(/\u200b/g,"");

	debugprint("request_id:"+request_id);
	debugprint("Caster:"+iscaster);
	debugprint("Community:"+community_id);
	debugprint("title:"+title);

	// リクエストやストックの復元
	this.request_setno = $('request-set-no').value;
	this.stock_setno = $('stock-set-no').value;

	if( request_id && request_id!="lv0" ){
	    // オンライン
	    if( iscaster ){
		this.request_list = this.loadRequest( this.request_setno );
		NicoLiveRequest.updateView( this.request_list );
		this.loadPlaylist();
	    }
	}else{
	    // オフライン
	    this.request_list = this.loadRequest( this.request_setno );
	    NicoLiveRequest.updateView( this.request_list );
	    this.loadPlaylist();
	}
	this.stock_list   = this.loadStock( this.stock_setno );
	NicoLiveStock.updateView( this.stock_list );

	// 生放送に接続開始
	this.openNewBroadcast( request_id, title, iscaster, community_id );
    },

    /**
     * 放送で使用する各種タイマーを停止する.
     */
    stopTimers: function(){
	clearInterval( this._update_timer );
	clearInterval( this._keep_timer );
	clearInterval( this._heartbeat_timer );
	clearInterval( this._sendvideoinfo_timer );
	clearInterval( this._sendclstimer );
	clearInterval( this._revertcommenttimer );
	clearInterval( this._commentstatetimer );

	clearTimeout( this.play_status[MAIN]._playend );
	clearTimeout( this.play_status[MAIN]._playnext );
	clearTimeout( this.play_status[MAIN]._prepare );
	clearTimeout( this.play_status[SUB]._playend );
	clearTimeout( this.play_status[SUB]._playnext );
	clearTimeout( this.play_status[SUB]._prepare );
    },

    destroy: function(){
	this._donotshowdisconnectalert = true;

	this.saveAll();

	this.stopTimers();
	this.closeAllConnection();
    }

};


window.addEventListener("load", function(e){ NicoLiveHelper.init(); }, false);
window.addEventListener("unload", function(e){ NicoLiveHelper.destroy(); }, false);
