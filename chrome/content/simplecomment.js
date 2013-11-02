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
}
