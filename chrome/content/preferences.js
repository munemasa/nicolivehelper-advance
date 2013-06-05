var NLHPreference = {
    requestcond: {}, // リクエスト条件設定

    debugprint:function(txt){
	try{
	    opener.debugprint(txt);
	} catch (x) {
	}
    },

    /**
     * 動画情報設定のプレビュー.
     * @param str 動画情報設定の文字列
     */
    previewVideoInfo:function(str){
	let info = {
	    cno: 99,
	    tags: ["ミクオリジナル曲","初音ミク","くちばしP","私の時間","VOCALOID殿堂入り","6/17発売「Vocalostar」収録曲","かわいいミクうた","弾幕ソング","職人とみんなの暖かいコメで作る動画"],
	    video_id: "sm1340413",
	    title: "初音ミクオリジナル「私の時間」",
	    description: "ボカロユーザー、リスナーの皆に捧ぐ音楽joysoundで配信されています作品リストmylist/7新曲sm75641558/11新曲sm790612810/31新曲sm866756511/4新曲sm871253212/13新曲sm908468180万ありがとうございます！ありがとうございます！歌声途切れなすぎです！",
	    thumbnail_url:"http://tn-skr2.smilevideo.jp/smile?i=1340413",
	    first_retrieve: 1193051579,
	    length: "4:28",
	    length_ms: 268000,
	    view_counter: 828280,
	    comment_num: 88034,
	    mylist_counter: 31815,
	    highbitrate: "619.70",
	    lowbitrate: "314.99",
	    pname: "くちばしP"
	};
	if( window.opener.NicoLiveHelper.stock_list[0] ){
	    info = window.opener.NicoLiveHelper.stock_list[0];
	}
	str = window.opener.NicoLiveHelper.replaceMacros(str,info);
	str = str.replace(/<\/(.*?)>/g,"</html:$1>");
	str = str.replace(/<([^/].*?)>/g,"<html:$1>");
	str = str.replace(/html:br/g,"html:br/");
	//Application.console.log(str);
	$('preview-videoinfo').innerHTML = str;
    },

    /**
     * つぶやき設定のプレビュー
     */
    previewTweet:function(elem){
	let info = {
	    cno: 99,
	    comment_no: 99,
	    tags: ["ミクオリジナル曲","初音ミク","くちばしP","私の時間","VOCALOID殿堂入り","6/17発売「Vocalostar」収録曲","かわいいミクうた","弾幕ソング","職人とみんなの暖かいコメで作る動画"],
	    video_id: "sm1340413",
	    title: "初音ミクオリジナル「私の時間」",
	    description: "ボカロユーザー、リスナーの皆に捧ぐ音楽joysoundで配信されています作品リストmylist/7新曲sm75641558/11新曲sm790612810/31新曲sm866756511/4新曲sm871253212/13新曲sm908468180万ありがとうございます！ありがとうございます！歌声途切れなすぎです！",
	    thumbnail_url:"http://tn-skr2.smilevideo.jp/smile?i=1340413",
	    first_retrieve: 1193051579,
	    length: "4:28",
	    length_ms: 268000,
	    view_counter: 828280,
	    comment_num: 88034,
	    mylist_counter: 31815,
	    highbitrate: "619.70",
	    lowbitrate: "314.99",
	    pname: "くちばしP"
	};
	if( window.opener.NicoLiveHelper.stock_list[0] ){
	    info = window.opener.NicoLiveHelper.stock_list[0];
	}
	let str = elem.value;
	str = window.opener.NicoLiveHelper.replaceMacros(str,info);
	$('tweet-preview').textContent = str;
    },

    // 運営コメントプリセット.
    createPresetCommentMenu:function(){
	this.presetcomment = opener.Storage.readObject('nico_live_commentpreset',{});
	for (presetname in this.presetcomment){
	    let menuitem = CreateMenuItem(presetname,'');
	    menuitem.addEventListener("command",
				      function(e){
					  $('id-comment-preset-name').value = e.target.label;
					  NLHPreference.setPresetComment(e.target.label);
				      },false);
	    $('id-menu-comment-preset').insertBefore(menuitem,$('id-menu-comment-preset').lastChild);
	}
    },

    /**
     * プリセットの運営コメントに設定する.
     * @param presetname プリセット名
     */
    setPresetComment:function(presetname){
	let data = this.presetcomment[presetname];
	$('pref-msg-deleted').value = data["deleted"];
	$('pref-msg-notaccept').value = data["notaccept"];
	$('pref-msg-newmovie').value = data["newmovie"];
	$('pref-msg-played').value = data["played"];
	$('pref-msg-requested').value = data["requested"];
	$('pref-msg-accept').value = data["accept"];
	$('pref-msg-no-live-play').value = data["no-live-play"];
	$('pref-msg-requestok').value = data["requestok"];
	$('pref-msg-requestng').value = data["requestng"];
	$('pref-msg-requestok-command').value = data["requestok_command"];
	$('pref-msg-requestng-command').value = data["requestng_command"];
	$('pref-startup-comment').value = data["startup_comment"];
	$('pref-msg-lessmylists').value = data["lessmylists"];
	$('pref-msg-greatermylists').value = data["greatermylists"];
	$('pref-msg-lessviews').value = data["lessviews"];
	$('pref-msg-greaterviews').value = data["greaterviews"];
	$('pref-msg-longertime').value = data["longertime"];
	$('pref-msg-shortertime').value = data["shortertime"]; // Advance+
	$('pref-msg-outofdaterange').value = data["outofdaterange"];
	$('pref-msg-requiredkeyword').value = data["requiredkeyword"];
	$('pref-msg-forbiddenkeyword').value = data["forbiddenkeyword"];
	$('pref-msg-limitnumberofrequests').value = data["limitnumberofrequests"];
	// 1.1.19+
	$('pref-msg-within-livespace').value = data["within-livespace"] || $('pref-msg-within-livespace').defaultValue;
	// 1.1.22+
	$('pref-msg-requiredkeyword-title').value = data["requiredkeyword-title"] || $('pref-msg-requiredkeyword-title').defaultValue;
	$('pref-msg-forbiddenkeyword-title').value = data["forbiddenkeyword-title"] || $('pref-msg-forbiddenkeyword-title').defaultValue;
	// 1.1.35+
	$('pref-msg-high-bitrate').value = data["high-bitrate"] || $('pref-msg-high-bitrate').defaultValue;
	$('pref-msg-ng-video').value = data["ng-video"]; // Advance+
    },

    /**
     * 運営コメントのプリセット設定を追加する.
     * @param presetname プリセット名
     */
    addPresetComment:function(presetname){
	let data = {
	    "deleted":$('pref-msg-deleted').value,
	    "notaccept":$('pref-msg-notaccept').value,
	    "newmovie":$('pref-msg-newmovie').value,
	    "played":$('pref-msg-played').value,
	    "requested":$('pref-msg-requested').value,
	    "accept":$('pref-msg-accept').value,
	    "no-live-play":$('pref-msg-no-live-play').value,
	    "requestok":$('pref-msg-requestok').value,
	    "requestng":$('pref-msg-requestng').value,
	    "requestok_command":$('pref-msg-requestok-command').value,
	    "requestng_command":$('pref-msg-requestng-command').value,
	    "startup_comment":$('pref-startup-comment').value,
	    "lessmylists":$('pref-msg-lessmylists').value,
	    "greatermylists":$('pref-msg-greatermylists').value,
	    "lessviews":$('pref-msg-lessviews').value,
	    "greaterviews":$('pref-msg-greaterviews').value,
	    "longertime":$('pref-msg-longertime').value,
	    "shortertime":$('pref-msg-shortertime').value, // Advance+
	    "outofdaterange":$('pref-msg-outofdaterange').value,
	    "requiredkeyword":$('pref-msg-requiredkeyword').value,
	    "forbiddenkeyword":$('pref-msg-forbiddenkeyword').value,
	    "limitnumberofrequests":$('pref-msg-limitnumberofrequests').value,
	    "within-livespace":$('pref-msg-within-livespace').value, // 1.1.19+
	    "requiredkeyword-title":$('pref-msg-requiredkeyword-title').value, //1.1.22+
	    "forbiddenkeyword-title":$('pref-msg-forbiddenkeyword-title').value, //1.1.22+
	    "high-bitrate":$('pref-msg-high-bitrate').value, // 1.1.35+
	    "ng-video": $('pref-msg-ng-video').value // Advance+
	};
	this.presetcomment[presetname] = data;
	opener.Storage.writeObject('nico_live_commentpreset',this.presetcomment);

	let existmenu = evaluateXPath(document,"//*[@id='id-menu-comment-preset']/*[@label='"+presetname+"']");
	if(existmenu.length) return;

	let menuitem = CreateMenuItem(presetname,'');
	menuitem.addEventListener("command",
				 function(e){
				     $('id-comment-preset-name').value = e.target.label;
				     NLHPreference.setPresetComment(e.target.label);
				 },false);
	$('id-menu-comment-preset').insertBefore(menuitem,$('id-menu-comment-preset').lastChild);
    },

    /**
     * 運営コメントのプリセット設定を削除
     * @param presetname 削除するプリセット名
     */
    deletePresetComment:function(presetname){
	delete this.presetcomment[presetname];
	opener.Storage.writeObject('nico_live_commentpreset',this.presetcomment);
	let existmenu = evaluateXPath(document,"//*[@id='id-menu-comment-preset']/*[@label='"+presetname+"']");
	if(existmenu.length){
	    RemoveElement(existmenu[0]);
	}
    },

    /**
     * P名ホワイトリストをセーブする.
     */
    savePNameWhitelist:function(){
	opener.Storage.writeObject('nicolive_pnamewhitelist',$('pname-whitelist').value);
    },

    /**
     * P名ホワイトリストをロードする.
     */
    loadPNameWhitelist:function(){
	let pname = opener.Storage.readObject('nicolive_pnamewhitelist','');
	$('pname-whitelist').value = pname;
    },

    /**
     * リクエスト制限設定のプリセットを保存する.
     */
    savePresetRequestCond:function(name,obj){
	this.requestcond[name] = obj;
	opener.Storage.writeObject( "nico_request_cond", this.requestcond );
    },

    /**
     * リクエスト制限のプリセット名を配列で返す.
     */
    readPresetCondName:function(){
	this.requestcond = opener.Storage.readObject( "nico_request_cond", {} );
	let preset = new Array();
	for( let k in this.requestcond ){
	    preset.push(k);
	}
	return preset;
    },

    /**
     * リクエスト制限設定のプリセット値をロードする.
     * @param name プリセット名
     */
    loadRestrictionPreset:function(name){
	$('id-edit-presetname').value = name;
	try{
	    let item = this.requestcond[name];
	    $('pref-restrict-date-from').value = item.date_from;
	    $('pref-restrict-date-to').value   = item.date_to;
	    $('pref-restrict-view-from').value = item.view_from;
	    $('pref-restrict-view-to').value   = item.view_to;
	    $('pref-restrict-mylist-from').value= item.mylist_from;
	    $('pref-restrict-mylist-to').value  = item.mylist_to;
	    $('pref-restrict-videolength-from').value= item.videolength_from; // Advance+
	    $('pref-restrict-videolength-to').value= item.videolength_to;
	    $('pref-restrict-tag-include').value= item.tag_include;
	    $('pref-restrict-tag-exclude').value= item.tag_exclude;
	    $('pref-date-from').value = $('pref-restrict-date-from').value;
	    $('pref-date-to').value = $('pref-restrict-date-to').value;
	    // 1.1.22+
	    $('pref-restrict-title-include').value= item.title_include || "";
	    $('pref-restrict-title-exclude').value= item.title_exclude || "";
	    // 1.1.35+
	    $('pref-restrict-bitrate').value = item.bitrate || 0;
	} catch (x) {
	    debugprint(x);
	}
    },

    /**
     * リクエスト制限のプリセット登録.
     * @param name プリセット名
     */
    addPresetCond:function(name){
	if(name.length<=0) return;
	let item = {};
	item.date_from     = $('pref-restrict-date-from').value;
	item.date_to       = $('pref-restrict-date-to').value;
	item.view_from     = $('pref-restrict-view-from').value;
	item.view_to       = $('pref-restrict-view-to').value;
	item.mylist_from   = $('pref-restrict-mylist-from').value;
	item.mylist_to     = $('pref-restrict-mylist-to').value;
	item.videolength_from = $('pref-restrict-videolength-from').value;
	item.videolength_to   = $('pref-restrict-videolength-to').value;
	item.tag_include   = $('pref-restrict-tag-include').value;
	item.tag_exclude   = $('pref-restrict-tag-exclude').value;
	// 1.1.22+
	item.title_include   = $('pref-restrict-title-include').value;
	item.title_exclude   = $('pref-restrict-title-exclude').value;
	// 1.1.35+
	item.bitrate = $('pref-restrict-bitrate').value;
	this.savePresetRequestCond(name,item);

	let existmenu;
	existmenu = evaluateXPath(document,"//*[@id='id-menu-preset']/*[@label='"+name+"']");
	if( existmenu.length ) return;

	let elem = CreateMenuItem(name,"");
	elem.addEventListener("command",
			      function(e){
				  $('id-preset-name').value=e.target.label;
				  NLHPreference.loadRestrictionPreset(e.target.label);
			      },
			      false);
	$('id-menu-preset').appendChild(elem);
    },

    /**
     * リクエスト制限のプリセットを削除する
     * @param name 削除したいプリセット名
     */
    delPresetCond:function(name){
	if(name.length<=0) return;

	delete this.requestcond[name];
	opener.Storage.writeObject( "nico_request_cond", this.requestcond );

	let existmenu;
	existmenu = evaluateXPath(document,"//*[@id='id-menu-preset']/*[@label='"+name+"']");
	if( existmenu.length ){
	    RemoveElement(existmenu[0]);
	}
    },

    // リクエスト制限タブをリセットする.
    resetRequestRestriction:function(){
	// reset()がなぜか使えないので.
	$('id-preset-name').value = "";
	$('pref-restrict-date-from').value = "2007-08-31";
	$('pref-restrict-date-to').value = "2007-08-31";
	$('pref-restrict-view-from').value = 0;
	$('pref-restrict-view-to').value = 0;
	$('pref-restrict-mylist-from').value = 0;
	$('pref-restrict-mylist-to').value = 0;
	$('pref-restrict-videolength-from').value = 0;
	$('pref-restrict-videolength-to').value = 0;
	$('pref-restrict-tag-include').value = "";
	$('pref-restrict-tag-exclude').value = "";
	$('pref-restrict-title-include').value = "";
	$('pref-restrict-title-exclude').value = "";
	$('pref-restrict-bitrate').value = 0;
	$('pref-date-from').value = "2007-08-31";
	$('pref-date-to').value = "2007-08-31";
	$('pref-restrict-bitrate').value = 0;
    },

    // 動画情報をデフォルトにする.
    resetMovieInfo:function(){
	/*
	 * 再生数/{view} コメント/{comment} マイリスト/{mylist}({mylistrate})<br>{pname}
	 * タグ/{tags}
	 * ♪{id} {title}<br>投稿日/{date} 時間/{length}<br>{additional}
	 */
	$('pref-videoinfo1').value = $('pref-videoinfo1').defaultValue;
	$('pref-videoinfo2').value = $('pref-videoinfo2').defaultValue;
	$('pref-videoinfo3').value = $('pref-videoinfo3').defaultValue;
	$('pref-videoinfo4').value = $('pref-videoinfo4').defaultValue;
	$('pref-typeofvideoinfo').value = 0;
	$('pref-revert-videoinfo').value = 0;
	$('pref-userdefined-uri').value = $('pref-userdefined-uri').defaultValue;

	$('pref-videoinfo1-command').value = $('pref-videoinfo1-command').defaultValue;
	$('pref-videoinfo2-command').value = $('pref-videoinfo2-command').defaultValue;
	$('pref-videoinfo3-command').value = $('pref-videoinfo3-command').defaultValue;
	$('pref-videoinfo4-command').value = $('pref-videoinfo4-command').defaultValue;

	$('pref-videoinfo-playfailed').value = $('pref-videoinfo-playfailed').defaultValue;
    },

    // 運営コメントをデフォルトにする.
    resetAutoReply:function(){
	$('pref-msg-deleted').value   = $('pref-msg-deleted').defaultValue;
	$('pref-msg-notaccept').value = $('pref-msg-notaccept').defaultValue;
	$('pref-msg-newmovie').value  = $('pref-msg-newmovie').defaultValue;
	$('pref-msg-played').value    = $('pref-msg-played').defaultValue;
	$('pref-msg-requested').value = $('pref-msg-requested').defaultValue;
	$('pref-msg-accept').value    = $('pref-msg-accept').defaultValue;
	$('pref-msg-no-live-play').value = $('pref-msg-no-live-play').defaultValue;
	$('pref-msg-within-livespace').value = $('pref-msg-within-livespace').defaultValue; // 1.1.19+

	$('pref-msg-requestok').value = $('pref-msg-requestok').defaultValue;
	$('pref-msg-requestng').value = $('pref-msg-requestng').defaultValue;
	$('pref-msg-requestok-command').value = $('pref-msg-requestok-command').defaultValue;
	$('pref-msg-requestng-command').value = $('pref-msg-requestng-command').defaultValue;
	$('pref-startup-comment').value = $('pref-startup-comment').defaultValue;

	$('pref-msg-lessmylists').value = $('pref-msg-lessmylists').defaultValue;
	$('pref-msg-greatermylists').value = $('pref-msg-greatermylists').defaultValue;
	$('pref-msg-lessviews').value = $('pref-msg-lessviews').defaultValue;
	$('pref-msg-greaterviews').value = $('pref-msg-greaterviews').defaultValue;
	$('pref-msg-longertime').value = $('pref-msg-longertime').defaultValue;
	$('pref-msg-shortertime').value = $('pref-msg-shortertime').defaultValue; // Advance+
	$('pref-msg-outofdaterange').value = $('pref-msg-outofdaterange').defaultValue;
	$('pref-msg-requiredkeyword').value = $('pref-msg-requiredkeyword').defaultValue;
	$('pref-msg-forbiddenkeyword').value = $('pref-msg-forbiddenkeyword').defaultValue;
	$('pref-msg-limitnumberofrequests').value = $('pref-msg-limitnumberofrequests').defaultValue;
	// 1.1.22+
	$('pref-msg-requiredkeyword-title').value = $('pref-msg-requiredkeyword-title').defaultValue;
	$('pref-msg-forbiddenkeyword-title').value = $('pref-msg-forbiddenkeyword-title').defaultValue;
	// 1.1.35+
	$('pref-msg-high-bitrate').value = $('pref-msg-high-bitrate').defaultValue;
	// Advance+
	$('pref-msg-ng-video').value = $('pref-msg-ng-video').defaultValue;
    },

    // 視聴者コマンドの応答をリセットする.
    resetListenerCommand:function(){
	$('pref-cmd-s').value = $('pref-cmd-s').defaultValue;
	$('pref-cmd-del').value = $('pref-cmd-del').defaultValue;
    },

    // コメントログの保存先を選択.
    selectCommentLogDirectory:function(){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "コメントログの保存先を指定してください", nsIFilePicker.modeGetFolder);
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	    var file = fp.file;
	    // Get the path as string. Note that you usually won't 
	    // need to work with the string paths.
	    var path = fp.file.path;
	    // work with returned nsILocalFile...
	    //debugprint('commentlog='+path);

	    $('pref-commentlogDir').value = file;
	    $('commentlog').file = file;
	    $('commentlog').label = path;
	}
    },

    /**
     * 連続コメント用テキストファイル保存先の選択.
     */
    selectContinuousCommentDirectory:function(){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "連続コメント用テキストファイルの保存先を指定してください", nsIFilePicker.modeGetFolder);
	var rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	    var file = fp.file;
	    // Get the path as string. Note that you usually won't 
	    // need to work with the string paths.
	    var path = fp.file.path;
	    // work with returned nsILocalFile...
	    //debugprint('continuous comment dir='+path);

	    $('pref-continuousCommentDir').value = file;
	    $('continuouscomment').file = file;
	    $('continuouscomment').label = path;
	}
    },

    /**
     * リクエスト制限のプリセット読み込みメニューを作成など.
     */
    updateRestrictPane:function(){
	$('pref-date-from').value = $('pref-restrict-date-from').value;
	$('pref-date-to').value = $('pref-restrict-date-to').value;

	let preset = this.readPresetCondName();
	for(let i=0,item;item=preset[i];i++){
	    let elem = CreateMenuItem(item,"");
	    elem.addEventListener("command",
				  function(e){
				      $('id-preset-name').value=e.target.label;
				      NLHPreference.loadRestrictionPreset(e.target.label);
				  },
				  false);
	    $('id-menu-preset').appendChild(elem);
	}
    },

    updateFilePicker:function(){
	var file;

        file = $('pref-commentlogDir').value;
        if (file) {
            var fileField = $('commentlog');
            fileField.file = file;
            fileField.label = file.path;
        }

	file = $('pref-continuousCommentDir').value;
        if (file) {
            var fileField = $('continuouscomment');
            fileField.file = file;
            fileField.label = file.path;
        }
    },

    // リストに表示されている項目からオブジェクトを作成してプリファレンスに登録する.
    createClassObject:function(){
	let items = evaluateXPath2(document,"//xul:listbox[@id='list-class']/xul:listitem");
	this.classes = new Array();
	for(let i=0,item;item=items[i];i++){
	    let obj = {};
	    obj['name'] = item.label;
	    obj['label'] = item.firstChild.value;
	    obj['color'] = item.firstChild.style.backgroundColor;
	    this.classes.push(obj);
	}
	$('pref-classes-value').value = JSON.stringify(this.classes);
    },

    // 選択されている分類を削除.
    removeSelectedClass:function(){
	let n = $('list-class').selectedIndex;
	if(n>=0){
	    $('list-class').removeItemAt(n);
	}
	this.createClassObject();
    },

    // 分類を追加する.
    addClass:function(){
	let classname = $('class-name').value;
	let classlabel = $('class-label').value;
	if( !classname || !classlabel ) return;

	let existclasses = evaluateXPath2(document,"//xul:listbox[@id='list-class']/xul:listitem/xul:label");
	for(let i=0,item; item=existclasses[i]; i++){
	    if( item.value==classlabel ){
		AlertPrompt('すでに存在するラベルは登録できません','動画分類登録');
		return;
	    }
	}
	if(classlabel.match(/[^\w]/)){
	    AlertPrompt('ラベルには英数のみ使用できます','動画分類登録');
	    return;
	}

	let elem = $('list-class').appendItem(classname,'');
	let label = CreateLabel(classlabel);
	label.style.backgroundColor = $('class-color').color;
	elem.appendChild( label );
	this.createClassObject();
    },
    // デフォルトの分類をリストに追加する.
    setDefaultClass:function(){
	let elem,label;
	elem = $('list-class').appendItem('初音ミク','');
	label = CreateLabel('Miku');
	label.style.backgroundColor = '#7fffbf';
	elem.appendChild(label);
	elem = $('list-class').appendItem('鏡音リン・レン','');
	label = CreateLabel('RinLen');
	label.style.backgroundColor = 'yellow';
	elem.appendChild(label);
	elem = $('list-class').appendItem('巡音ルカ','');
	label = CreateLabel('Luka');
	label.style.backgroundColor = '#ffb2d3';
	elem.appendChild(label);
	elem = $('list-class').appendItem('その他','');
	label = CreateLabel('Other');
	label.style.backgroundColor = '#ffeeee';
	elem.appendChild(label);
	elem = $('list-class').appendItem('NG','');
	label = CreateLabel('NG');
	label.style.backgroundColor = '#888888';
	elem.appendChild(label);
    },
    // すでに設定済みの分類をリストに追加する.
    setExistClasses:function(){
	for(let i=0,item; item=this.classes[i]; i++){
	    let elem,label;
	    elem = $('list-class').appendItem( item['name'] );
	    label = CreateLabel(item['label']);
	    label.style.backgroundColor = item['color'] || '';
	    elem.appendChild(label);
	}
    },

    // カスタムスクリプトのドロップダウンメニューを切り替えたとき.
    changeScriptMenu:function(elem){
	let data = this.script;
	switch( elem.selectedIndex ){
	case 0:
	    // リクエストチェック
	    if( data.requestchecker ){
		$('custom-script').value = data.requestchecker;
	    }else{
		$('custom-script').value = '';
	    }
	    break;
	case 1:
	    // コメントフィルタ
	    if( data.commentfilter ){
		$('custom-script').value = data.commentfilter;
	    }else{
		$('custom-script').value = '';
	    }
	    break;
	}
    },

    saveScript:function(){
	let data = this.script;
	switch( $('id-custom-script-menu').selectedIndex ){
	case 0:
	    // リクエストチェック
	    data.requestchecker = $('custom-script').value;
	    break;
	case 1:
	    // コメントフィルタ
	    data.commentfilter = $('custom-script').value;
	    break;
	}
	opener.Storage.writeObject('nico_live_customscript',data);
    },

    buildFontList:function(){
	FontBuilder.buildFontList($('font.language.group').value,null,$('select-font'));
	let elem = evaluateXPath2(document,"//xul:menulist[@id='select-font']//xul:menuitem[@value='"+$('e.n.font').value+"']");
	if(elem.length==1){
	    $('select-font').selectedItem = elem[0];
	}
    },

    changeFontScale:function(value){
	$('e.n.font-scale').value = value;
	this.updateFontScaleView();
    },
    updateFontScaleView:function(){
	let value = $('e.n.font-scale').value;
	$('window-font-scale').value = value;
	$('font-scale-label').value = value + "pt.";
    },

    // Twitterユーザの認証.
    authorizeTwitterUser:function(){
	let user = $('twitter-user').value;
	let pass = $('twitter-password').value;
	if( user && pass ){
	    let func = function(statuscode,oauthobj){
		if(statuscode!=200){
		    $('twitter-authorization-result').value = "失敗";
		}else{
		    //$('twitter-authorization-result').value = oauthobj["screen_name"];
		    $('twitter-authorized-username').value = oauthobj["screen_name"];
		    NLHPreference.removeAllTwitterToken();
		    NLHPreference.saveTwitterToken(oauthobj);
		    NLHPreference.saveTwitterScreenName(oauthobj["screen_name"]);
		}
		$('twitter-authorization-button').disabled = false;
	    };
	    $('twitter-authorization-button').disabled = true;
	    opener.NicoLiveTweet.getAccessTokenByXAuth(user,pass,func);
	}
    },

    saveTwitterScreenName:function(name){
	let pref = opener.Config.getBranch();
	pref.setCharPref("twitter.auth-user",name);
    },

    // Twitterトークンをログインマネージャに保存.
    saveTwitterToken:function(oauthobj){
	let as_user = oauthobj["oauth_token"];
	let as_pass = oauthobj["oauth_token_secret"];

	let host = "chrome://nicolivehelperadvance";
	let nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                                     Components.interfaces.nsILoginInfo,
                                                     "init");
	let loginInfo = new nsLoginInfo(host, null, "twitter token", as_user, as_pass, "", "");
	this._login.addLogin(loginInfo);
    },

    getSavedTwitterToken:function(){
	let hostname = "chrome://nicolivehelperadvance";
	let myLoginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);  
	let logins = myLoginManager.findLogins({}, hostname, null, 'twitter token');
	if( logins.length ){
	    this.debugprint('# of tokens:'+logins.length);
	}else{
	    this.debugprint('No twitter token in LoginManager.');
	    $('twitter-authorization-result').value = "なし";
	}
    },

    // Twitterトークンを全削除.
    removeAllTwitterToken:function(){
	try { 
	    let host = "chrome://nicolivehelperadvance";
	    let logins = this._login.findLogins({}, host, null, 'twitter token');
	    for (let i = 0; i < logins.length; ++i){
		this.debugprint(logins[i]);
		this._login.removeLogin(logins[i]);
	    }
	}
	catch (e) {
	    this.debugprint(e);
	}
    },

    // PINを取得する.
    getTwitterPin:function(){
	opener.NicoLiveTweet.getRequestTokenOfNLH();
    },
    // PINの認証する
    authTwitterPin:function(){
	let pin = $('twitter-pin').value;
	if( pin ){
	    let func = function(statuscode,oauthobj){
		if(statuscode!=200){
		    $('twitter-authorization-result').value = "失敗";
		}else{
		    //$('twitter-authorization-result').value = oauthobj["screen_name"];
		    $('twitter-authorized-username').value = oauthobj["screen_name"];
		    NLHPreference.removeAllTwitterToken();
		    NLHPreference.saveTwitterToken(oauthobj);
		    NLHPreference.saveTwitterScreenName(oauthobj["screen_name"]);
		}
		$('twitter-authorization-button').disabled = false;
	    };
	    $('twitter-authorization-button').disabled = true;
	    opener.NicoLiveTweet.getAccessTokenOfNLH(pin,func);
	}
    },

    /**
     * 動画情報設定をエクスポートする.
     * 保存先指定ダイアログを表示して、そこに動画情報設定を保存する。
     */
    exportMovieInfo:function(){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "動画情報のエクスポート", nsIFilePicker.modeSave);
	fp.appendFilters(nsIFilePicker.filterAll);
	let rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	    let file = fp.file;
	    let path = fp.file.path;
	    this.debugprint("「"+path+"」に動画情報を保存します");
	    let os = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	    let flags = 0x02|0x08|0x20;// wronly|create|truncate
	    os.init(file,flags,0664,0);
	    let cos = GetUTF8ConverterOutputStream(os);
	    let movieinfo = new Object();
	    movieinfo.vinfo1 = $('pref-videoinfo1').value;
	    movieinfo.vinfo2 = $('pref-videoinfo2').value;
	    movieinfo.vinfo3 = $('pref-videoinfo3').value;
	    movieinfo.vinfo4 = $('pref-videoinfo4').value;
	    movieinfo.vcmd1 = $('pref-videoinfo1-command').value;
	    movieinfo.vcmd2 = $('pref-videoinfo2-command').value;
	    movieinfo.vcmd3 = $('pref-videoinfo3-command').value;
	    movieinfo.vcmd4 = $('pref-videoinfo4-command').value;
	    movieinfo.vinfo_failed = $('pref-videoinfo-playfailed').value;
	    movieinfo.vinfo_type = $('pref-typeofvideoinfo').value;
	    movieinfo.vinfo_revert_live = $('pref-revert-videoinfo').value;
	    cos.writeString( JSON.stringify(movieinfo) );
	    cos.close();
	}
    },
    /**
     * 動画情報設定をインポートする.
     * ダイアログでファイルを選択し、指定の動画情報をインポートする。
     */
    importMovieInfo:function(){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "動画情報のインポート", nsIFilePicker.modeOpen);
	fp.appendFilters(nsIFilePicker.filterAll);
	let rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	    let file = fp.file;
	    let path = fp.file.path;
	    this.debugprint("「"+path+"」から動画情報を読み込みします");

	    let istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	    istream.init(file, 0x01, 0444, 0);
	    istream.QueryInterface(Components.interfaces.nsILineInputStream);
	    let cis = GetUTF8ConverterInputStream(istream);

	    // 行を配列に読み込む
	    let line = {}, hasmore;
	    let str = "";
	    do {
		hasmore = cis.readString(1024,line);
		str += line.value;
	    } while(hasmore);
	    istream.close();

	    let movieinfo = JSON.parse(str);
	    $('pref-videoinfo1').value = movieinfo.vinfo1;
	    $('pref-videoinfo2').value = movieinfo.vinfo2;
	    $('pref-videoinfo3').value = movieinfo.vinfo3;
	    $('pref-videoinfo4').value = movieinfo.vinfo4;
	    $('pref-videoinfo1-command').value = movieinfo.vcmd1;
	    $('pref-videoinfo2-command').value = movieinfo.vcmd2;
	    $('pref-videoinfo3-command').value = movieinfo.vcmd3;
	    $('pref-videoinfo4-command').value = movieinfo.vcmd4;
	    $('pref-videoinfo-playfailed').value = movieinfo.vinfo_failed;
	    $('pref-typeofvideoinfo').value = movieinfo.vinfo_type;
	    $('pref-revert-videoinfo').value = movieinfo.vinfo_revert_live;
	}
    },

    /**
     * サウンド通知用のサウンドファイル選択.
     */
    refSoundFileToNotice:function(){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "通知に使用するサウンドファイル", nsIFilePicker.modeOpen);
	fp.appendFilters(nsIFilePicker.filterAll);
	let rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	    let file = fp.file;
	    let path = fp.file.path;
	    this.debugprint("「"+path+"」を通知に使用します");

	    $('pref-notice-soundfile').value = path;
	}
    },

    /**
     * DBファイルを指定.
     */
    refDatabase:function(){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "使用する動画DBのファイル", nsIFilePicker.modeSave);
	fp.appendFilters(nsIFilePicker.filterAll);
	let rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	    let file = fp.file;
	    let path = fp.file.path;
	    this.debugprint("「"+path+"」を動画DBに使用します");

	    $('pref-video-db-path').value = path;
	}
    },

    /**
     * DBファイルパスをリセット.
     */
    resetDatabasePath:function(){
	let file = window.opener.Database.getDefaultPath();
	$('pref-video-db-path').value = file.path;
    },

    /**
     * データ保存先ディレクトリの指定.
     */
    refStoragePath:function(){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "データ保存先の指定", nsIFilePicker.modeGetFolder);
	let rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	    let file = fp.file;
	    let path = fp.file.path;
	    this.debugprint("「"+path+"」をデータ保存に使用します");

	    $('pref-storage-path').value = path;
	}
    },

    /**
     * データ保存パスをリセット.
     */
    resetStoragePath:function(){
	let file = window.opener.Storage.getDefaultSaveDir();
	$('pref-storage-path').value = file.path;
    },

    /**
     * 壁紙の指定.
     */
    refWallpaperPath:function(){
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	let fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
	fp.init(window, "壁紙の指定", nsIFilePicker.modeOpen);
	let rv = fp.show();
	if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	    let file = fp.file;
	    let path = fp.file.path;
	    this.debugprint("「"+path+"」を壁紙に使用します");
	    $('pref-wallpaper').value = path;
	}
    },

    init:function(){
	this.updateFilePicker();
	this.buildFontList();
	this.updateFontScaleView();
	this._login = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
	this.getSavedTwitterToken();
	this.loadPNameWhitelist();

	try{
	    this.classes = eval( $('pref-classes-value').value );
	} catch (x) {
	    this.classes = new Array();
	}
	if( !this.classes || this.classes.length<=0 ){
	    this.setDefaultClass();
	}else{
	    this.setExistClasses();
	}

	$('prepare-timing-bar').value = $('pref-prepare-timing').value;

	let data = opener.Storage.readObject('nico_live_customscript',{});
	this.script = data;
	if( data.requestchecker ){
	    $('custom-script').value = data.requestchecker;
	}
    },
    destroy:function(){
	//Application.console.log('close advanced setting');
    }
};

window.addEventListener("load", function(e){ NLHPreference.init(); }, false);
window.addEventListener("unload", function(e){ NLHPreference.destroy(); }, false);
