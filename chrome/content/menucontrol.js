/*
Copyright (c) 2009 amano <amano@miku39.jp>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

var MenuControl = {

    /**
     * テキストが範囲選択されていたら、指定のメニューの表示・非表示を切り替える
     * @param elem メニュー要素
     */
    showSelectionMenuIfTextSelected:function(elem){
	let str = window.getSelection().toString() || "";
	elem = elem.firstChild.nextSibling;
	if( str ){
	    elem.hidden = false;
	    elem.nextSibling.hidden = false;
	}else{
	    elem.hidden = true;
	    elem.nextSibling.hidden = true;
	}
    },

    /**
     * リクエスト、ストック、再生履歴のメニューに動画IDをセットする
     */
    setVideoIdToMenu: function(elem, type){
	let tr = FindParentElement(elem,'tr');
	let n = tr.sectionRowIndex;
	switch( type ){
	case 0:
	    $('menu-request-video-id').value = NicoLiveHelper.request_list[n].video_id;
	    break;
	case 1:
	    $('menu-stock-video-id').value = NicoLiveHelper.stock_list[n].video_id;
	    break;
	case 2:
	    $('menu-playlist-video-id').value = NicoLiveHelper.playlist_list[n].video_id;
	    break;
	}
    },

    /**
     * 選択範囲をクリップボードにコピーする
     */
    copyToClipboard:function(){
	let str = window.getSelection().toString() || "";
	CopyToClipboard(str);
    },

    /** 動画の先読みを行う.
     * @param node メニューがポップアップしたノード
     */
    prepare:function(node){
	let elem = FindParentElement(node,'vbox');
	let vid = elem.getAttribute('nicovideo_id');
	NicoLiveHelper.postCasterComment('/prepare '+vid,""); // 動画IDを取れる.
    },

    /**
     * プロフィールを開く.
     * @param node ポップアップノード
     */
    showProfile:function(node){
	let elem = FindParentElement(node,'vbox');
	let vid = elem.getAttribute('nicovideo_id');
	let vinfo = NicoLiveHelper.findVideoInfoFromMemory( vid );
	NicoLiveWindow.openDefaultBrowser("http://www.nicovideo.jp/user/"+vinfo.user_id, true);
    },

    /**
     * 現在のvbox内の動画IDをコピーする
     * @paran node メニューがポップアップしたノード
     */
    copyVideoIdToClipboard:function(node){
	let elem = FindParentElement(node,'vbox');
	CopyToClipboard(elem.getAttribute('nicovideo_id')); // 動画IDを取れる.
    },

    /**
     * プロパティを表示する
     * @param node ポップアップノード
     */
    showProperty:function(node){
	let elem = FindParentElement(node,'vbox');
	let vid = elem.getAttribute('nicovideo_id');
	let vinfo = NicoLiveHelper.findVideoInfoFromMemory( vid );
	let param = { "vinfo": vinfo };
	let f = "chrome,centerscreen,dependent,resizable=yes";
	window.openDialog("chrome://nicolivehelperadvance/content/property.xul",vid,f,param);

    },

    /**
     * 選択範囲のテキストをGoogle検索.
     */
    searchByGoogle:function(){
	let str = window.getSelection().toString() || "";
	debugprint("search:"+str);
	let url = "http://www.google.com/search?q="+encodeURIComponent(str);
	NicoLiveWindow.openDefaultBrowser(url,true);
    },
    /**
     * 選択範囲のテキストをニコニコ動画で検索.
     */
    searchByNicoNico:function(){
	let str = window.getSelection().toString() || "";
	debugprint("search:"+str);
	let url = "http://www.nicovideo.jp/search/"+encodeURIComponent(str);
	NicoLiveWindow.openDefaultBrowser(url,true);
    },

    /**
     * 著作権管理団体のDBで作品コード検索するメニューの表示・非表示を制御する.
     */
    showRightsSearch: function(){
	let str = window.getSelection().toString();
	if( str.match(/...[-+=/]....[-+=/]./) ){
	    $('comment-search-jasrac').hidden = false;
	    $('comment-search-elicense').hidden = true;
	}else if( str.match(/\d{5}/) ){
	    $('comment-search-jasrac').hidden = true;
	    $('comment-search-elicense').hidden = false;
	}else{
	    $('comment-search-jasrac').hidden = true;
	    $('comment-search-elicense').hidden = true;
	}
    }
};
