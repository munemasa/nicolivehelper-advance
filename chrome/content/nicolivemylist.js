
var NicoLiveMylist = {
    mylists: {},               // マイリストグループ
    mylist_itemdata: {},       // 動画のマイリスト登録日とマイリストコメント



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
