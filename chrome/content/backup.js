
var Backup = {

    /**
     * 現在の状態をsystem-backupに取る.
     */
    current:function(){
	this.backup('system-backup');
	this.createRestoreMenu();
    },

    // 復元を確認する.
    confirmRestore:function(backupname){
	if(ConfirmPrompt(LoadFormattedString('STR_BACKUP_WARN_RESTORE',[backupname]),
			 LoadString('STR_BACKUP_WARN_RESTORE_TITLE'))){
	    Backup.restore(backupname);
	    ShowNotice( LoadFormattedString('STR_BACKUP_RESTORE',[backupname]) );
	}
    },
    // 削除を確認する.
    confirmDelete:function(backupname){
	if(ConfirmPrompt(LoadFormattedString('STR_BACKUP_WARN_DELETE',[backupname]),
			 LoadString('STR_BACKUP_WARN_DEL_TITLE'))){
	    delete Backup.backuprestore[backupname];
	    Backup.createRestoreMenu();
	    Application.storage.set("nico_live_backup",Backup.backuprestore);
	    ShowNotice( LoadFormattedString('STR_BACKUP_DELETE',[backupname]) );
	}
    },

    /**
     * バックアップと復元メニューを作成する.
     */
    createRestoreMenu:function(){
	let menu = $('toolbar-restore');
	let deletemenu = $('toolbar-deletebackup');
	while(menu.firstChild){
	    menu.removeChild(menu.firstChild);
	}
	while(deletemenu.firstChild){
	    deletemenu.removeChild(deletemenu.firstChild);
	}
	// 保存時刻順にソートするために一旦配列に.
	let tmp = new Array();
	for (backupname in this.backuprestore){
	    this.backuprestore[backupname].name = backupname;
	    tmp.push(this.backuprestore[backupname]);
	}
	tmp.sort( function(a,b){ return b.time-a.time; } );
	for(let i=0,item; item=tmp[i];i++){
	    let backupname = item.name;
	    let elem = CreateMenuItem(backupname,'');
	    if( item.time ){
		let str = GetDateString(item.time*1000);
		elem.setAttribute('tooltiptext',str);
	    }
	    // 復元用.
	    elem.setAttribute("oncommand","Backup.confirmRestore('"+backupname+"');");
	    menu.appendChild(elem);

	    // 削除用.
	    elem = CreateMenuItem(backupname,'');
	    elem.setAttribute("oncommand","Backup.confirmDelete('"+backupname+"');");
	    deletemenu.appendChild(elem);
	}
    },

    /**
     * バックアップ名を入力して、バックアップする.
     */
    inputBackupName:function(){
	let backupname = InputPrompt( LoadString('STR_BACKUP_TEXT'), LoadString('STR_BACKUP_CAPTION'), '');
	if( backupname && backupname.length ){
	    if( backupname!='system-backup' ){
		this.backup(backupname);
		this.createRestoreMenu();
		ShowNotice( LoadFormattedString('STR_BACKUP_RESULT',[backupname]) );
	    }else{
		ShowNotice( LoadFormattedString('STR_BACKUP_FAILED',[backupname]) );
	    }
	}
    },

    /**
     * リク、ストック、履歴の状態をバックアップする.
     */
    backup: function(name){
	let data = new Object;
	// オブジェクトのコピーにはちょっとセコイ手のような気がするが.
	// これはこれで有効な気がする(重い処理のような気もするけど)
	data.request   = JSON.parse(JSON.stringify(NicoLiveHelper.request_list));
	data.stock     = JSON.parse(JSON.stringify(NicoLiveHelper.stock_list));
	data.playlist  = JSON.parse(JSON.stringify(NicoLiveHelper.playlist_list));
	data.playlist_txt = JSON.parse(JSON.stringify($('playlist-textbox').value));
	if(name=='system-backup'){
	    data.time = 0;
	}else{
	    data.time = GetCurrentTime();
	}

	this.backuprestore[name] = data;
	Application.storage.set("nico_live_backup",this.backuprestore);
    },

    /**
     * リク、ストック、履歴の状態を復元する.
     */
    restore: function(name){
	let data = this.backuprestore[name];

	$('playlist-textbox').value = data.playlist_txt;
	NicoLiveHelper.request_list = JSON.parse(JSON.stringify(data.request));
	NicoLiveHelper.stock_list = JSON.parse(JSON.stringify(data.stock));
	NicoLiveHelper.playlist_list = JSON.parse(JSON.stringify(data.playlist));
	for(let i=0,item;item=NicoLiveHelper.playlist_list[i];i++){
	    NicoLiveHelper.playlist_list["_"+item.video_id] = item.playedtime;
	}

	NicoLiveRequest.updateView(NicoLiveHelper.request_list);
	NicoLiveStock.updateView(NicoLiveHelper.stock_list);
	NicoLiveHistory.updateView(NicoLiveHelper.playlist_list);

	NicoLiveHelper.saveAll();
    },

    init: function(){
	let item = Application.storage.get("nico_live_backup",null);
	if( !item ){
	    this.backuprestore = Storage.readObject("nico_live_backup",{});
	}
	this.createRestoreMenu();
    },
    destroy: function(){
	Application.storage.set("nico_live_backup",this.backuprestore);
	Storage.writeObject("nico_live_backup",this.backuprestore);
    }
};

window.addEventListener("load", function(e){ Backup.init(); }, false);
window.addEventListener("unload", function(e){ Backup.destroy(); }, false);
