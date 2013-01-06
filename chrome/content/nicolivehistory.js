
var NicoLiveHistory = {

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
     * リクエストリストに一個追加する
     */
    _addHistoryView:function(table,item){
	let tr = table.insertRow(table.rows.length);
	tr.className = "table_played";

	let td;
	td = tr.insertCell(tr.cells.length);
	td.appendChild(document.createTextNode("#"+table.rows.length));

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
	button.setAttribute("oncommand","NicoLiveHistory.playHistory(event);");
	hbox.appendChild(button);

	vbox.appendChild(hbox);
	td.appendChild(vbox);
    },

    /**
     * 再生履歴表示の末尾にひとつ追加する.
     */
    addPlayList: function(videoinfo){
	let table = $('playlist-table');
	if( !table ) return;
	this._addHistoryView( table, videoinfo );
    },

    getIndex: function(event){
	let tr = FindParentElement(event.target,'html:tr');
	let n = tr.sectionRowIndex;
	return n;
    },

    /**
     * 再生履歴から再生する.
     * @param event 再生ボタンのoncommandイベント
     */
    playHistory: function(event){
	let n = this.getIndex(event);
	debugprint("Play History: #"+n);
	NicoLiveHelper.playHistory(n);
    },

    /**
     * リクエストの表示を全更新する.
     */
    updateView: function( requestqueue ){
	let table = $('playlist-table');
	if(!table){ return; }

	clearTable(table);
	for(let i=0,item;item=requestqueue[i];i++){
	    this._addHistoryView( table, item );
	}
    },

    init:function(){
	debugprint("NicoLiveHistory.init");
    }
};

window.addEventListener("load", function() { NicoLiveHistory.init(); }, false);
