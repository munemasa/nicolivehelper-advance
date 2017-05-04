
var NicoLiveRejectRequest = {

    /**
     * table内に表示する動画情報を作成する.
     * @return 作成したvboxを返す
     */
    createVideoInformation: function(item){
	return NicoLiveRequest.createVideoInformation(item);
    },
    createSeigaInformation: function(item){
	return NicoLiveRequest.createSeigaInformation(item);
    },

    /**
     * リジェクトリストに一個追加する
     */
    _addRejectView:function(table,item){
	let tr = table.insertRow(table.rows.length);
	switch( item.errno ){
	case REASON_NO_LIVE_PLAY:
	    tr.className = "table_played no_live_play";
	    break;
	default:
	    tr.className = "white";
	    break;
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

	let button;
	/*
	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/information.png');
	//button.setAttribute('label','情報');
	button.setAttribute('class','command-button');
	hbox.appendChild(button);
	 */

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/add.png');
	button.setAttribute('label','リクエスト');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveRejectRequest.addRequestDirect(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/add.png');
	button.setAttribute('label','ストック');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveRejectRequest.addStockDirect(event);");
	hbox.appendChild(button);

	let spacer = CreateElement('spacer');
	spacer.setAttribute('flex','1');
	hbox.appendChild(spacer);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/remove.png');
	button.setAttribute('label','削除');
	button.setAttribute("oncommand","NicoLiveRejectRequest.removeReject(event);");
	button.setAttribute('class','command-button');
	hbox.appendChild(button);

	vbox.appendChild(hbox);
	td.appendChild(vbox);
    },

    getIndex: function(event){
	let tr = FindParentElement(event.target,'tr');
	let n = tr.sectionRowIndex;
	return n;
    },

    /**
     * リクエストに直接追加
     */
    addRequestDirect:function(event){
	let n = this.getIndex(event);
	let videoinfo = NicoLiveHelper.getRejectedVideo( n );
	NicoLiveHelper.addRequestDirect( videoinfo );
    },
    /**
     * ストックに直接追加
     */
    addStockDirect:function(event){
	let n = this.getIndex(event);
	let videoinfo = NicoLiveHelper.getRejectedVideo( n );
	NicoLiveHelper.addStockDirect( videoinfo );
    },

    removeReject:function(event){
	let n = this.getIndex(event);
	NicoLiveHelper.reject_list.splice(n,1);
	this.updateView( NicoLiveHelper.reject_list );
    },

    /**
     * リジェクトリストに追加する.
     * @param videoinfo 動画情報
     */
    addRejectRequest: function(videoinfo){
	let table = $('reject-table');
	if( !table ) return;
	this._addRejectView( table, videoinfo );
    },

    /**
     * リジェクトリストの表示を全更新する.
     */
    updateView: function( requestqueue ){
	let table = $('reject-table');
	if(!table){ return; }

	clearTable(table);
	for(let i=0,item;item=requestqueue[i];i++){
	    this._addRejectView( table, item );
	}
    },

    init:function(){
	debugprint("NicoLiveRejectRequest.init");
    }
};

window.addEventListener("load", function() { NicoLiveRejectRequest.init(); }, false);
