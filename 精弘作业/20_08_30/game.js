/* 
游戏类似小恐龙跑酷
数据结构： 队列
及时的出队操作使得每次只移动少量的滑块
数据绑定用到了 Vue,操作 DOM 用到 jquery
*/
arrows = ["W", "A", "S", "D", "J", "K", "L"]; // 自定义英文大写字母
function startGame() {
    $("#start").css("display", "none");
    $("#score_pad").css("display", "block");
    $("#time").css("display", "block");

    timeCounter(); //倒计时器
    
    total = 0; //页面上的滑块总数，也就是队的长度（很短
    inGame = true; // 判定是否正在游戏，防止结束后输入姓名时误判
    creat(); //先生成第一组（防 scrool() 越界
    scroll(); //控制滑块滚动
    detect(); // 枚举监测键盘时间和滑块位移是否达标（枚举次数由 total 决定
    seCreat = setInterval(() => {creat();}, 1000); 
}
function creat() { //生成滑块
    var value = Math.floor(Math.random() * arrows.length);
    var ele = "<div class='arrowblock' style='display: block' value='" + arrows[value].toLowerCase() + "'>" + arrows[value] + "</div>";
    $("#scroll_area").append(ele); //入队
    total++;
}
function syncChangeColor(a) { // 操作反馈
    var col = ["red", "green"];
    $("#sync_area").css("borderColor", col[a]);
    setTimeout(() => {$("#sync_area").css("borderColor", "blue");}, 400);
}
function scroll() {
    len = new Array; //记录在场滑块的位置（right
    seScorll = setInterval(() => {
        blocks = $(".arrowblock");
        for (var i = 0; i < total; i++) {
            var temp = blocks[i].style.right;
            len[i] = Number(temp.substr(temp, temp.length - 2)) + 3;
            blocks[i].style.right = String(len[i]) + "px";
        }
        if (len[0] >= 698 && blocks[0].style.display == "block") {
            $(".arrowblock:first-child").remove(); //出队
            total--;
            scoreCounter(0);
        }
    }, 30);
}
function detect() {
    var x = document.getElementById("body");
    x.onkeyup = on; 
    function on (va) { 
        if (!inGame) return;
        var e = e || window.event;
        for (var i = 0; i < total; i++)
            if (len[i] >= 580 && len[i] <= 630) {
                if (va.key == blocks[i].getAttribute("value")) scoreCounter(1), syncChangeColor(1);
                else scoreCounter(0), syncChangeColor(0);
                $(".arrowblock:first-child").remove(); // 中途出队
                total--;
                break;
            }
    }
}
function creatSelect(ys) {
    $("#sideBar").append("<div id='select'></div>");
    $("#select").append("<input class='arrow' type='button' value='<' onclick='turn(0)'>");
    for (var i = 1; i <= ys; i++) {
        $("#select").append("<input class='num' type='button' value='" + String(i) + "' onclick='change(" + String(i - 1) + ")'>");
    }
    $("#select").append("<input class='arrow' type='button' value='>' onclick='turn(1)'>");
}
function change(num) { // 直接由 button 调用，绑定选择栏高亮 + 改变页内容
    $(".num")[foc].style.backgroundColor = "lightyellow";
    foc = num;
    $(".num")[num].style.backgroundColor = "bisque";
    var max = Math.min((num + 1) * 10, 50); //排名条数上限
    $(".userInRank").remove();
    for (var i = num * 10; i < Math.min(max, userRankInfo.name.length); i++) {
        $("#rank").append("<div class='userInRank'> <b>" + userRankInfo.name[i] + "</b>: " + userRankInfo.score[i]);
    }
}
function turn(st) {
    if (st == 0 && foc > 0) change(foc - 1);
    else if (st == 1 && foc < max_page - 1) change(foc + 1);
}
var counter = new Vue ({
    el: "#gameplayer",
    data: {
        time: 10,
        score: 0
    },
    mounted() {
        // 函数全局声明
       window.timeCounter = this.timeCounter;
       window.scoreCounter = this.scoreCounter;
    },
    methods: {
        timeCounter: function() {
            if (this.time == 10){
                var seTime = setInterval(() => {
                    if (this.time != 0) this.time--;
                    else {
                        clearInterval(seTime);
                        checkout();
                    }
                }, 1000)
            }
        },
        scoreCounter: function(att) { // 计分器
            if (att == 1) this.score++;
            else this.score--;
        }
    }
})
function checkout() {
    // 结束所有计时器
    inGame = false;
    alert("Game over!");
    clearInterval(seCreat);
    clearInterval(seScorll);

    // 获取后端信息
    getRank();
    $("#rank").append("<input id='user_name' type='text' onkeydown='keyupSubmit(event);'>");
}
function keyupSubmit(e) {
    var evt = e || window.event;
    if (evt.keyCode == 13) {
        addToRank(document.getElementById("user_name").value); 

        setTimeout(() => { // 经典延迟（防止提前抬手
            getRank(); // POST后第二次获取排行，调用后端排序
        }, 50);
        
        $("#user_name").remove(); //输入框删除
        $("#rank").append("<input id='refresh' type='button' value='再玩一次' onclick='location.reload()'>");
    }
}
function getRank() {
    var id = $("#login_info").html(); //排行榜学号（大区
    $.ajax({
        type: "GET",
        url: "http://localhost:8080/game",
        data: "id=" + id, // GET请求发送字符串
        dataFilter: function(data, type) {
            userRankInfo = JSON.parse(data);
            max_page = Math.min(5, Math.floor((userRankInfo.name.length + 9) / 10)); //总页数
            $(".userInRank").remove(); // ajax异步对执行顺序的影响，清空排行榜得写这里
            $("#select").remove();
            creatSelect(max_page); // 生成页码选择栏，参数为页数
            foc = 0, change(foc); //初始化进入第一页
        },
        success: function(data) {},
        error: function(jqXHR) {console.log("Error:" + jqXHR.status);}
    });
}
function addToRank(name) {
    var data = {};
    data.id = $("#login_info").html();
    data.name = name;
    data.score = $("#score_pad").html().split(" ")[1]; //Vue里面的数据读不到
    $.ajax({
        type: "POST",
        url: "http://localhost:8080/game",
        data: JSON.stringify(data),
        success: function(data) {},
        error: function(jqXHR) {console.log("Error:" + jqXHR.status);}
    })
}