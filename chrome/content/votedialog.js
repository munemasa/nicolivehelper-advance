function AcceptFunction(){
    var texts = document.getElementsByTagName('textbox');
    var i,txt,str="";
    let item = new Object();
    item.value = new Array();
    for(i=0;txt=texts[i];i++){
	if(txt.value){
	    var tmp = txt.value.replace(/"/g,"");
	    str += '"'+tmp+'" ';
	}
	item.value.push( texts[i].value );
    }
    //Application.console.log(str);
    let mail = document.getElementById("menu-se").value;
    opener.NicoLiveHelper.postCasterComment("/vote start "+str, mail);

    VoteDialog.recent.unshift( item );
    if( VoteDialog.recent.length>10 ){
	VoteDialog.recent.pop();
    }
    return true;
}

var Storage = window.opener.Storage;

var VoteDialog = {
    recent: [],

    restore:function(i){
	let item = this.recent[i];
	let texts = document.getElementsByTagName('textbox');
	let txt;
	for(i=0;txt=texts[i];i++){
	    txt.value = item.value[i] || "";
	}
    },

    setRecent4Videos: function(){
	let playlist = window.opener.NicoLiveHelper.playlist_list;
	let n = playlist.length-1;
	let texts = document.getElementsByTagName('textbox');
	for( let i=0; i<4; i++ ){
	    let item = playlist[n-i];
	    texts[4-i].value = item.title;
	}
    },

    init:function(){

	this.recent = Storage.readObject("nico_live_recent_enquete",[]);

	for( let i=0,item; item=this.recent[i]; i++ ){
	    let menuitem = CreateMenuItem( item.value[0], i );
	    $('menu-recent').appendChild(menuitem);
	}

    },
    destroy:function(){
	Storage.writeObject("nico_live_recent_enquete", this.recent);
    }
};


window.addEventListener("load", function(e){ VoteDialog.init(); }, false);
window.addEventListener("unload", function(e){ VoteDialog.destroy(); }, false);
