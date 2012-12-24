
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

	let n = table.rows.length;
	tr.setAttribute("stock-index",n); // 1,2,3,...

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
    },

    addStock: function(text){
	if(text.length<3) return;
	let l = text.match(/(sm|nm|so|im)\d+|\d{10}/g);
	for(let i=0,id;id=l[i];i++){
	    NicoLiveHelper.addStock(id);
	}
	$('input-stock').value="";
    },

    init:function(){
	debugprint("NicoLiveStock.init");
    }
};

window.addEventListener("load", function() { NicoLiveStock.init(); }, false);
