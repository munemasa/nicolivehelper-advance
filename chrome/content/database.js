/*
Copyright (c) 2009 amano <amano@miku39.jp>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

var StarRateCache;

/**
 * 動画データベースなど
 */

/* TABLE nicovideo
 * video_id       : character primary key 動画ID
 * title          : character 動画タイトル
 * description    : character 動画詳細
 * thumbnail_url  : character サムネイルURL
 * first_retrive  : integer 動画投稿日時
 * length         : integer 長さ
 * view_counter   : integer 再生数
 * comment_num    : integer コメント数
 * mylist_counter : integer マイリスト数
 * tags           : character タグ(カンマ区切りの文字列, jpタグのみ)
 * update_date    : integer DB情報の更新日時
 * favorite       : integer (0.7.3+) お気に入り度
 * pname          : character (0.7.2+) 動画固有P名 (※0.8で廃止)
 * additional     : character (0.7.2+) 動画固有の追加情報 (※0.8で廃止)
 */
/* TABLE requestcond (0.7.3+)
 * presetname : character primary key プリセット名
 * value      : character リクエスト条件(JSON)
 */
/* TABLE gpstorage (0.8+)
 * key   : character キー
 * value : character 値(JSON)
 */
/* TABLE pname (0.8+) P名と追加情報を記録
 * video_id : character primary key
 * pname    : character
 * additional : character
 */
/* TABLE folder (1.1.1+)
 * id       : integer primary key
 * type     : integer (0:folder, 1:video 2:smart folder)
 * parent   : integer (parent id)
 * name     : character (フォルダ名)
 * video_id : character (動画ID) スマートフォルダの場合はルールを格納する
 */

