
Components.utils.import("resource://nicolivehelperadvancemodules/alert.jsm");

function Init(){
    var l = NicoLiveAlertModule.alert_target;
    for( k in l ){
	$('manage-community').appendItem(k,k);
    }
}

function Add(){
    var v = $('textbox-enter').value;
    if( !NicoLiveAlertModule.isRegistered(v) ){
	$('manage-community').appendItem(v,v);
	// TODO 第二引数は仮
	NicoLiveAlertModule.registerTarget(v, true);
    }
    $('textbox-enter').value = '';
}

function Delete(){
    var item = $('manage-community').selectedItem;
    if( item ){
	NicoLiveAlertModule.unregisterTarget(item.value);
	RemoveElement(item);
	// TODO window.opener.NicoLiveHelper.setAutoNextLiveIcon();
    }
}

function OnKeyDown(event){
    switch( event.keyCode ){
    case 27: // ESC
	window.close();
	break;
    case 46: // DEL
	Delete();
	break;
    default:
	return false;
    }
    return true;
}


window.addEventListener("load", function(e){ Init(); }, false);
