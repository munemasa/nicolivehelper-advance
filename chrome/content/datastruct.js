var LiveInfo = function(){
    this.request_id = "lv0";
    this.title = "";
    this.description = "";
    this.provider_type = "community";
    this.default_community = "co0";
    this.international = 0;
    this.is_owner = false;
    this.owner_id = "0";
    this.owner_name = "no name";
    this.is_reserved = false;
    this.base_time = 0;
    this.open_time = 0;
    this.start_time = 0;
    this.end_time = 0;
    this.twitter_tag = "#co0";
    this.nd_token = "";
    this.is_priority_prefecture = 0;
};

var UserInfo = function(){
    this.user_id = "0";
    this.nickname = "no name";
    this.is_premium = 0;  // 0:normal 1:premium 2,3:live caster 
    this.userAge = 0;
    this.userSex = 1;
    this.userDomain = "jp";
    this.userPrefecture = 0;
    this.userLanguage = "ja-jp";
    this.room_label = "co0";
    this.room_seetno = "0";
    this.is_join = 0;
    this.twitter_info = new Object();
    this.twitter_info.status = "enabled";
    this.twitter_info.screen_name = "no name";
    this.twitter_info.followers_count = 0;
    this.twitter_info.is_vip = false;
    this.twitter_info.profile_image_url = "";
    this.twitter_info.after_auth = 0;
    this.twitter_info.tweet_token = "";
};

var ServerInfo = function( addr, port, thread ){
    this.addr = addr;
    this.port = port;
    this.thread = thread;
};

var TwitterInfo = function(){
    this.live_enabled = 0;
    this.vip_mode_count = 10000;
    this.live_api_url = "http://watch.live.nicovideo.jp/api/";
};
