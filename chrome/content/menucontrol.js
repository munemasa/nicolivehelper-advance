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
	let elem = elem.firstChild.nextSibling;
	if( str ){
	    elem.hidden = false;
	    elem.nextSibling.hidden = false;
	}else{
	    elem.hidden = true;
	    elem.nextSibling.hidden = true;
	}
    },

    /**
     * リクエスト、ストックのメニューに動画IDをセットする
     */
    setVideoIdToMenu: function(elem, isrequest){
	let tr = FindParentElement(elem,'html:tr');
	let n = tr.sectionRowIndex;
	if( isrequest ){
	    $('menu-request-video-id').value = NicoLiveHelper.request_list[n].video_id;
	}else{
	    $('menu-stock-video-id').value = NicoLiveHelper.stock_list[n].video_id;
	}
    },

    /**
     * 選択範囲をクリップボードにコピーする
     */
    copyToClipboard:function(){
	let str = window.getSelection().toString() || "";
	CopyToClipboard(str);
    },

    searchByGoogle:function(){
	let str = window.getSelection().toString() || "";
	debugprint("search:"+str);
	let url = "http://www.google.com/search?q="+encodeURIComponent(str);
	NicoLiveWindow.openDefaultBrowser(url,true);
    },
    searchByNicoNico:function(){
	let str = window.getSelection().toString() || "";
	debugprint("search:"+str);
	let url = "http://www.nicovideo.jp/search/"+encodeURIComponent(str);
	NicoLiveWindow.openDefaultBrowser(url,true);
    }
};
