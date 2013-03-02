pref("extensions.nicolivehelperadvance.mikuonly",false);

pref("extensions.nicolivehelperadvance.comment.backlog", 50);

pref("extensions.nicolivehelperadvance.request.autoreply", true);  // リクエストへの自動応答
pref("extensions.nicolivehelperadvance.request.allow", true);  // リクエスト可否
pref("extensions.nicolivehelperadvance.request.seiga", false); // 静画のリクエスト可否
pref("extensions.nicolivehelperadvance.request.allow-duplicative", false); // 重複許可

pref("extensions.nicolivehelperadvance.play.style", 0);    // プレイスタイル(手動順次とか)
pref("extensions.nicolivehelperadvance.play.interval", 8);
pref("extensions.nicolivehelperadvance.play.maxtime", 0);

pref("extensions.nicolivehelperadvance.display.show_detail", false); // 動画情報詳細表示

// 動画情報
pref("extensions.nicolivehelperadvance.videoinfo.interval", 8);
pref("extensions.nicolivehelperadvance.videoinfo.comment-type", 0);
pref("extensions.nicolivehelperadvance.videoinfo.revert-line", 0);
pref("extensions.nicolivehelperadvance.videoinfo.playfailed","{id}の再生に失敗しました");
pref("extensions.nicolivehelperadvance.videoinfo1","♪Length:{length} Views:{view} Comments:{comment} Mylist:{mylist}");
pref("extensions.nicolivehelperadvance.videoinfo2","♪{title}<br>Date:{date}");
pref("extensions.nicolivehelperadvance.videoinfo3","");
pref("extensions.nicolivehelperadvance.videoinfo4","");
pref("extensions.nicolivehelperadvance.videoinfo1-command","");
pref("extensions.nicolivehelperadvance.videoinfo2-command","");
pref("extensions.nicolivehelperadvance.videoinfo3-command","");
pref("extensions.nicolivehelperadvance.videoinfo4-command","");

// リクエストへの応答
pref("extensions.nicolivehelperadvance.msg.notaccept",">>{comment_no} 現在リクエストを受け付けていません");
pref("extensions.nicolivehelperadvance.msg.deleted",">>{comment_no} その動画は削除されているか、見つかりません");
pref("extensions.nicolivehelperadvance.msg.newmovie",">>{comment_no} その動画は7日以内に投稿された動画です(新着制限)");
pref("extensions.nicolivehelperadvance.msg.played",">>{comment_no} その動画は既に再生されました");
pref("extensions.nicolivehelperadvance.msg.requested",">>{comment_no} その動画は既にリクエストされています");
pref("extensions.nicolivehelperadvance.msg.accept",">>{comment_no} リクエストを受け付けました");
pref("extensions.nicolivehelperadvance.msg.no-live-play",">>{comment_no} その動画は生放送での引用が許可されていません");
pref("extensions.nicolivehelperadvance.msg.within-livespace",">>{comment_no} この枠内に収まらないため受け付けられませんでした");
pref("extensions.nicolivehelperadvance.msg.requestok","");
pref("extensions.nicolivehelperadvance.msg.requestok-command","");
pref("extensions.nicolivehelperadvance.msg.requestng","");
pref("extensions.nicolivehelperadvance.msg.requestng-command","");
pref("extensions.nicolivehelperadvance.msg.lessmylists",">>{comment_no} マイリスト数が少ないです");
pref("extensions.nicolivehelperadvance.msg.greatermylists",">>{comment_no} マイリスト数が多いです");
pref("extensions.nicolivehelperadvance.msg.lessviews",">>{comment_no} 再生数が少ないです");
pref("extensions.nicolivehelperadvance.msg.greaterviews",">>{comment_no} 再生数が多いです");
pref("extensions.nicolivehelperadvance.msg.longertime",">>{comment_no} 再生時間が長いです");
pref("extensions.nicolivehelperadvance.msg.shortertime",">>{comment_no} 再生時間が短いです");
pref("extensions.nicolivehelperadvance.msg.outofdaterange",">>{comment_no} 投稿日時が範囲外です");
pref("extensions.nicolivehelperadvance.msg.requiredkeyword",">>{comment_no} タグにキーワードが含まれていません<br>{=info.restrict.requiredkeyword}");
pref("extensions.nicolivehelperadvance.msg.forbiddenkeyword",">>{comment_no} タグに「{=info.restrict.forbiddenkeyword}」が含まれています");
pref("extensions.nicolivehelperadvance.msg.requiredkeyword-title",">>{comment_no} タイトルにキーワードが含まれていません<br>{=info.restrict.requiredkeyword}");
pref("extensions.nicolivehelperadvance.msg.forbiddenkeyword-title",">>{comment_no} タイトルに「{=info.restrict.forbiddenkeyword}」が含まれています");
pref("extensions.nicolivehelperadvance.msg.high-bitrate",">>{comment_no} ビットレートが高いです");
pref("extensions.nicolivehelperadvance.msg.limitnumberofrequests",">>{comment_no} リクエストは1人{=info.restrict.numberofrequests.toString()}件までです");
pref("extensions.nicolivehelperadvance.msg.ng-video-reply-message",">>{comment_no} その動画はNG動画です");
