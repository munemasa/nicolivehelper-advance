pref("extensions.nicolivehelperadvance.mikuonly",false);

pref("extensions.nicolivehelperadvance.no-auto-pname",false); // 自動P名抽出をしない

pref("extensions.nicolivehelperadvance.custom-script",false);

pref("extensions.nicolivehelperadvance.ml.do-classify",false);
pref("extensions.nicolivehelperadvance.ml.classes-value","");

pref("extensions.nicolivehelperadvance.comment.savefile", false);
pref("extensions.nicolivehelperadvance.comment.backlog", 50);
pref("extensions.nicolivehelperadvance.comment.viewlines", 500);
pref("extensions.nicolivehelperadvance.comment.184comment", true);
pref("extensions.nicolivehelperadvance.comment.preset-autocomplete",""); // オートコンプリートプリセット

pref("extensions.nicolivehelperadvance.request.autoreply", true);  // リクエストへの自動応答
pref("extensions.nicolivehelperadvance.request.allow", true);  // リクエスト可否
pref("extensions.nicolivehelperadvance.request.seiga", false); // 静画のリクエスト可否
pref("extensions.nicolivehelperadvance.request.allow-duplicative", false); // 重複許可
pref("extensions.nicolivehelperadvance.request.limit-newmovie", false); // 新着規制
pref("extensions.nicolivehelperadvance.request.accept-playedvideo",false); // 再生済みのリク許可
pref("extensions.nicolivehelperadvance.request.allow-req-n-min-ago",0); // 何分前以上の再生済みがOKか
pref("extensions.nicolivehelperadvance.request.accept-nreq",0); // 1枠何リクまでok

// リクエスト制限設定
pref("extensions.nicolivehelperadvance.request.restrict.enabled",false);
pref("extensions.nicolivehelperadvance.request.restrict.date-from","2007-08-31");
pref("extensions.nicolivehelperadvance.request.restrict.date-to","2007-08-31");
pref("extensions.nicolivehelperadvance.request.restrict.view-from",0);
pref("extensions.nicolivehelperadvance.request.restrict.view-to",0);
pref("extensions.nicolivehelperadvance.request.restrict.mylist-from",0);
pref("extensions.nicolivehelperadvance.request.restrict.mylist-to",0);
pref("extensions.nicolivehelperadvance.request.restrict.videolength-from",0);
pref("extensions.nicolivehelperadvance.request.restrict.videolength-to",0);
pref("extensions.nicolivehelperadvance.request.restrict.tag-include","");
pref("extensions.nicolivehelperadvance.request.restrict.tag-exclude","");
pref("extensions.nicolivehelperadvance.request.restrict.title-include","");
pref("extensions.nicolivehelperadvance.request.restrict.title-exclude","");
pref("extensions.nicolivehelperadvance.request.restrict.bitrate",0);
pref("extensions.nicolivehelperadvance.request.restrict.ng-video","");

pref("extensions.nicolivehelperadvance.play.style", 0);    // プレイスタイル(手動順次とか)
pref("extensions.nicolivehelperadvance.play.interval", 8);
pref("extensions.nicolivehelperadvance.play.maxtime", 0);
pref("extensions.nicolivehelperadvance.play.prepare",true);
pref("extensions.nicolivehelperadvance.play.prepare-timing",75);
pref("extensions.nicolivehelperadvance.play.in-time",false);

pref("extensions.nicolivehelperadvance.display.show_detail", false); // 動画情報詳細表示
pref("extensions.nicolivehelperadvance.display.font","");
pref("extensions.nicolivehelperadvance.display.font-color","");
pref("extensions.nicolivehelperadvance.display.font-scale",9);

// 詳細設定→ウィンドウ
pref("extensions.nicolivehelperadvance.window.auto-open",false);
pref("extensions.nicolivehelperadvance.window.auto-close",false);
pref("extensions.nicolivehelperadvance.window.auto-open-listener",false);
pref("extensions.nicolivehelperadvance.window.auto-close-listener",false);
pref("extensions.nicolivehelperadvance.window.auto-close-tab",false);
pref("extensions.nicolivehelperadvance.window.autoscroll",false);

// 詳細設定→通知
pref("extensions.nicolivehelperadvance.notice.time",3);
pref("extensions.nicolivehelperadvance.notice.area",false);
pref("extensions.nicolivehelperadvance.notice.dialog",false);
pref("extensions.nicolivehelperadvance.notice.comment",false);
pref("extensions.nicolivehelperadvance.notice.popup",false);
pref("extensions.nicolivehelperadvance.notice.sound",false);
pref("extensions.nicolivehelperadvance.notice.infobar",false);
pref("extensions.nicolivehelperadvance.notice.message","放送時間残り {pref:min-ago} 分になりました");
pref("extensions.nicolivehelperadvance.notice.extend","延長を行いました。新しい終了時刻は {end-time} です");
pref("extensions.nicolivehelperadvance.notice.soundfile","");


// Twitter
pref("extensions.nicolivehelperadvance.twitter.use-api","self");
pref("extensions.nicolivehelperadvance.twitter.when-beginlive",false);
pref("extensions.nicolivehelperadvance.twitter.when-playmovie",false);
pref("extensions.nicolivehelperadvance.twitter.when-addmylist",false);
pref("extensions.nicolivehelperadvance.twitter.begin","【ニコ生】「{live-title}」を開始しました。http://nico.ms/{live-id} {hashtag}");
pref("extensions.nicolivehelperadvance.twitter.play","再生中:{title} http://nico.ms/{id} #{id} {hashtag} http://nico.ms/{live-id}");

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

// スタートアップコメント
pref("extensions.nicolivehelperadvance.msg.startup-comment","");

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
