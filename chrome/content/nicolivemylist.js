
var NicoLiveMylist = {


    readMylistGroup: function(){
	let f = function(xml,req){
	    if( req.readyState==4 && req.status==200 ){
		NicoLiveMylist.mylists = JSON.parse(req.responseText);

		if( NicoLiveMylist.mylists.status=='fail'){
		    ShowNotice(LoadString('STR_ERR_MYLIST_HEADER')+NicoLiveMylist.mylists.error.description);
		    return;
		}
		/*
		let mylists = NicoLiveMylist.mylists.mylistgroup;
		let elem;
		for(let i=0,item;item=mylists[i];i++){
		    let tmp = item.name.match(/.{1,20}/);

		    // マイリスト読み込み(stock)
		    elem = CreateMenuItem(tmp,item.id);
		    elem.setAttribute("tooltiptext",item.name);
		    elem.setAttribute("oncommand","NicoLiveMylist.addStockFromMylist(event.target.value,event.target.label);");
		    $('menupopup-from-mylist').appendChild(elem);

		    // マイリスト読み込み(db)
		    elem = CreateMenuItem(tmp,item.id);
		    elem.setAttribute("tooltiptext",item.name);
		    elem.setAttribute("oncommand","NicoLiveMylist.addDatabase(event.target.value,event.target.label);");
		    $('menupopup-from-mylist-to-db').appendChild(elem);
		}
		 */
	    }
	};
	NicoApi.getmylistgroup( f );
    },

    init: function(){
	this.readMylistGroup();
    }
};


window.addEventListener("load", function(){ NicoLiveMylist.init(); }, false);
