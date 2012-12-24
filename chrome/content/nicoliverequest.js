
var NicoLiveRequest = {

    /**
     * table内に表示する動画情報を作成する.
     * @return 作成したvboxを返す
     */
    createVideoInformation: function(item){
	let vbox = CreateElement('vbox');
	let tooltip="";
	let i;
	//tooltip = "レート:"+GetFavRateString(NicoLiveDatabase.getFavorite(item.video_id)) + "\n";
	tooltip += item.movie_type+" "+item.highbitrate+"kbps/"+item.lowbitrate+"kbps";
	vbox.setAttribute('tooltiptext',tooltip);
	vbox.setAttribute('nicovideo_id',item.video_id);

	let div = CreateHTMLElement('div');
	// 横幅指定がないと表示文字数が少ない行がウィンドウ一杯に使わないことがあるので対策として指定
	div.setAttribute('style','width:1920px;');

	div.className ="selection";
	let a = CreateHTMLElement('a');
	a.className = "";
	a.setAttribute("onclick","NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/watch/"+item.video_id+"');");

	let img = CreateHTMLElement('img');
	img.src = item.thumbnail_url;
	img.style.cssFloat = 'left';
	img.style.marginRight = '0.5em';
	img.className = "video-thumbnail";

	// マウスオーバーのサムネ表示
	a.setAttribute("onmouseover","NicoLiveComment.showThumbnail(event,'"+item.video_id+"');");
	a.setAttribute("onmouseout","NicoLiveComment.hideThumbnail();");
	a.appendChild(img);

	let label;
	// 動画ID+タイトル.
	div.appendChild(a); // thumbnail
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

	let datestr = GetDateString(item.first_retrieve*1000);
	div.appendChild(document.createTextNode("投稿日:" + datestr +" "
		+ "再生数:"+FormatCommas(item.view_counter)+" コメント:"+FormatCommas(item.comment_num)
		+ " マイリスト:"+FormatCommas(item.mylist_counter)+" 時間:"+item.length
		//+ (NicoLiveHelper.userdefinedvalue[item.video_id]?" 彡:"+NicoLiveHelper.userdefinedvalue[item.video_id]:'')
		));
	
	let hr = CreateHTMLElement('hr');
	hr.className = 'detail';
	div.appendChild(hr);

	let div2 = CreateHTMLElement('div');
	div2.className = 'detail selection';
	let str;
	// 動画詳細の部分、innerHTMLが使えないのでひたすらDOM操作.
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
		a.setAttribute("onmouseover","NicoLiveComment.showThumbnail(event,'"+vid+"');");
		a.setAttribute("onmouseout","NicoLiveComment.hideThumbnail();");
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
	    text.style.backgroundColor = NicoLivePreference.classes["_"+item.classify['class']];
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
	a.setAttribute("onclick","NicoLiveWindow.openDefaultBrowser('http://www.nicovideo.jp/watch/"+item.video_id+"');");

	let img = CreateHTMLElement('img');
	img.src = item.thumbnail_url;
	img.style.cssFloat = 'left';
	img.style.marginRight = '0.5em';
	img.className = "video-thumbnail";

	// マウスオーバーのサムネ表示
	a.setAttribute("onmouseover","NicoLiveComment.showThumbnail(event,'"+item.video_id+"');");
	a.setAttribute("onmouseout","NicoLiveComment.hideThumbnail();");
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
	let td;
	td = tr.insertCell(tr.cells.length);
	td.appendChild(document.createTextNode("#"+table.rows.length));
	if( item.comment_no ){
	    td.appendChild(CreateHTMLElement('br'));
	    td.appendChild(document.createTextNode("C#"+item.comment_no));
	}

	// 先頭から何分後にあるかの表示
	let t;
	t = GetTimeString( 0 );
	td.appendChild(CreateHTMLElement('br'));
	td.appendChild(document.createTextNode("+"+t));
	//this._summation_time += NicoLivePreference.nextplay_interval + item.length_ms/1000;

	let n = table.rows.length-1;
	tr.setAttribute("request-index",n); // 0,1,2,3,...

	td = tr.insertCell(tr.cells.length);

	let vbox;
	if( item.video_id.indexOf("im")==0 ){
	    // ニコニコ静画
	    vbox = this.createSeigaInformation(item);
	}else{
	    vbox = this.createVideoInformation(item);
	}

	vbox.setAttribute('class','vinfo');
	// TODO ポップアップメニュー
	vbox.setAttribute('context','popup-copyrequest');

	let hbox = CreateElement('hbox');
	hbox.setAttribute('tooltiptext','');
	hbox.setAttribute('class','command-buttons');

	let button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/information.png');
	//button.setAttribute('label','情報');
	button.setAttribute('class','command-button');
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/play.png');
	button.setAttribute('label','再生');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveHelper.playRequest("+n+");");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/go-top.png');
	//button.setAttribute('label','↑');
	button.setAttribute('class','command-button');
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/direction_up.png');
	//button.setAttribute('label','↑');
	button.setAttribute('class','command-button');
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/direction_down.png');
	//button.setAttribute('label','↓');
	button.setAttribute('class','command-button');
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/go-bottom.png');
	//button.setAttribute('label','↓');
	button.setAttribute('class','command-button');
	hbox.appendChild(button);

	let spacer = CreateElement('spacer');
	spacer.setAttribute('flex','1');
	hbox.appendChild(spacer);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/remove.png');
	button.setAttribute('label','削除');
	button.setAttribute('class','command-button');
	hbox.appendChild(button);

	/*
	let button = CreateElement('button');
	button.setAttribute("label",'再生');
	button.className = 'commandbtn';
	button.setAttribute("oncommand","NicoLiveHelper.playVideo("+n+");");
	hbox.appendChild(button);

	button = CreateElement('button');
	button.setAttribute("label",'削除');
	button.className = 'commandbtn';
	button.setAttribute("oncommand","NicoLiveHelper.removeRequest("+n+");");
	hbox.appendChild(button);

	button = CreateElement('button');
	button.setAttribute("label",'↑↑');
	button.className = 'commandbtn';
	button.setAttribute("oncommand","NicoLiveHelper.topToRequest("+n+");");
	hbox.appendChild(button);

	button = CreateElement('button');
	button.setAttribute("label",'↑');
	button.className = 'commandbtn';
	button.setAttribute("oncommand","NicoLiveHelper.floatRequest("+n+");");
	hbox.appendChild(button);

	button = CreateElement('button');
	button.setAttribute("label",'↓');
	button.className = 'commandbtn';
	button.setAttribute("oncommand","NicoLiveHelper.sinkRequest("+n+");");
	hbox.appendChild(button);

	button = CreateElement('button');
	button.setAttribute("label",'↓↓');
	button.className = 'commandbtn';
	button.setAttribute("oncommand","NicoLiveHelper.bottomToRequest("+n+");");
	hbox.appendChild(button);

	if( item.product_code ){
	    let text = CreateElement('label');
	    text.setAttribute("context","popup-search-product-code");
	    text.appendChild( document.createTextNode("作品コード:"+item.product_code) );
	    hbox.appendChild( text );
	}
	 */
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
    },

    addRequest: function(text){
	if(text.length<3) return;
	let l = text.match(/(sm|nm|so|im)\d+|\d{10}/g);
	for(let i=0,id;id=l[i];i++){
	    NicoLiveHelper.addRequest(id,0,"0",false);
	}
	$('input-request').value="";
    },

    /**
     * リクエストの表示を全更新する.
     */
    updateView: function( requestqueue ){
	let table = $('request-table');
	if(!table){ return; }

	clearTable(table);
	for(let i=0,item;item=requestqueue[i];i++){
	    this._addRequestView( table, item );
	}
	// TODO 累積時間の更新
	/*
	if(requestqueue.length==0){
	    this.setTotalPlayTime({min:0,sec:0});
	}
	 */
    },

    init:function(){
	debugprint("NicoLiveRequest.init");
    }
};

window.addEventListener("load", function() { NicoLiveRequest.init(); }, false);
