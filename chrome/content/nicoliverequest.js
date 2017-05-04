
var NicoLiveRequest = {
    _summation_time: 0,

    /**
     * table内に表示する動画情報を作成する.
     * @return 作成したvboxを返す
     */
    createVideoInformation: function(item, isrequest){
	let vbox = CreateElement('vbox');
	let tooltip="";
	let i;
	tooltip = "レート:"+GetFavRateString(Database.getFavorite(item.video_id)) + "\n";
	//tooltip += item.movie_type+" "+item.highbitrate+"kbps/"+item.lowbitrate+"kbps";
	vbox.setAttribute('tooltiptext',tooltip);
	vbox.setAttribute('nicovideo_id',item.video_id);

	let div = CreateHTMLElement('div');
	// 横幅指定がないと表示文字数が少ない行がウィンドウ一杯に使わないことがあるので対策として指定
	div.setAttribute('style','width:1920px;');
	div.className ="selection";
	if( item.errno == REASON_NO_LIVE_PLAY ){
	    div.className = 'selection no_live_play';
	}
	if( item.is_self_request ){
	    div.className = 'selection selfreq';
	}
	let thumbnailContainer = CreateHTMLElement( 'div' );
	thumbnailContainer.setAttribute( 'style', 'float:left; position:relative; margin-right:0.5em;' );

	let a = CreateHTMLElement('a');
	a.className = "";
	a.setAttribute( 'style', 'display:block; position:relative; width: 65px; height: 50px;' );
	a.setAttribute("onclick","NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/watch/"+item.video_id+"');");

	let img = CreateHTMLElement('img');
	img.src = item.thumbnail_url;
	img.className = "video-thumbnail";

	// マウスオーバーのサムネ表示
	a.setAttribute("onmouseover","NicoLiveWindow.showThumbnail(event,'"+item.video_id+"');");
	a.setAttribute("onmouseout","NicoLiveWindow.hideThumbnail();");
	a.appendChild(img);

	let bitrate = CreateHTMLElement( 'span' );
	bitrate.setAttribute( 'style', 'font-size:9pt; padding-left:2px; padding-right:2px; display:block; position:absolute; bottom:0; right:0; background-color:#000; color:#fff; opacity:0.7;' );
	let bitratestr = item.highbitrate.substring( 0, item.highbitrate.length - 3 ) + 'k/' + item.movie_type;
	bitrate.appendChild( document.createTextNode( bitratestr ) );
	a.appendChild( bitrate );

	thumbnailContainer.appendChild( a );

	div.appendChild(thumbnailContainer); // thumbnail

	let label;
	// 動画ID+タイトル.
	let text = document.createTextNode(item.video_id+' '+item.title);
	div.appendChild(text);

	let pname = NicoLiveHelper.getPName(item); // P名.
	if(pname){
	    text = document.createTextNode(' P名:'+pname);
	    div.appendChild(text);
	}
	/*
	let mylist = NicoLiveMylist.isVideoExists(item.video_id);
	if(mylist){
	    text = document.createTextNode(' マ:'+mylist);
	    div.appendChild(text);
	}
	 */
	div.appendChild(CreateHTMLElement('br'));

	let datestr;
	if( Config.japanese_standard_time ){
	    let diff = Config.timezone_offset * 60;
	    let t = item.first_retrieve + diff + 9*60*60;
	    datestr = GetDateString(t*1000);
	}else{
	    datestr = GetDateString(item.first_retrieve*1000);
	}
	div.appendChild(document.createTextNode("投:" + datestr +" "
		+ "再:"+FormatCommas(item.view_counter)+" コ:"+FormatCommas(item.comment_num)
		+ " マ:"+FormatCommas(item.mylist_counter)+" 時間:"+item.length
		//+ (NicoLiveHelper.userdefinedvalue[item.video_id]?" 彡:"+NicoLiveHelper.userdefinedvalue[item.video_id]:'')
		));

	let hr = CreateHTMLElement('hr');
	hr.className = 'detail';
	div.appendChild(hr);

	let div2 = CreateHTMLElement('div');
	div2.className = 'detail selection';
	let str;
	// 動画詳細の部分、innerHTMLが使えなかったのでひたすらDOM操作.
	str = item.description.split(/(mylist\/\d+|sm\d+|nm\d+)/);
	for(i=0;i<str.length;i++){
	    let s = str[i];
	    if( s.match(/mylist\/\d+/) ){
		let a = CreateHTMLElement('a');
		let mylist = s;
		a.setAttribute("onclick","NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/"+mylist+"');");
		a.appendChild(document.createTextNode(s));
		div2.appendChild(a);
	    }else if( s.match(/(sm|nm)\d+/) ){
		let a = CreateHTMLElement('a');
		let vid = s;
		a.setAttribute("onclick","NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/watch/"+vid+"');");
		a.setAttribute("onmouseover","NicoLiveWindow.showThumbnail(event,'"+vid+"');");
		a.setAttribute("onmouseout","NicoLiveWindow.hideThumbnail();");
		a.appendChild(document.createTextNode(s));
		div2.appendChild(a);
	    }else{
		div2.appendChild(document.createTextNode(s));
	    }
	}
	div.appendChild(div2);
	vbox.appendChild(div);

	hr = CreateHTMLElement('hr');
	//hr.className = 'detail';
	vbox.appendChild(hr);

	label = CreateElement('description');
	if( item.classify ){
	    // 動画情報に分類情報があれば、タグの前にラベルを付ける.
	    let text = CreateHTMLElement('span');
	    //text.className = item.classify.class;
	    text.style.backgroundColor = Config.classes["_"+item.classify['class']];
	    text.appendChild(document.createTextNode('['+item.classify['class']+']'));
	    label.appendChild(text);
	}
	label.className = "selection videotag";
	label.appendChild( document.createTextNode('タグ: '+item.tags['jp'].join(' ')+" ") );
	let tiptext = "";
	for(domain in item.tags){
	    if( domain=='jp' ) continue;
	    label.appendChild( document.createTextNode("["+domain+"]") );
	    tiptext += "["+domain+"] "+item.tags[domain].join(' ');
	    tiptext += "\n";
	}
	label.setAttribute("tooltiptext",tiptext);
	vbox.appendChild(label);
	return vbox;
    },

    /**
     * table内に表示する動画情報を作成する.
     * @return 作成したvboxを返す
     */
    createSeigaInformation: function(item){
	let vbox = CreateElement('vbox');
	let tooltip="";
	let i;

	vbox.setAttribute('nicovideo_id',item.video_id);

	let div = CreateHTMLElement('div');
	// 横幅指定がないと表示文字数が少ない行がウィンドウ一杯に使わないことがあるので対策として指定
	div.setAttribute('style','width:1920px;');

	div.className ="selection";
	let a = CreateHTMLElement('a');
	a.className = "";
	a.setAttribute("onclick",
		       "NicoLiveWindow.openDefaultBrowser('http://seiga.nicovideo.jp/seiga/"+item.video_id+"');");

	let img = CreateHTMLElement('img');
	img.src = item.thumbnail_url;
	img.style.cssFloat = 'left';
	img.style.marginRight = '0.5em';
	img.className = "video-thumbnail";

	a.appendChild(img);

	let label;
	// 動画ID+タイトル.
	div.appendChild(a); // thumbnail
	let text = document.createTextNode(item.video_id+' '+item.title);
	div.appendChild(text);
	vbox.appendChild(div);
	return vbox;
    },

    /**
     * リクエストリストに一個追加する
     */
    _addRequestView:function(table,item){
	let tr = table.insertRow(table.rows.length);
	tr.className = table.rows.length%2?"table_oddrow":"table_evenrow";
	if(item.is_casterselection){
	    tr.className = "table_casterselection";
	}

	if(item.is_self_request){
	    // green
	    tr.className = "table_selfreq";
	}
	if( item.errno==REASON_NO_LIVE_PLAY ){
	    tr.className = "table_played no_live_play";
	}
	let td;
	td = tr.insertCell(tr.cells.length);
	td.appendChild(document.createTextNode("#"+table.rows.length));
	if( item.comment_no ){
	    td.appendChild(CreateHTMLElement('br'));
	    td.appendChild(document.createTextNode("C#"+item.comment_no));
	}

	// 先頭から何分後にあるかの表示
	let t;
	t = GetTimeString( this._summation_time );
	td.appendChild(CreateHTMLElement('br'));
	td.appendChild(document.createTextNode("+"+t));
	this._summation_time += Config.play_interval + item.length_ms/1000;

	td = tr.insertCell(tr.cells.length);

	if( NicoLiveHelper._playlog["_"+item.video_id] ){
	    let t = NicoLiveHelper._playlog["_"+item.video_id];
	    tr.className ="table_recently_play";
	    let txt = document.createTextNode("※この動画は"+GetDateString(t*1000)+"に再生されています。");
	    td.appendChild( txt );
	}

	let vbox;
	if( item.video_id.indexOf("im")==0 ){
	    // ニコニコ静画
	    vbox = this.createSeigaInformation(item);
	}else{
	    vbox = this.createVideoInformation(item, true); // isrequest=true
	}

	vbox.setAttribute('class','vinfo');
	// ポップアップメニュー
	vbox.setAttribute('context','popup-request');

	let hbox = CreateElement('hbox');
	hbox.setAttribute('tooltiptext','');
	hbox.setAttribute('class','command-buttons');

	let button;
	/*
	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/information.png');
	//button.setAttribute('label','情報');
	button.setAttribute('class','command-button');
	hbox.appendChild(button);
	 */

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/play.png');
	button.setAttribute('label','再生');
	button.setAttribute('tooltiptext','動画を再生します');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveRequest._playRequest(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/go-top.png');
	button.setAttribute('class','command-button');
	button.setAttribute('tooltiptext','一番上に移動します');
	button.setAttribute('oncommand',"NicoLiveRequest.goTopRequest(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/direction_up.png');
	button.setAttribute('class','command-button');
	button.setAttribute('tooltiptext','一つ上に移動します');
	button.setAttribute("oncommand","NicoLiveRequest.moveUpRequest(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/direction_down.png');
	button.setAttribute('tooltiptext','一つ下に移動します');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveRequest.moveDownRequest(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/go-bottom.png');
	button.setAttribute('tooltiptext','一番下に移動します');
	button.setAttribute('class','command-button');
	button.setAttribute('oncommand',"NicoLiveRequest.goBottomRequest(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/prepare.png');
	button.setAttribute('class','command-button');
	button.setAttribute('tooltiptext','先読み(/prepare)します');
	button.setAttribute('oncommand',"NicoLiveRequest.prepareVideo(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/add.png');
	button.setAttribute('class','command-button');
	button.setAttribute('label','ストック');
	button.setAttribute('tooltiptext','リクエストからストックに追加します');
	button.setAttribute('oncommand',"NicoLiveRequest.addStockDirect(event);");
	hbox.appendChild(button);

	/*
	button = CreateElement('toolbarbutton');
	button.setAttribute('type','menu');
	button.setAttribute('label','追加');
	button.setAttribute('popup','video-add-panel');
	button.setAttribute('image','data/add.png');
	button.setAttribute('class','command-button');
	hbox.appendChild(button);
	 */

	if( item.product_code ){
	    let text = CreateElement('hbox');
	    text.setAttribute("align","center");
	    text.setAttribute("style","cursor:default;");
	    text.setAttribute("context","popup-search-product-code");
	    text.appendChild( document.createTextNode(item.product_code) );
	    hbox.appendChild( text );
	}

	let spacer = CreateElement('spacer');
	spacer.setAttribute('flex','1');
	hbox.appendChild(spacer);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/remove.png');
	button.setAttribute('label','削除');
	button.setAttribute('tooltiptext','一覧から削除します');
	button.setAttribute("oncommand","NicoLiveRequest.removeRequest(event);");
	button.setAttribute('class','command-button');
	button.setAttribute( 'video_id', item.video_id );
	button.setAttribute( 'context', 'popup-db-delete' );
	hbox.appendChild(button);

	vbox.appendChild(hbox);
	td.appendChild(vbox);
    },

    /**
     * リクエスト表示の末尾にひとつ追加する.
     */
    addRequestView: function(videoinfo){
	let table = $('request-table');
	if( !table ) return;
	this._addRequestView( table, videoinfo );

	let t = NicoLiveHelper.getTotalRequestTime();
	$('total-playtime').value = LoadFormattedString('STR_FORMAT_NUMBER_OF_REQUEST',[t.min, t.sec, NicoLiveHelper.request_list.length]);
    },

    addRequest: function(text){
	if(text.length<3) return;
	let l = text.match(/(sm|nm|so|im)\d+|\d{10}/g);
	for(let i=0,id;id=l[i];i++){
	    NicoLiveHelper.addRequest(id,0,"0",false);
	}
	$('input-request').value="";
    },

    getIndex: function(event){
	let tr = FindParentElement(event.target,'tr');
	let n = tr.sectionRowIndex;
	return n;
    },
    getIndexFromNode: function(node){
	let tr = FindParentElement(node,'tr');
	let n = tr.sectionRowIndex;
	return n;
    },

    /**
     * リクエストを再生する
     * @param event 再生ボタンのoncommandイベント
     */
    _playRequest: function(event){
	let n = this.getIndex(event);
	this.playRequest(n);
    },

    prepareVideo:function(event){
	let n = this.getIndex(event);
	NicoLiveHelper.postCasterComment("/prepare "+NicoLiveHelper.request_list[n].video_id);
    },

    /**
     * リクエストを再生する
     * @param n 対象のリクエスト(0,1,2,...)
     */
    playRequest: function(n){
	if( NicoLiveHelper.isOffline() ) return;

	debugprint("Play Request: #"+n);
	NicoLiveHelper.playRequest(n);

	//let tr = FindParentElement(event.target,'html:tr');
	let tr = evaluateXPath(document,"//html:table[@id='request-table']//html:tr")[n];
	RemoveElement( tr );
	this.resetRequestIndex();
    },

    /**
     * リクエストを削除する
     * @param event 削除ボタンのoncommandのイベント
     */
    removeRequest: function(event){
	let n = this.getIndex(event);
	debugprint("Remove Request: #"+n);
	NicoLiveHelper.removeRequest(n);

	let tr = FindParentElement(event.target,'tr');
	RemoveElement( tr );
	this.resetRequestIndex();

	let t = NicoLiveHelper.getTotalRequestTime();
	$('total-playtime').value = LoadFormattedString('STR_FORMAT_NUMBER_OF_REQUEST',[t.min, t.sec, NicoLiveHelper.request_list.length]);
    },

    swapRequest: function( n1, n2 ){
	let rows = evaluateXPath( document, "//html:table[@id='request-table']//html:tr//*[@class='vinfo']");

	let parent1, parent2;
	parent1 = rows[n1].parentNode;
	parent2 = rows[n2].parentNode;

	let tmp1, tmp2;
	tmp1 = rows[n1].cloneNode(true);
	tmp2 = rows[n2].cloneNode(true);

	parent1.replaceChild( tmp2, rows[n1] );
	parent2.replaceChild( tmp1, rows[n2] );
    },

    moveUpRequest: function(event){
	let n = this.getIndex(event);
	if( n>=1 ){
	    this.swapRequest( n, n-1 );
	    NicoLiveHelper.swapRequest( n, n-1 );
	    this.resetRequestIndex();
	}
    },
    moveDownRequest: function(event){
	let n = this.getIndex(event);
	if( n<NicoLiveHelper.request_list.length-1 ){
	    this.swapRequest( n, n+1 );
	    NicoLiveHelper.swapRequest( n, n+1 );
	    this.resetRequestIndex();
	}
    },

    goTopRequest: function(event){
	let n = this.getIndex(event);
	if( n>0 ){
	    let rows = evaluateXPath( document, "//html:table[@id='request-table']//html:tr");
	    let tmp = rows[n].cloneNode(true);
	    RemoveElement( rows[n] );
	    rows[0].parentNode.insertBefore( tmp, rows[0] );
	    NicoLiveHelper.goTopRequest(n);
	    this.resetRequestIndex();
	}
    },
    goBottomRequest: function(event){
	let n = this.getIndex(event);
	if( n<NicoLiveHelper.request_list.length-1 ){
	    let rows = evaluateXPath( document, "//html:table[@id='request-table']//html:tr");
	    let tmp = rows[n].cloneNode(true);
	    let parentNode = rows[0].parentNode;
	    RemoveElement( rows[n] );
	    parentNode.appendChild( tmp );
	    NicoLiveHelper.goBottomRequest(n);
	    this.resetRequestIndex();
	}
    },

    addStockDirect: function(event){
	let n = this.getIndex(event);
	NicoLiveHelper.addStockDirect( NicoLiveHelper.request_list[n] );
    },

    /**
     * リクエストの番号表記と背景色を1から付け直す。
     */
    resetRequestIndex:function(){
	let tr = $('request-table').getElementsByTagName('tr');
	let t = 0;
	for(let i=0,row;row=tr[i];i++){
	    let td = row.firstChild;
	    let item = NicoLiveHelper.request_list[i];

	    row.className = (i+1)%2?"table_oddrow":"table_evenrow";
	    if( item.is_casterselection ){
		row.className = "table_casterselection";
	    }
	    if( NicoLiveHelper._playlog["_"+item.video_id] ){
		row.className ="table_recently_play";
	    }
	    if(item.is_self_request){
		// green
		row.className = "table_selfreq";
	    }

	    RemoveChildren( td );
	    td.appendChild( document.createTextNode('#'+(i+1)));
	    if( item.comment_no ){
		td.appendChild(CreateHTMLElement('br'));
		td.appendChild(document.createTextNode("C#"+item.comment_no));
	    }
	    // 先頭から何分後にあるかの表示
	    let timestr = GetTimeString( t );
	    td.appendChild(CreateHTMLElement('br'));
	    td.appendChild(document.createTextNode("+"+timestr));
	    t += Config.play_interval + item.length_ms/1000;
	}
	this._summation_time = t;
    },

    /**
     * 自貼りフラグのON/OFF切り替え
     * @param node コンテキストメニューを表示したノード
     */
    changeSelfRequestFlag: function(node){
	let n = this.getIndexFromNode(node);
	let tr = FindParentElement(node,'tr');
	let item = NicoLiveHelper.request_list[n];
	if( tr.className=="table_selfreq"){
	    tr.className = n%2?"table_evenrow":"table_oddrow";
	    item.selfrequest = false;
	    item.is_self_request = false;
	}else{
	    tr.className = "table_selfreq";
	    item.selfrequest = true;
	    item.is_self_request = true;
	}
    },

    /**
     * リクエストのコンパクションを行う.
     * @param node コンテキストメニューを表示したノード
     */
    compactRequest:function(node){
	try{
	    let n = this.getIndexFromNode(node);
	    NicoLiveHelper.compactRequest(n);
	    this.updateView(NicoLiveHelper.request_list);
	} catch (x) {
	    debugprint(x);
	}
    },

    copyAll: function(){
	let str = "";

	for( let i=0,item; item=NicoLiveHelper.request_list[i]; i++ ){
	    str += item.video_id+"\n";
	}
	CopyToClipboard(str);
    },

    // リク主をコメントリフレクタに登録する.
    addToCommentReflector:function(node){
	try{
	    let n = this.getIndexFromNode(node);
	    let item = NicoLiveHelper.request_list[n];
	    if( item.comment_no ){
		NicoLiveComment.showCommentReflectorDialog(item.request_user_id, item.cno, item.pname);
	    }
	} catch (x) {
	    debugprint(x);
	}
    },

    /**
     * リクエストセットを切り替える.
     * @param n セット番号
     */
    changeRequestSet: function(n){
	NicoLiveHelper.changeRequestSet(n);
    },

    /**
     * リクエストの表示を全更新する.
     */
    updateView: function( requestqueue ){
	let table = $('request-table');
	if(!table){ return; }

	this._summation_time = 0;
	clearTable(table);
	for(let i=0,item;item=requestqueue[i];i++){
	    this._addRequestView( table, item );
	}
	let t = NicoLiveHelper.getTotalRequestTime();
	$('total-playtime').value = LoadFormattedString('STR_FORMAT_NUMBER_OF_REQUEST',[t.min, t.sec, requestqueue.length]);
    },

    init:function(){
	debugprint("NicoLiveRequest.init");
    }
};

window.addEventListener("load", function() { NicoLiveRequest.init(); }, false);