var Database = {
    dbconnect: null, // DBへの接続オブジェクト
    jobs: {},        // DB追加・更新ジョブリスト. 動画IDをキーにしたObjectで.
    
    searchresult: [],
    searchresult_node: null,

    pnamecache: {},

    numvideos: 0,
    addcounter: 0,
    updatecounter: 0,
    searchtarget: ["title","length","view_counter","comment_num","mylist_counter","tags","first_retrieve","video_id","description"],
    searchcond: ["include","exclude","gte","equal","lte"],

    /**
     * 残りのジョブ数を返す.
     */
    getRemainJobs: function(){
	let n = 0;
	for( k in this.jobs ){
	    n++;
	}
	return n;
    },

    /**
     * 現在再生中の曲をDBに登録.
     */
    addCurrentPlayedVideo:function(){
	Database.addDatabase( NicoLiveHelper.getCurrentVideoInfo() );
    },

    /**
     * 動画(複数)をDBに追加する.
     * 非同期処理。このメソッドでは10桁IDは取り込まない。
     * 処理残りをDBのラベルに表示しつつ、ジョブが空になるとコールバックを呼び出す。
     * 処理が完了するまでは、続けて呼び出せない。
     * @param sm 動画ID(sm,nm)やマイリスト
     * @param callback 全ての追加処理が終わったときに呼ばれるコールバック関数
     */
    addVideos:function(sm, callback){
	// sm/nm番号のテキストで渡す.
	if(sm.length<3) return;
	if( this._callback ) return;

	$('db-label').value="";
	$('input-db').value="";

	this.jobs = new Object();
	try{
	    let l;
	    l = sm.match(/mylist\/\d+/g);
	    if(l){
		// マイリスト
		for(let i=0,mylist;mylist=l[i];i++){
		    let id = mylist.match(/mylist\/(\d+)/)[1];
		    // マイリストからsm,nmを拾って再びaddVideos()する
		    NicoLiveMylist.addDatabase(id,"",callback);
		}
		return;
	    }
	    l = sm.match(/(sm|nm)\d+/g);
	    this.numvideos = l.length;
	    this.addcounter = 0;
	    this.updatecounter = 0;
	    for(let i=0,id;id=l[i];i++){
		this.jobs[id] = true; // ジョブに追加
		this.addOneVideoAsync(id);
	    }
	    let str = "処理残り:"+Database.getRemainJobs();
	    $('db-label').value = str;
	    $('folder-listitem-num').value = str;

	    this._callback = setInterval(
		function(){
		    let str = "処理残り:"+Database.getRemainJobs();
		    $('db-label').value = str;
		    $('folder-listitem-num').value = str;
		    if( Database.getRemainJobs()==0 ){
			if( 'function'==typeof callback){
			    callback();
			}
			clearInterval( Database._callback );
			Database._callback = null;
		    }
		}, 1000 );
	} catch (x) {
	}
    },

    /**
     * DBに動画を1件追加する.
     * 動画情報を取得し、追加もしくは更新を行う。
     * 非同期処理で行う.
     * @param id 動画ID
     */
    addOneVideoAsync:function(id){
	// 動画IDで渡す.
	if(id.length<3) return;
	let f = function(xml,req){
	    if( req.readyState==4 ){
		if( req.status==200 ){
		    try{
			let music = NicoLiveHelper.extractVideoInfo(req.responseXML);
			if( music ){
			    Database.addDatabase(music);
			}
		    } catch (x) {
			// XML内容の異常とか
			debugprint(x);
			delete Database.jobs[id];
		    }
		}else{
		    // 通信失敗
		    debugprint("DB http status="+req.status);
		    delete delete Database.jobs[id];
		}
	    }
	};
	NicoApi.getthumbinfo( id, f );
    },

    /**
     * DBの情報を最新に更新する.
     * 非同期処理
     * @param id 動画ID
     */
    updateOneVideoAsync:function(id){
	// 動画IDで渡す.
	if(id.length<3) return;
	let f = function(xml,req){
	    if( req.readyState==4 && req.status==200 ){
		try{
		    let music = NicoLiveHelper.extractVideoInfo(req.responseXML);
		    Database.updateRowAsync(music);
		} catch (x) {
		    debugprint(id+'は削除されています(x='+x+')');
		}
	    }
	};
	NicoApi.getthumbinfo( id, f );
    },

    /**
     * DBに動画情報を追加する.
     * 非同期処理で行う場合、insertに失敗したらupdateを行う。
     * 同期処理の場合、insert失敗したら、それまで。
     * @param music 動画情報
     * @param dosync trueのとき同期処理
     */
    addDatabase:function(music,dosync){
	// NicoLiveHelper.extractVideoInfo()が作る構造でmusicを渡す.
	let st;

	// try insert
	//debugprint('try insert');
	st = this.dbconnect.createStatement('insert into nicovideo(video_id,title,description,thumbnail_url,first_retrieve,length,view_counter,comment_num,mylist_counter,tags,update_date) values(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)');
	st.bindUTF8StringParameter(0,music.video_id);
	st.bindUTF8StringParameter(1,music.title);
	st.bindUTF8StringParameter(2,music.description);
	st.bindUTF8StringParameter(3,music.thumbnail_url);
	st.bindInt32Parameter(4,music.first_retrieve);
	st.bindInt32Parameter(5,music.length_ms/1000);
	st.bindInt32Parameter(6,music.view_counter);
	st.bindInt32Parameter(7,music.comment_num);
	st.bindInt32Parameter(8,music.mylist_counter);
	st.bindUTF8StringParameter(9,music.tags['jp'].join(',')); // タグは日本語タグのみで
	st.bindInt32Parameter(10,GetCurrentTime());

	let callback = {
	    handleCompletion:function(reason){
		if(!this.error){
		    // 追加に成功
		    delete Database.jobs[music.video_id];
		    StarRateCache["_"+music.video_id] = 0;
		}
	    },
	    handleError:function(error){
		// insertが失敗のときはすでに行があるのでupdateにする.
		//debugprint('insert error/'+error.result+'/'+error.message);
		Database.updateRowAsync(music);
		this.error = true;
	    },
	    handleResult:function(result){
	    }
	};
	if(dosync){
	    st.execute();
	}else{
	    st.executeAsync(callback);
	}
    },

    /**
     * DBを更新する.
     * 非同期処理
     * @param music 動画情報
     */
    updateRowAsync:function(music){
	let st = this.dbconnect.createStatement('update nicovideo set title=?1,description=?2,thumbnail_url=?3,first_retrieve=?4,length=?5,view_counter=?6,comment_num=?7,mylist_counter=?8,tags=?9,update_date=?10 where video_id=?11');
	st.bindUTF8StringParameter(0,music.title);
	st.bindUTF8StringParameter(1,music.description);
	st.bindUTF8StringParameter(2,music.thumbnail_url);
	st.bindInt32Parameter(3,music.first_retrieve);
	st.bindInt32Parameter(4,music.length_ms/1000);
	st.bindInt32Parameter(5,music.view_counter);
	st.bindInt32Parameter(6,music.comment_num);
	st.bindInt32Parameter(7,music.mylist_counter);
	st.bindUTF8StringParameter(8,music.tags['jp'].join(','));
	st.bindInt32Parameter(9,GetCurrentTime());
	st.bindUTF8StringParameter(10,music.video_id);
	//debugprint('update '+music.video_id);
	let callback = {
	    handleCompletion:function(reason){
		delete Database.jobs[music.video_id];
	    },
	    handleError:function(error){
		debugprint('update error'+error.result+'/'+error.message);
	    },
	    handleResult:function(result){
	    }
	};
	st.executeAsync(callback);
    },

    /**
     * 動画DB内にデータがあるかどうか.
     * @param sm 動画ID
     * @return DBにデータがあればtrueを返す
     */
    isInDB:function(sm){
	let st = this.dbconnect.createStatement('SELECT * FROM nicovideo WHERE video_id = ?1');
	let isexist = false;
	try{
	    st.bindUTF8StringParameter(0,sm);
	    while(st.step()){
		isexist = true;
	    }
	    st.finalize();
	} catch (x) {
	    debugprint(x);
	    isexist = false;
	}
	return isexist;
    },

    removeSearchLine:function(e){
	let hbox = $('search-condition').getElementsByTagName('hbox');
	if(hbox.length<=1) return;
	$('search-condition').removeChild(e.target.parentNode);
    },

    /**
     * 検索条件入力行を追加する.
     */
    addSearchLine:function(){
	let menulist;
	let elem;
	let hbox = CreateElement('hbox');
	elem = CreateElement('menupopup');
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_TITLE"),0));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_LENGTH"),1));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_VIEWS"),2));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_COMMENTS"),3));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_MYLISTS"),4));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_TAGS"),5));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_POSTEDDATE"),6));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_VIDEOID"),7));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_DESC"),8));
	menulist = CreateElement('menulist');
	menulist.setAttribute("oncommand","Database.search();");
	menulist.appendChild(elem);
	hbox.appendChild(menulist);

	elem = CreateElement('menupopup');
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_INCLUDE"),0));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_EXCLUDE"),1));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_GTE"),2));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_EQUAL"),3));
	elem.appendChild(CreateMenuItem(LoadString("STR_DBCOND_LTE"),4));
	menulist = CreateElement('menulist');
	menulist.setAttribute("oncommand","Database.search();");
	menulist.appendChild(elem);
	hbox.appendChild(menulist);

	elem = CreateElement('textbox');
	elem.setAttribute('flex','1');
	elem.setAttribute('type','search');
	//elem.setAttribute('autocompletesearch','form-history');
	elem.setAttribute("oncommand","Database.search();");
	elem.setAttribute('timeout','2000');
	hbox.appendChild(elem);

	//elem = CreateButton('+');
	//elem.addEventListener('command',function(e){ Database.addSearchLine();}, false);
	elem = CreateHTMLElement('input');
	elem.setAttribute('type','button');
	elem.setAttribute('value','+');
	elem.setAttribute("onclick","Database.addSearchLine();");
	hbox.appendChild(elem);

	//elem = CreateButton('-');
	//elem.addEventListener('command',function(e){ Database.removeSearchLine(e);}, false);
	elem = CreateHTMLElement('input');
	elem.setAttribute('type','button');
	elem.setAttribute('value','-');
	elem.setAttribute("onclick","Database.removeSearchLine(event);");
	hbox.appendChild(elem);
	$('search-condition').appendChild(hbox);
    },

    /**
     * 検索を実行する.
     */
    search:function(){
	clearInterval(this._updatehandle);

	let hbox = $('search-condition').getElementsByTagName('hbox');
	let sql = "select *,1000*mylist_counter/view_counter as mylist_rate from nicovideo where ";
	let cnt;
	let cond = [];
	let i,item;
	// statementを作るフェーズ.
	for(i=0,cnt=0;item=hbox[i];i++){
	    let menulist = item.getElementsByTagName('menulist');
	    let textbox  = item.getElementsByTagName('textbox');
	    if(!textbox[0].value) continue;
	    // 検索項目.
	    let tmp;
	    tmp = this.searchtarget[parseInt(menulist[0].value)] +" ";

	    cnt++;
	    switch(this.searchcond[parseInt(menulist[1].value)]){
	    case "include": tmp += "like ?"+cnt; break;
	    case "exclude": tmp += "not like ?"+cnt; break;
	    case "gte":     tmp += ">=?"+cnt; break;
	    case "equal":   tmp += "=?"+cnt; break;
	    case "lte":     tmp += "<=?"+cnt; break;
	    default: debugprint("unknown condition"); continue;
	    }
	    cond[cnt-1] = tmp;
	}
	if(cnt<=0) return;

	sql += cond.join(' and '); // 条件は全部andで.
	if( $('db-search-order').value == "random" ){
	    sql += " order by random()";
	}else{
	    sql += " order by " + $('db-search-orderby').value;
	    sql += " " + $('db-search-order').value;
	}
	sql += " limit 0," + parseInt($('db-search-max').value);
	debugprint('sql='+sql);

	let st = this.dbconnect.createStatement(sql);
	// bindするフェーズ.
	for(i=0,cnt=0;item=hbox[i];i++){
	    let menulist = item.getElementsByTagName('menulist');
	    let textbox  = item.getElementsByTagName('textbox');
	    if(!textbox[0].value) continue;

	    switch(this.searchcond[parseInt(menulist[1].value)]){
	    case "include":
	    case "exclude":
		if(this.searchtarget[parseInt(menulist[0].value)]=="video_id"){
		    try{
			let vid = textbox[0].value.match(/(sm|nm)\d+/g)[0];
			st.bindUTF8StringParameter(cnt,"%"+vid+"%");
		    } catch (x) {
			st.bindUTF8StringParameter(cnt,"%"+textbox[0].value+"%");
		    }
		}else{
		    st.bindUTF8StringParameter(cnt,"%"+textbox[0].value+"%");
		}
		break;
	    case "gte":
	    case "equal":
	    case "lte":
		let tmp;
		if(this.searchtarget[parseInt(menulist[0].value)]=="first_retrieve"){
		    let date;
		    let d;
		    date = textbox[0].value.match(/\d+/g);
		    if(date.length==6){
			d = new Date(date[0],date[1]-1,date[2],date[3],date[4],date[5]);
			tmp = parseInt(d.getTime() / 1000); // integer
		    }else{
			d = new Date(date[0],date[1]-1,date[2],0,0,0);
			tmp = parseInt(d.getTime() / 1000); // integer
		    }
		}else{
		    tmp = parseInt(textbox[0].value);
		}
		st.bindInt64Parameter(cnt,tmp);
		break;
	    default: debugprint("unknown condition"); continue;
	    }
	    cnt++;
	}

	let callback = {
	    handleCompletion:function(reason){
		$('db-label').value = LoadFormattedString('STR_DBRESULT',[Database.searchresult.length]);
		// 検索した動画を即時更新は重そうなので今のところはやめておく
		//Database.updateDatabase( Database.searchresult );
	    },
	    handleError:function(error){
		//debugprint('search error/'+error.result+'/'+error.message);
	    },
	    handleResult:function(result){
		let row;
		while(row = result.getNextRow()){
		    let music=Database.rowToVideoInfo(row);
		    Database.addSearchResult(music);
		    Database.searchresult.push(music);
		}
	    }
	};

	RemoveChildren( this.searchresult_node );

	this.searchresult = new Array();
	st.executeAsync(callback);
    },

    /**
     *  データベースを更新する.
     * @param movies 動画情報の配列
     */
    updateDatabase:function(movies){
	clearInterval(this._updatehandle);
	if(!movies) return;

	$('db-label').value = "検索結果の動画情報を更新しています...";
	this.delayedUpdate(movies);
	this._updatehandle = setInterval(
	    function(){
		Database.delayedUpdate(movies);
	    }, 10*1000 );
    },
    delayedUpdate:function(movies){
	let now = GetCurrentTime();
	let cnt=0;
	for(let i=0,item;item=movies[i];i++){
	    if (cnt<10 && !item.done && (now-item.update_date) > 60*60*1 ){
	    //if (cnt<10 && !item.done ){
		cnt++;
		item.done = true;
		this.updateOneVideoAsync(item.video_id);
	    }
	}
	debugprint('updating db...'+cnt);
	if(cnt==0){
	    clearInterval(this._updatehandle);
	    $('db-label').value = "更新終了しました";
	    debugprint('updating done.');
	}
    },

    /**
     * 動画情報を表示するリストアイテム要素を作成.
     * @param item 動画情報(VideoInfo)
     */
    createListItemElement:function(item){
	let posteddate = GetDateString(item.first_retrieve*1000);

	let listitem = CreateElement('listitem');
	listitem.setAttribute('vid',item.video_id);
	let str = restorehtmlspecialchars(item.title) + "\nタグ: " + item.tags.join(' ');
	listitem.setAttribute("tooltiptext",str);

	let hbox = CreateElement('hbox');
	let image = CreateElement('image');
	image.setAttribute('src',item.thumbnail_url);
	image.setAttribute('style','-moz-box-align:center;width:98px;height:75px;margin-right:4px;');
	image.setAttribute('validate','never');
	let div = CreateHTMLElement('div');
	let rate = GetFavRateString(item.favorite);
	div.innerHTML = item.video_id + " "+(item.title)+"<br/>"
	    + "投稿日:"+posteddate+" 時間:"+item.length+"<br/>"
	    + "再生:"+FormatCommas(item.view_counter)
	    + " コメント:"+FormatCommas(item.comment_num)
	    + " マイリスト:"+FormatCommas(item.mylist_counter)
	    + " レート:"+rate +"<br/>"
	    + "タグ:"+item.tags.join(' ');

	let vbox = CreateElement('vbox');
	vbox.appendChild(image);
	hbox.appendChild(vbox);
	hbox.appendChild(div);
	listitem.appendChild(hbox);
	return listitem;
    },

    /**
     * 検索結果を表示する<listbox>に1つ追加する.
     * 
     */
    addSearchResult:function(item){
	let listitem = this.createListItemElement(item);
	this.searchresult_node.appendChild( listitem );
    },

    /**
     * テーブルの行を動画情報に変換.
     * tagsはただの配列になっているのに注意
     * @param row SQLクエリのリザルト行
     */
    rowToVideoInfo:function(row){
	let info = new Object();
	// innerHTMLで流し込むのでhtmlspecialcharsを使う.
	info.video_id       = row.getResultByName('video_id');
	info.title          = htmlspecialchars(row.getResultByName('title'));
	info.description    = htmlspecialchars(row.getResultByName('description'));
	info.thumbnail_url  = row.getResultByName('thumbnail_url');
	info.first_retrieve = row.getResultByName('first_retrieve');
	info.length         = row.getResultByName('length');
	info.length_ms      = info.length*1000;
	info.length         = GetTimeString(info.length);
	info.view_counter   = row.getResultByName('view_counter');
	info.comment_num    = row.getResultByName('comment_num');
	info.mylist_counter = row.getResultByName('mylist_counter');
	let tags            = htmlspecialchars(row.getResultByName('tags'));
	info.tags           = tags.split(/,/);
	//info.pname          = row.getResultByName('pname');
	info.update_date    = row.getResultByName('update_date');
	info.favorite       = row.getResultByName('favorite');
	return info;
    },

    /**
     * 動画DBに登録済みの数を表示する.
     */
    setRegisterdVideoNumber:function(){
	let st = this.dbconnect.createStatement('SELECT count(video_id) FROM nicovideo');
	let n = 0;
	while(st.executeStep()){
	    n = st.getInt32(0);
	}
	st.finalize();
	$('db-label').value = LoadFormattedString('STR_DB_REGISTERED_NUM',[n]);
    },

    /**
     * P名設定
     * @param video_id 動画ID
     * @param pname P名
     */
    setPName:function(video_id, pname){
	let st;
	try{
	    st = this.dbconnect.createStatement('insert into pname(video_id,pname) values(?1,?2)');
	    st.bindUTF8StringParameter(0,video_id);
		st.bindUTF8StringParameter(1,pname);
	    st.execute();
	    st.finalize();
	} catch (x) {
	    st = this.dbconnect.createStatement('update pname set pname=?1 where video_id=?2');
	    st.bindUTF8StringParameter(0,pname);
	    st.bindUTF8StringParameter(1,video_id);
	    st.execute();
	    st.finalize();
	}
	this.pnamecache["_"+video_id] = pname;
    },

    /**
     * P名を取得する.
     * @param video_id 動画ID
     */
    getPName:function(video_id){
	if( this.pnamecache["_"+video_id] ) return this.pnamecache["_"+video_id];
	let pname = "";

	try{
	    let st = this.dbconnect.createStatement('SELECT pname FROM pname WHERE video_id = ?1');
	    st.bindUTF8StringParameter(0,video_id);
	    while(st.step()){
		pname = st.getString(0);
	    }
	    st.finalize();
	    if(!pname) pname = "";
	    if(pname){
		this.pnamecache["_"+video_id] = pname;
	    }
	} catch (x) {
	    pname = "";
	}
	return pname;
    },

    /**
     * 追加情報の記入.
     * @param video_id 動画ID
     * @param additional 追加情報(text)
     */
    setAdditional:function(video_id, additional){
	let st;
	try{
	    st = this.dbconnect.createStatement('insert into pname(video_id,additional) values(?1,?2)');
	    st.bindUTF8StringParameter(0,video_id);
	    st.bindUTF8StringParameter(1,additional);
	    st.execute();
	    st.finalize();
	} catch (x) {
	    st = this.dbconnect.createStatement('update pname set additional=?1 where video_id=?2');
	    st.bindUTF8StringParameter(0,additional);
	    st.bindUTF8StringParameter(1,video_id);
	    st.execute();
	    st.finalize();
	}
    },

    /**
     * 追加情報の取得.
     * @param video_id 動画ID
     */
    getAdditional:function(video_id){
	let st = this.dbconnect.createStatement('SELECT additional FROM pname WHERE video_id = ?1');
	let additional;
	st.bindUTF8StringParameter(0,video_id);
	while(st.step()){
	    additional = st.getString(0);
	}
	st.finalize();
	if(!additional) additional = "";
	return additional;
    },

    /**
     * レート(お気に入り度)をセット.
     * @param e eventオブジェクト
     * @param node メニューがポップアップしたノード(nullの場合はvidを指定)
     * @param vid 動画ID
     */
    setFavorite:function(e,node,vid){
	let video_id;
	if(vid){
	    video_id = vid;
	}else{
	    let elem = FindParentElement(node,'vbox');
	    video_id = elem.getAttribute('nicovideo_id');
	}
	let rate = e.target.value;

	// ツールチップのテキストを更新
	// TODO
	let videolist = evaluateXPath(document,"//html:table[@class='requestview' or @class='historyview']/descendant::html:tr/descendant::*[@nicovideo_id='"+video_id+"']");

	for(let i=0,item; item=videolist[i]; i++){
	    if( video_id==item.getAttribute('nicovideo_id') ){
		try{
		    let tooltip="レート:"+GetFavRateString(rate);
		    let oldtooltip = item.getAttribute("tooltiptext");
		    tooltip = oldtooltip.replace(/^レート:.*$/m,tooltip);
		    item.setAttribute('tooltiptext',tooltip);
		} catch (x) {
		}
	    }
	}

	if( this.getFavorite(video_id)<0 ){
	    // 動画DBにデータがないので追加した通知.
	    ShowNotice( LoadFormattedString('STR_ERR_RATE_NOT_SAVED',[video_id]) );
	    let videoinfo = NicoLiveHelper.findVideoInfoFromMemory(video_id);
	    if( videoinfo ){
		this.addDatabase(videoinfo,true);// do synchronized operation.
	    }
	}

	let st;
	try{
	    st = this.dbconnect.createStatement('update nicovideo set favorite=?1 where video_id=?2');
	    st.bindUTF8StringParameter(0,rate);
	    st.bindUTF8StringParameter(1,video_id);
	    st.execute();
	    st.finalize();
	} catch (x) {
	}
	StarRateCache["_"+video_id] = rate;
    },

    /**
     * スターレーティングの値を取得.
     * @param video_id 動画ID
     */
    getFavorite:function(video_id){
	if( StarRateCache["_"+video_id] ) return StarRateCache["_"+video_id];

	let rate = -1;
	try{
	    let st = this.dbconnect.createStatement('SELECT favorite FROM nicovideo WHERE video_id = ?1');
	    st.bindUTF8StringParameter(0,video_id);
	    while(st.step()){
		rate = st.getInt32(0);
	    }
	    st.finalize();
	    if(!rate) rate = 0;
	    StarRateCache["_"+video_id] = rate;
	} catch (x) {
	    rate = 0;
	}
	return rate;
    },

    /**
     * レート(お気に入り度)をセット.
     * 動画DBリザルトなどの<listitem>表示での使用。
     * @param e eventオブジェクト
     */
    setFavoriteViaListitem:function(e){
	let video_id = $('db-search-result').selectedItem.getAttribute('vid');
	let rate = e.target.value;

	// ツールチップのテキストを更新
	// TODO
	let videolist = evaluateXPath(document,"//html:table[@class='requestview' or @class='historyview']/descendant::html:tr/descendant::*[@nicovideo_id='"+video_id+"']");

	for(let i=0,item; item=videolist[i]; i++){
	    if( video_id==item.getAttribute('nicovideo_id') ){
		try{
		    let tooltip="レート:"+GetFavRateString(rate);
		    let oldtooltip = item.getAttribute("tooltiptext");
		    tooltip = oldtooltip.replace(/^レート:.*$/m,tooltip);
		    item.setAttribute('tooltiptext',tooltip);
		} catch (x) {
		}
	    }
	}

	if( this.getFavorite(video_id)<0 ){
	    // 動画DBにデータがないので追加した通知.
	    ShowNotice( LoadFormattedString('STR_ERR_RATE_NOT_SAVED',[video_id]) );
	    let videoinfo = NicoLiveHelper.findVideoInfoFromMemory(video_id);
	    if( videoinfo ){
		this.addDatabase(videoinfo,true);// do synchronized operation.
	    }
	}

	let st;
	try{
	    st = this.dbconnect.createStatement('update nicovideo set favorite=?1 where video_id=?2');
	    st.bindUTF8StringParameter(0,rate);
	    st.bindUTF8StringParameter(1,video_id);
	    st.execute();
	    st.finalize();
	} catch (x) {
	}
	StarRateCache["_"+video_id] = rate;
    },

    /**
     * レート設定メニューが開かれるとき.
     * @param e eventオブジェクト
     * @param node メニューがポップアップしたノード(nullの場合はvidを指定)
     * @param vid 動画ID
     */
    showingRateMenuViaListitem:function(e,node,vid){
	try{
	    let video_id = $('db-search-result').selectedItem.getAttribute('vid');
	    let rate = this.getFavorite(video_id);
	    if(rate<0) rate = 0;
	    let menuitems = evaluateXPath(e.target,"*");
	    for(let i=0,item;item=menuitems[i];i++){
		if(item.value==rate) item.setAttribute('checked','true');
		else item.setAttribute('checked','false');
	    }
	} catch (x) {
	    debugprint(x);
	}
	return true;
    },

    /**
     * レート設定メニューが開かれるとき.
     * @param e eventオブジェクト
     * @param node メニューがポップアップしたノード(nullの場合はvidを指定)
     * @param vid 動画ID
     */
    showingRateMenu:function(e,node,vid){
	let video_id;
	if(vid){
	    video_id = vid;
	}else{
	    let elem = FindParentElement(node,'vbox');
	    video_id = elem.getAttribute('nicovideo_id');
	}
	let rate = this.getFavorite(video_id);
	if(rate<0) rate = 0;
	let menuitems = evaluateXPath(e.target,"*");
	for(let i=0,item;item=menuitems[i];i++){
	    if(item.value==rate) item.setAttribute('checked','true');
	    else item.setAttribute('checked','false');
	}
	return true;
    },

    /**
     * 汎用ストレージにname,JavascriptオブジェクトをJSON形式で保存.
     * NicoLive Helper Advanceではデータ保存領域として使用しない。
     * Storageを使う。
     * @param name キー
     * @param obj バリュー
     */
    saveGPStorage:function(name,obj){
	let st;
	let value = JSON.stringify(obj);
	//Application.console.log(value);
	try{
	    st = this.dbconnect.createStatement('insert into gpstorage(key,value) values(?1,?2)');
	    st.bindUTF8StringParameter(0,name);
	    st.bindUTF8StringParameter(1,value);
	    st.execute();
	    st.finalize();
	} catch (x) {
	    st = this.dbconnect.createStatement('update gpstorage set value=?1 where key=?2');
	    st.bindUTF8StringParameter(0,value);
	    st.bindUTF8StringParameter(1,name);
	    st.execute();
	    st.finalize();
	}
    },

    /**
     * 汎用ストレージからJSON形式のJavascriptオブジェクトを読み込む.
     * @param name キー
     * @param defitem キーがなかったときのデフォルト値
     */
    loadGPStorage:function(name,defitem){
	let item;
	debugprint('load '+name);
	item = Application.storage.get(name,null);
	if(item!=null){
	    //debugprint("メモリからデータをロードします");
	    return item;
	}
	//debugprint("ストレージからデータをロードします");
	try{
	    let st = this.dbconnect.createStatement('SELECT value FROM gpstorage where key=?1');
	    st.bindUTF8StringParameter(0,name);
	    let value = "";
	    while(st.step()){
		value=st.getString(0);
	    }
	    st.finalize();
	    if(value){
		item = JSON.parse(value);
	    }else{
		item = defitem;
	    }
	} catch (x) {
	    debugprint(x);
	    debugprint("DBアクセスでエラーが発生したためデフォルト値になります");
	    item = defitem;
	}
	return item;
    },

    /**
     * 動画情報を保存するテーブルを作成.
     */
    createVideoDB:function(){
	if(!this.dbconnect.tableExists('nicovideo')){
	    // テーブルなければ作成.
	    this.dbconnect.createTable('nicovideo','video_id character primary key, title character, description character, thumbnail_url character, first_retrieve integer, length integer, view_counter integer, comment_num integer, mylist_counter integer, tags character, update_date integer, favorite integer');
	}
    },

    // リク制限を保存するDB
    // NicoLiveHelper Advanceでは未使用
    createRequestCondDB:function(){
	return;
	if(!this.dbconnect.tableExists('requestcond')){
	    this.dbconnect.createTable('requestcond','presetname character primary key, value character');
	}
    },

    // 汎用(General-Purpose)で使うDB
    // NicoLive Helper Advanceでは未使用
    createGPStorageDB:function(){
	return;
	if(!this.dbconnect.tableExists('gpstorage')){
	    this.dbconnect.createTable('gpstorage','key character primary key, value character');
	}
    },

    // P名、追加情報DB(0.8+)
    /**
     * P名、追加情報テーブルを作成する.
     */
    createPnameDB:function(){
	if(!this.dbconnect.tableExists('pname')){
	    this.dbconnect.createTable('pname','video_id character primary key, pname character, additional character');
	}
    },

    // フォルダDB(1.1.1+)
    /**
     * 動画DBのフォルダ管理用テーブルを作成する.
     */
    createFolderDB:function(){
	if(!this.dbconnect.tableExists('folder')){
	    this.dbconnect.createTable('folder','id integer primary key, type integer, parent integer, name character, video_id character, foreign key(video_id) references nicovideo(video_id)');
	}
    },

    /**
     * ファイルからDBに登録する.
     * 現在はsm|nmのみに対応。
     * @param file nsIFile
     */
    readFileToDatabase:function(file){
	// file は nsIFile
	let istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	istream.init(file, 0x01, 0444, 0);
	istream.QueryInterface(Components.interfaces.nsILineInputStream);

	// 行を配列に読み込む
	let line = {}, hasmore;
	let str = "";
	do {
	    hasmore = istream.readLine(line);
	    if( line.value.match(/(sm|nm)\d+/) ){
		str += line.value + " ";
	    }
	} while(hasmore);

	this.addVideos(str);
	istream.close();
    },

    checkDrag:function(event){
	event.preventDefault();
	return true;
    },

    /**
     * DBタブにドロップしたとき.
     * @param event DOMイベント
     */
    dropToDatabase:function(event){
	//this.dataTransfer = event.dataTransfer;

	// ファイルをドロップしたとき.
	let file = event.dataTransfer.mozGetDataAt("application/x-moz-file", 0);
	if (file instanceof Components.interfaces.nsIFile){
	    if( !file.leafName.match(/\.txt$/) ) return;
	    debugprint("file dropped:"+file.path);
	    this.readFileToDatabase(file);
	    return;
	}

	if( event.dataTransfer.types.contains('text/plain') ){
	    let txt = event.dataTransfer.mozGetDataAt("text/plain",0);
	    this.addVideos(txt);
	    return;
	}
	// アンカーをドロップしたとき.
	if( event.dataTransfer.types.contains("text/uri-list") ){
	    let uri = event.dataTransfer.mozGetDataAt("text/uri-list",0);
	    debugprint("uri dropped:"+uri);
	    this.addVideos(uri);
	    return;
	}
	// タブをドロップしたとき.
	if( event.dataTransfer.types.contains("application/x-moz-tabbrowser-tab") ){
	    debugprint("tab dropped");
	    let tab = event.dataTransfer.mozGetDataAt("application/x-moz-tabbrowser-tab",0);
	    let doc = tab.linkedBrowser.contentDocument;
	    let str = "";
	    // 検索ページ.
	    let items = evaluateXPath(doc,"//*[@class='uad_thumbfrm' or @class='uad_thumbfrm_1' or @class='uad_thumbfrm_2']/table/tbody/tr/td/p/a/@href");
	    for(let i=0,item; item=items[i]; i++){
		//debugprint(item.textContent);
		str += item.textContent + " ";
	    }
	    // ランキングページ.
	    items = evaluateXPath(doc,"//div/p/a[@class='watch']/@href");
	    for(let i=0,item; item=items[i]; i++){
		//debugprint(item.textContent);
		str += item.textContent + " ";
	    }
	    str += event.dataTransfer.mozGetDataAt("text/x-moz-text-internal",0);
	    this.addVideos(str);
	    return;
	}
    },

    /**
     * 検索結果の動画IDをコピーする.
     */
    copyVideoId:function(){
	let items = $('db-search-result').selectedItems;
	let str = "";
	for(let i=0,item; item=items[i]; i++){
	    str += item.getAttribute('vid') + "\n";
	}
	CopyToClipboard(str);
    },
    /**
     * 検索結果をストックに追加する.
     */
    addToStock:function(){
	let items = $('db-search-result').selectedItems;
	let str = "";
	for(let i=0,item; item=items[i]; i++){
	    str += item.getAttribute('vid') + " ";
	}
	NicoLiveStock.addStock(str);
    },
    /**
     * 検索結果からリクエストする.
     */
    sendRequest:function(){
	if( IsCaster() || IsOffline() ){
	    // リクエストリストに放り込むときは複数可
	    let items = $('db-search-result').selectedItems;
	    let str = "";
	    for(let i=0,item; item=items[i]; i++){
		str += item.getAttribute('vid') + " ";
	    }
	    NicoLiveRequest.addRequest(str);
	}else{
	    // リクエスト送信は1つのみ.
	    let video_id = $('db-search-result').selectedItem.getAttribute('vid');
	    NicoLiveHelper.postListenerComment(video_id,"");
	}
    },

    /**
     * DBから動画情報を削除する.
     * @param video_id 動画ID
     */
    deleteMovieByVideoId:function(video_id){
	let st;
	try{
	    st = this.dbconnect.createStatement('delete from nicovideo where video_id=?1');
	    st.bindUTF8StringParameter(0,video_id);
	    st.execute();
	    st.finalize();
	    StarRateCache["_"+video_id] = -1;
	} catch (x) {
	}
    },

    /**
     * 動画を削除する.
     * @param node メニューを出したノード
     */
    deleteMovie:function(){
	let items = $('db-search-result').selectedItems;
	for(let i=0,item; item=items[i]; i++){
	    this.deleteMovieByVideoId( item.getAttribute('vid') );
	}
	ShowNotice("選択した動画をDBから削除しました");
    },

    /**
     * サーチ結果にある動画を全て削除する.
     */
    deleteSearchResults:function(){
	if( !ConfirmPrompt('検索結果にある動画を全てDBから削除しますか？','動画の削除') ) return;

	let videos = $('db-search-result').getElementsByTagName('listitem');
	for(let i=0,item; item=videos[i];i++){
	    let video_id = item.getAttribute("vid");
	    this.deleteMovieByVideoId(video_id);
	}
	ShowNotice('検索結果にある動画を全てDBから削除しました');
    },

    onkeydown:function(event){
	//debugprint(event);
	//this._data = event;
	switch( event.keyCode ){
	case 65: // A
	    if( event.ctrlKey || event.metaKey ){
		$('db-search-result').selectAll();
		event.stopPropagation();
		return false;
	    }
	    break;
	case 46: // DEL
	    this.deleteMovie();
	    break;
	}
	return true;
    },

    /**
     * デフォルトのDBパスを返す
     */
    getDefaultPath:function(){
        let file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
        file.append("nicolivehelper_miku39jp.sqlite");
	return file;
    },

    /**
     * DBのパスを返す
     */
    getDBPath:function(){
	let path;
	try{
	    path = Config.getBranch().getUnicharPref("db-path");
	} catch (x) {
	    path = null;
	}
	if( path ){
	    Application.console.log(path);
	    let localFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
	    localFile.initWithPath( path );
	    return localFile;
	}else{
	    return this.getDefaultPath();
	}
    },

    init1st:function(){
	try{
            let file = this.getDBPath(); //this.getDefaultPath();
	    this._filename = file.path;

            let storageService = Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);
            this.dbconnect = storageService.openDatabase(file);
	    this.createVideoDB();
	    this.createRequestCondDB();
	    this.createGPStorageDB();
	    this.createPnameDB();
	    this.createFolderDB(); // 1.1.1+
	} catch (x) {
	    this._corrupt = true;
	}
    },

    init:function(){
	debugprint('Database.init');
	if( this._corrupt ){
	    setTimeout( function(){
			    AlertPrompt("DBファイルが破損しているようです。\n「" +
					Database._filename + 
					"」\nを修復するか、削除する必要があります。","DBファイルの破損");
			}, 2000 );
	}
	debugprint("DB file:"+this._filename);
	this.pnamecache = new Object();
	StarRateCache = new Object();

	this.addSearchLine();
	this.setRegisterdVideoNumber();

	this.searchresult_node = $('db-search-result');
    },
    destroy:function(){
	// This call will not be successful
	// unless you call finalize() on all of your remaining mozIStorageStatement  objects.
	//debugprint('db close');
	//this.dbconnect.close();
    }
};

window.addEventListener("load", function(e){ Database.init(); }, false);
window.addEventListener("unload", function(e){ Database.destroy(); }, false);

Database.init1st();
