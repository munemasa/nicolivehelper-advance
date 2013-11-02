var DirLists = new Array();

if( window.opener.NicoLiveHelper.liveinfo.title ){
    document.title = window.opener.NicoLiveHelper.liveinfo.title + " - "+ document.title;
}

function SendComment( textbox, ev ){
    var str = textbox.value;
    if(ev && ev.keyCode != 13) return true;

    var mail;
    try{
	mail = window.opener.NicoLiveComment.elem_mail.value;
    }catch(e){
	mail = '';
    }

    if( $('use-listener-comment').hasAttribute('checked') ){
	window.opener.NicoLiveHelper.postListenerComment(str, mail);
	textbox.value = '';
    }else{
	if( $('no-clear').hasAttribute('checked') ){
	    window.opener.NicoLiveHelper.postCasterComment(str, mail);
	    textbox.value = '';
	}else{
	    window.opener.NicoLiveComment.postComment(textbox,ev);
	}
    }
    return false;
}

/**
 * テキストファイルを読み込む
 * @param file ファイルのパス名
 */
function ReadTextFile(file){
    var istream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
    istream.init(file, 0x01, 0444, 0);
    istream.QueryInterface(Components.interfaces.nsILineInputStream);
    
    var cis = GetUTF8ConverterInputStream(istream);
    
    // 行を配列に読み込む
    var line = {}, hasmore;
    var str = "";
    do {
	hasmore = cis.readString(1024,line);
	str += line.value;
    } while(hasmore);
    istream.close();
    
    document.getElementById('textbox-comment').value = str;
}

function ChangeDisplayState(){
    var tmp = $('template-tree');
    if( tmp.style.display=="none" ){
	tmp.style.display = '';
	$('icon').src = 'data/expanded.png';
    }else{
	tmp.style.display = 'none';
	$('icon').src = 'data/collapsed.png';
    }
    setTimeout(function(){
	window.innerHeight = $('body').outerHeight;
    },50);
}

function SelectFolder(){
    let path = $('menu-filelist').getAttribute('dir');
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "テンプレート用テキストファイルの保存先を指定してください", nsIFilePicker.modeGetFolder);
    if( path ){
	fp.displayDirectory = OpenFile(path);
    }
    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
	var path = fp.file.path;
	$('menu-filelist').setAttribute('dir',path);
	Init();
    }
}

function Init(){
    try{
	DirLists = new Array();
	RemoveChildren( $('menu-filelist') );

	let path = $('menu-filelist').getAttribute('dir') || "";
	$('menu-filelist').parentNode.setAttribute('tooltiptext',path);

	let file = OpenFile(path);
	file.QueryInterface(Components.interfaces.nsILocalFile);
	let direntry = file.directoryEntries.QueryInterface(Components.interfaces.nsIDirectoryEnumerator);

	let dir;
	let i=0;
	while( dir = direntry.nextFile ){
	    if( dir.leafName.match(/\.txt$/) ){
		DirLists.push(dir);
		let menuitem = CreateMenuItem(dir.leafName,i);
		$('menu-filelist').appendChild(menuitem);
		i++;
	    }
	}
    } catch (x) {
	Application.console.log(x);
    }
}

function Destroy(){
}

window.addEventListener("load", function(e){ Init(); }, false);
window.addEventListener("unload", function(e){ Destroy(); }, false);
