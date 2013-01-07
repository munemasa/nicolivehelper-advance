/**
 * ツールバーの機能
 */
var Toolbar = {

    /**
     * 次曲ボタンを押したときのアクション.
     */
    playNext: function(){
	let request = NicoLiveHelper.request_list;
	let stock = NicoLiveHelper.stock_list;

	switch( NicoLiveHelper.playstyle ){
	case PLAY_SEQUENTIAL:
	default:
	    if( request.length ){
		NicoLiveRequest.playRequest(0);
		return;
	    }else if( stock.length ){
		for(let i=0,item; item=stock[i]; i++){
		    if( !item.is_played ){
			NicoLiveStock.playStock( i );
			return;
		    }
		}
	    }
	    ShowNotice("再生できる動画がありませんでした");
	    break;

	case PLAY_RANDOM:
	    break;

	case PLAY_CONSUMPTION:
	    break;
	}
    }

};
