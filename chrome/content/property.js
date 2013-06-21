
var Property = {
    vinfo: {},

    accept: function(){
	let newstr = $('additional_info').value;
	if( newstr != this.old_additional_info ){
	    window.opener.Database.setAdditional( this.vinfo.video_id, newstr );
	}

	newstr = $('pname').value;
	if( newstr != this.old_pname ){
	    window.opener.Database.setPName( this.vinfo.video_id, newstr );
	}
	return true;
    },

    checkSelection:function(){
	let str = window.getSelection().toString();
	if( str ){
	    $('menu-copy').disabled = false;
	}else{
	    $('menu-copy').disabled = true;
	}
    },

    copyToClipboard:function(){
	let str = window.getSelection().toString();
	CopyToClipboard(str);
    },

    init: function(){
	this.vinfo = window.arguments[0].vinfo;
	document.title = this.vinfo.video_id + "'s Property";

	$('video_thumbnail').src = this.vinfo.thumbnail_url;
	$('video_id').value = this.vinfo.video_id;
	$('video_type').value = this.vinfo.movie_type;
	$('video_title').innerHTML = htmlspecialchars(this.vinfo.title);
	$('video_date').value = GetDateString(this.vinfo.first_retrieve*1000);
	$('video_views').value = FormatCommas(this.vinfo.view_counter);
	$('video_comments').value = FormatCommas(this.vinfo.comment_num);
	$('video_mylist_counter').value = FormatCommas(this.vinfo.mylist_counter);
	$('video_length').value = this.vinfo.length;
	$('video_highbitrate').innerHTML = this.vinfo.highbitrate + " kbps";
	$('video_description').innerHTML = htmlspecialchars(this.vinfo.description);

	this.old_additional_info = window.opener.Database.getAdditional( this.vinfo.video_id );
	$('additional_info').value = this.old_additional_info;
	this.old_pname = window.opener.Database.getPName( this.vinfo.video_id );
	$('pname').value = this.old_pname;

	let text = "";
	for(domain in this.vinfo.tags){
	    text += "["+domain+"]:"+ htmlspecialchars(this.vinfo.tags[domain].join(' '));
	    text += "<html:br/>";
	}
	$('video_tags').innerHTML = text;

	$('additional_info').focus(); // これを初期表示域に入るように一旦フォーカス当てる
	$('pname').focus();
    },
    destroy:function(){
    }
};



window.addEventListener("load", function(e){ Property.init(); }, false);
window.addEventListener("unload", function(e){ Property.destroy(); }, false);
