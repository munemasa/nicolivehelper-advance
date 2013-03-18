function OpenAboutDialog(){
    var f='chrome,toolbar,modal=yes,resizable=no,centerscreen';
    var w = window.openDialog('chrome://nicolivehelperadvance/content/about.xul','NLHAAbout',f);
    w.focus();
}

function OpenSettingsDialog(){
    var f='chrome,toolbar,modal=no,resizable=yes,centerscreen';
    var w = window.openDialog('chrome://nicolivehelperadvance/content/preferences.xul','NLHAdvPreference',f);
    w.focus();
}

function OpenVoteDialog(){
    var value = null;
    var f = "chrome,resizable=yes,centerscreen";
    var w = window.openDialog("chrome://nicolivehelperadvance/content/votedialog.xul","vote",f,value);
    w.focus();
}

/**
 * 連続コメントウィンドウを出す
 */
function OpenContinuousCommentWindow(){
    var value = null;
    var f = "chrome,resizable=yes,centerscreen";
    var w = window.openDialog("chrome://nicolivehelperadvance/content/continuouscomment.xul","vote",f,value);
    w.focus();
}

function OpenSimpleCommentWindow(){
    var value = null;
    var f = "chrome,resizable=yes,centerscreen";
    var w = window.openDialog("chrome://nicolivehelperadvance/content/simplecomment.xul","vote",f,value);
    w.focus();
}

function OpenAnchorWindow(){
    var value = null;
    var f = "chrome,dialog,centerscreen,modal";
    var w = window.openDialog("chrome://nicolivehelperadvance/content/anchorwin.xul","vote",f,value);
    w.focus();
}

function OpenMyListManager(){
    var value = {};
    var f = "chrome,resizable=yes,centerscreen";
    value.cookie = LibUserSessionCookie;
    value.agent = LibUserAgent;
    var w = window.openDialog("chrome://nicolivehelperadvance/content/mylistmanager/mylistmanager.xul","mylistmanager",f,value);
    w.focus();
}
