function OpenAboutDialog(){
    var f='chrome,toolbar,modal=yes,resizable=no,centerscreen';
    var w = window.openDialog('chrome://nicolivehelperadvance/content/about.xul','NLHAAbout',f);
    w.focus();
}

function OpenSettingsDialog(){
    var f='chrome,toolbar,modal=no,resizable=yes,centerscreen';
    if( Config.topmost ){
	f += ',alwaysRaised=yes';
    }
    var w = window.openDialog('chrome://nicolivehelperadvance/content/preferences.xul','NLHAdvPreference',f);
    SetWindowTopMost( w, Config.topmost );
    w.focus();
}

function OpenVoteDialog(){
    var value = null;
    var f = "chrome,resizable=yes,centerscreen";
    if(Config.topmost){
	f += ',alwaysRaised=yes';
    }
    var w = window.openDialog("chrome://nicolivehelperadvance/content/votedialog.xul","vote",f,value);
    SetWindowTopMost( w, Config.topmost );
    w.focus();
}

/**
 * 連続コメントウィンドウを出す
 */
function OpenContinuousCommentWindow(){
    var value = null;
    var f = "chrome,resizable=yes,centerscreen";
    if(Config.topmost){
	f += ',alwaysRaised=yes';
    }
    var w = window.openDialog("chrome://nicolivehelperadvance/content/continuouscomment.xul","vote",f,value);
    SetWindowTopMost( w, Config.topmost );
    w.focus();
}

function OpenSimpleCommentWindow(){
    var value = null;
    var f = "chrome,resizable=yes,centerscreen";
    if(Config.topmost){
	f += ',alwaysRaised=yes';
    }
    var w = window.openDialog("chrome://nicolivehelperadvance/content/simplecomment.xul","vote",f,value);
    SetWindowTopMost( w, Config.topmost );
    w.focus();
}

function OpenAnchorWindow(){
    var value = null;
    var f = "chrome,dialog,centerscreen,modal";
    if(Config.topmost){
	f += ',alwaysRaised=yes';
    }
    var w = window.openDialog("chrome://nicolivehelperadvance/content/anchorwin.xul","vote",f,value);
    SetWindowTopMost( w, Config.topmost );
    w.focus();
}

function OpenMyListManager(){
    var value = {};
    var f = "chrome,resizable=yes,centerscreen";
    if(Config.topmost){
	f += ',alwaysRaised=yes';
    }
    value.cookie = LibUserSessionCookie;
    value.agent = LibUserAgent;
    var w = window.openDialog("chrome://nicolivehelperadvance/content/mylistmanager/mylistmanager.xul","mylistmanager",f,value);
    SetWindowTopMost( w, Config.topmost );
    w.focus();
}
