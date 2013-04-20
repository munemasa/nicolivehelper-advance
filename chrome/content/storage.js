

var Storage = {
    dirname: "nicolivehelper",

    /**
     * ファイルに書き込む
     * @param k ファイル名(key)
     * @param v オブジェクト(value)
     */
    writeObject: function( k, v ){
	debugprint("write "+k);
	let f = this.getSaveDir();
	f.append( k );

	let os = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
	let flags = 0x02|0x08|0x20;// wronly|create|truncate
	os.init(f,flags,0664,0);
	let cos = GetUTF8ConverterOutputStream(os);
	cos.writeString( JSON.stringify(v) );
	cos.close();
    },

    /**
     * ファイルから読み込む
     * @param k ファイル名(key)
     * @param defvalue デフォルト値
     */
    readObject: function( k, defvalue ){
	debugprint("read "+k);
	let f = this.getSaveDir();
	f.append( k );

	try{
	    let istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
	    istream.init(f, 0x01, 0444, 0);
	    istream.QueryInterface(Components.interfaces.nsILineInputStream);
	    let cis = GetUTF8ConverterInputStream(istream);
	    // 行を配列に読み込む
	    let line = {}, hasmore;
	    let str = "";
	    do {
		hasmore = cis.readString(1024,line);
		str += line.value;
	    } while(hasmore);
	    cis.close();

	    let obj = JSON.parse(str);
	    return obj;
	} catch (x) {
	    return defvalue;
	}
    },

    /**
     * プロフィールのディレクトリを返す.
     * @return プロフィールディレクトリへのnsIFileを返す
     */
    getProfileDir: function(){
        let file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
	return file;
    },

    /**
     * データの保存先を返す
     * @return データ保存先をnsIFileで返す
     */
    getDefaultSaveDir: function(){
	let profdir = this.getProfileDir();
	profdir.append( this.dirname );
	return profdir;
    },

    /**
     * preferenceを取得.
     * 初期化の段階でConfigオブジェクトは読めないので直に.
     */
    getBranch:function(){
	var prefs = new PrefsWrapper1("extensions.nicolivehelperadvance.");
	return prefs;
    },

    getSaveDir: function(){
	let path;
	let retval;

	/* パスをキャッシュしないと設定の変更の影響を受けて、
	 * 現在の状態を新しいパスに向けて保存してしまうため。
	 * 保存先にすでにデータがあったときに上書きされてしまう。
	 */
	if( this._path ){
	    path = this._path;
	}else{
	    path = this.getBranch().getUnicharPref("storage-path");
	    this._path = path;
	}

	if( path ){
	    let localFile = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
	    localFile.initWithPath( path );
	    retval = localFile;
	}else{
	    retval = this.getDefaultSaveDir();
	}

	//Application.console.log("Storage Path="+this._path.path);
	return retval;
    },

    /**
     * データ保存ディレクトリを作成する.
     */
    createSaveDir: function(){
	let profdir = this.getSaveDir();
	CreateFolder( profdir.path );
    },

    init: function(){
	this.createSaveDir();
    }
};

Storage.init();
