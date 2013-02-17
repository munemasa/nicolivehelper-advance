
var NicoLiveStock = {

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
    _addStockView:function(table,item){
	let tr = table.insertRow(table.rows.length);
	tr.className = "table_casterselection";

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
	button.setAttribute("oncommand","NicoLiveStock._playStock(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/go-top.png');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveStock.goTopStock(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/direction_up.png');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveStock.moveUpStock(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/direction_down.png');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveStock.moveDownStock(event);");
	hbox.appendChild(button);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/go-bottom.png');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveStock.goBottomStock(event);");
	hbox.appendChild(button);

	let spacer = CreateElement('spacer');
	spacer.setAttribute('flex','1');
	hbox.appendChild(spacer);

	button = CreateElement('toolbarbutton');
	button.setAttribute('image','data/remove.png');
	button.setAttribute('label','削除');
	button.setAttribute('class','command-button');
	button.setAttribute("oncommand","NicoLiveStock.removeStock(event);");
	hbox.appendChild(button);

	vbox.appendChild(hbox);
	td.appendChild(vbox);
    },

    /**
     * リクエスト表示の末尾にひとつ追加する.
     */
    addStockView: function(videoinfo){
	let table = $('stock-table');
	if( !table ) return;
	this._addStockView( table, videoinfo );

	let t = NicoLiveHelper.getTotalPlayTime( NicoLiveHelper.stock_list );
	$('stock-playtime').value = LoadFormattedString('STR_FORMAT_NUMBER_OF_REQUEST',[t.min, t.sec, NicoLiveHelper.stock_list.length]);
    },

    addStock: function(text){
	if(text.length<3) return;
	let l = text.match(/(sm|nm|so|im)\d+|\d{10}/g);
	for(let i=0,id;id=l[i];i++){
	    NicoLiveHelper.addStock(id);
	}
	$('input-stock').value="";
    },

    getIndex: function(event){
	let tr = FindParentElement(event.target,'html:tr');
	let n = tr.sectionRowIndex;
	return n;
    },

    /**
     * ストックを再生する.
     * @param event 再生ボタンのoncommandイベント
     */
    _playStock: function(event){
	let n = this.getIndex(event);
	this.playStock(n);
    },
    /**
     * ストックを再生する.
     */
    playStock: function(n){
	if( NicoLiveHelper.isOffline() ) return;

	debugprint("Play Stock: #"+n);
	NicoLiveHelper.playStock(n);

	let tr = evaluateXPath(document,"//html:table[@id='stock-table']//html:tr")[n];
	tr.className = "table_played";
	//this.resetStockIndex(); // いらないはず
    },

    /**
     * リクエストを削除する
     * @param event 削除ボタンのoncommandのイベント
     */
    removeStock: function(event){
	let n = this.getIndex(event);
	debugprint("Remove Stock: #"+n);
	NicoLiveHelper.removeStock(n);

	let tr = FindParentElement(event.target,'html:tr');
	RemoveElement( tr );
	this.resetStockIndex();
    },

    swapStock: function( n1, n2 ){
	let rows = evaluateXPath( document, "//html:table[@id='stock-table']//html:tr//*[@class='vinfo']");
	
	let parent1, parent2;
	parent1 = rows[n1].parentNode;
	parent2 = rows[n2].parentNode;

	let tmp1, tmp2;
	tmp1 = rows[n1].cloneNode(true);
	tmp2 = rows[n2].cloneNode(true);

	parent1.replaceChild( tmp2, rows[n1] );
	parent2.replaceChild( tmp1, rows[n2] );
    },

    moveUpStock: function(event){
	let n = this.getIndex(event);
	if( n>=1 ){
	    this.swapStock( n, n-1 );
	    NicoLiveHelper.swapRequest( n, n-1, NicoLiveHelper.stock_list );
	    this.resetStockIndex();
	}
    },
    moveDownStock: function(event){
	let n = this.getIndex(event);
	if( n<NicoLiveHelper.stock_list.length-1 ){
	    this.swapStock( n, n+1 );
	    NicoLiveHelper.swapRequest( n, n+1, NicoLiveHelper.stock_list );
	    this.resetStockIndex();
	}
    },

    goTopStock: function(event){
	let n = this.getIndex(event);
	if( n>0 ){
	    let rows = evaluateXPath( document, "//html:table[@id='stock-table']//html:tr");
	    let tmp = rows[n].cloneNode(true);
	    RemoveElement( rows[n] );
	    rows[0].parentNode.insertBefore( tmp, rows[0] );
	    NicoLiveHelper.goTopRequest( n, NicoLiveHelper.stock_list );
	    this.resetStockIndex();
	}
    },
    goBottomStock: function(event){
	let n = this.getIndex(event);
	if( n<NicoLiveHelper.stock_list.length-1 ){
	    let rows = evaluateXPath( document, "//html:table[@id='stock-table']//html:tr");
	    let tmp = rows[n].cloneNode(true);
	    let parentNode = rows[0].parentNode;
	    RemoveElement( rows[n] );
	    parentNode.appendChild( tmp );
	    NicoLiveHelper.goBottomRequest( n, NicoLiveHelper.stock_list );
	    this.resetStockIndex();
	}
    },


    /**
     * リクエストの番号表記と背景色を1から付け直す。
     */
    resetStockIndex: function(){
	let tr = $('stock-table').getElementsByTagName('html:tr');	
	for(let i=0,row;row=tr[i];i++){
	    let td = row.firstChild;
	    let item = NicoLiveHelper.stock_list[i];

	    row.className = (i+1)%2?"table_oddrow":"table_evenrow";
	    if( item.is_played ){
		row.className = "table_played";
	    }else if( item.is_casterselection ){
		row.className = "table_casterselection";
	    }

	    RemoveChildren( td );
	    td.appendChild( document.createTextNode('#'+(i+1)));
	    // TODO 先頭から何分後にあるかの表示 ストックでは不要かな
	    /*
	    let t;
	    t = GetTimeString( 0 );
	    td.appendChild(CreateHTMLElement('br'));
	    td.appendChild(document.createTextNode("+"+t));
	     */
	}
    },

    /**
     * リクエストの表示を全更新する.
     */
    updateView: function( requestqueue ){
	let table = $('stock-table');
	if(!table){ return; }

	clearTable(table);
	for(let i=0,item;item=requestqueue[i];i++){
	    this._addStockView( table, item );
	}

	let t = NicoLiveHelper.getTotalPlayTime( requestqueue );
	$('stock-playtime').value = LoadFormattedString('STR_FORMAT_NUMBER_OF_REQUEST',[t.min, t.sec, requestqueue.length]);
    },

    init:function(){
	debugprint("NicoLiveStock.init");
    }
};

window.addEventListener("load", function() { NicoLiveStock.init(); }, false);
