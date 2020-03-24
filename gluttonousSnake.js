var sw = 20, //一个方块的宽度
    sh = 20, //一个方块的高度
    tr = 30, //行数
    td = 30; //列数

var snake = null, //蛇的实例
    food = null, //食物的实例
    game = null; //游戏的实例

//方块的构造函数
function Square(x, y, className) {
    // console.log(this)
    this.x = x * sw;
    this.y = y * sh;

    this.viewContent = document.createElement('div'); //方块对应的DOM元素
    this.viewContent.className = className;
}

//为Square构造函数创建的方块添加样式并指定父级
Square.prototype.create = function() {
    // console.log(this)
    this.viewContent.style.position = 'absolute';
    this.viewContent.style.width = sw + 'px';
    this.viewContent.style.height = sh + 'px';
    this.viewContent.style.left = this.x + 'px';
    this.viewContent.style.top = this.y + 'px';

    this.parent = document.getElementById('snakeWrap'); //方块的父级
    this.parent.appendChild(this.viewContent);
}

//删除方块
Square.prototype.remove = function() {
    this.parent.removeChild(this.viewContent);
}

//蛇的构造函数，蛇其实就是一串方块的集合，这里我们需要用到蛇的4个属性，蛇头、蛇尾、方向以及蛇上每个方块的坐标
function Snake() {
    this.head = null; //存一下蛇头的信息
    this.tail = null; //存一下蛇尾的信息
    this.pos = []; //存储蛇身上每一个方块的信息，二维数组

    this.directionNum = { //存储蛇走的方向，用一个对象来表示
        left: {
            x: -1,
            y: 0,
            rotate: 180 //蛇头在不同方向中应该进行旋转
        },
        right: {
            x: 1,
            y: 0,
            rotate: 0
        },
        up: {
            x: 0,
            y: -1,
            rotate: -90
        },
        down: {
            x: 0,
            y: 1,
            rotate: 90
        }
    }
}

//对蛇做一个初始化，创建蛇头、蛇身1、蛇尾，并让这几部分组成一个链表关系
Snake.prototype.init = function() {
    //创建蛇头
    var snakeHead = new Square(2, 0, 'snakeHead');
    snakeHead.create();

    this.head = snakeHead; //存储蛇头信息
    this.pos.push([2, 0]); //把蛇头的位置信息存起来

    //创建蛇身1
    var snakeBody1 = new Square(1, 0, 'snakeBody');
    snakeBody1.create();
    this.pos.push([1, 0]); //把蛇身1的位置信息也存起来

    //创建蛇身2
    var snakeBody2 = new Square(0, 0, 'snakeBody');
    snakeBody2.create();

    this.tail = snakeBody2; //把蛇尾的信息存起来
    this.pos.push([0, 0]); //把蛇身2的位置信息也存起来

    //形成链表关系
    snakeHead.last = null;
    snakeHead.next = snakeBody1

    snakeBody1.last = snakeHead;
    snakeBody1.next = snakeBody2;

    snakeBody2.last = snakeBody1;
    snakeBody2.next = null;

    //给蛇添加一个默认的方向
    this.direction = this.directionNum.right; 

}

//获取蛇头的下一个位置对应的坐标，要根据这个坐标判定接下来要发生的事情
Snake.prototype.getNextPos = function() {
    var nextPos = [ //蛇头要走的下一个点的坐标
        this.head.x / sw + this.direction.x,
        this.head.y / sh + this.direction.y
    ]

    //下个点是自己，代表撞到了自己，游戏结束
    var selfCollied = false; //是否撞到自己
    this.pos.forEach(function(value) {
        if (value[0] == nextPos[0] && value[1] == nextPos[1]) {
            //如果数组中的两个数据都相等就说明下一个点是自身也就是撞到自己了
            selfCollied = true;
        }
    })

    if (selfCollied) {
        // console.log('撞到自己了');
        this.strategies.die.call(this);
        return;
    }

    //下个点是围墙，游戏结束
    if (nextPos[0] < 0 || nextPos[1] < 0 || nextPos[0] > td - 1 || nextPos[1] > tr - 1) {
        // console.log('撞墙了');
        this.strategies.die.call(this);
        return;
    }

    //下个点是食物，吃
    if (food && food.pos[0] == nextPos[0] && food.pos[1] == nextPos[1]) {
        //如果条件成立说明蛇头要走的下一个点就是食物
        // console.log('撞到食物了');
        this.strategies.eat.call(this);
        return;
    }

    //下个点什么都不是,走
    this.strategies.move.call(this);

}

//处理碰撞后要做的事情
Snake.prototype.strategies = {
    move: function(format) { //参数format用于决定要不要删除蛇尾,当传了这个参数后就表示要做的事情是吃，否则就是走
        //创建一个新的身体newBody,放在旧蛇头的位置
        var newBody = new Square(this.head.x / sw, this.head.y / sh, 'snakeBody');
        //更新链表的关系
        newBody.next = this.head.next;
        newBody.next.last = newBody;
        newBody.last = null;

        //把旧蛇头从原来的位置删除
        this.head.remove(); 
        newBody.create();

        //创建一个新蛇头(蛇头下一个要走到的点)
        var newHead = new Square(this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y, 'snakeHead');

        //更新链表关系
        newHead.next = newBody;
        newHead.last = null;
        newBody.last = newHead;
        newHead.viewContent.style.transform = 'rotate(' + this.direction.rotate + 'deg)';
        newHead.create();

        //更新蛇身上每一个方块的坐标
        this.pos.splice(0, 1, [this.head.x / sw + this.direction.x, this.head.y / sh + this.direction.y]);
        this.head = newHead; 

        if (!format) { //如果format的值为false表示需要删除（除了吃之外的操作）
            this.tail.remove();
            this.tail = this.tail.last;

            this.pos.pop();
        }
    },
    eat: function() {
        this.strategies.move.call(this, true);
        createFood();
        game.score++;
    },
    die: function() {
        // console.log('die')
        game.over();
    }
}

snake = new Snake();


//创建食物
function createFood() {
    //食物的随机坐标
    var x = null;
    var y = null;

    //判断食物是否出现在蛇身上，是的话就继续循环再随机生成一个坐标，不是的话就依据这个坐标产生食物
    var include = true; 
    while (include) {
        x = Math.round(Math.random() * (td - 1));
        y = Math.round(Math.random() * (tr - 1));

        snake.pos.forEach(function(value) {
            if (x != value[0] && y != value[1]) { //这个条件说明现在随机出来的这个坐标在蛇身上没有找到
                include = false;
            }
        });
    }

    //生成食物
    food = new Square(x, y, 'food');
    food.pos = [x, y]; //存储一下生成食物的坐标用于跟蛇头要走的下一个点作对比

    var foodDom = document.querySelector('.food');
    if (foodDom) {
        foodDom.style.left = x * sw + 'px';
        foodDom.style.top = y * sh + 'px';
    } else {
        food.create();
    }

}


//控制游戏
function Game() {
    this.timer = null;
    this.score = 0;
}

//初始化游戏
Game.prototype.init = function() {
    snake.init();
    createFood();

    document.onkeydown = function(ev) {
        if (ev.which == 37 && snake.direction != snake.directionNum.right) { //用户按下左键的时候蛇的前进方向不能是右，以下同理
            snake.direction = snake.directionNum.left;
        } else if (ev.which == 38 && snake.direction != snake.directionNum.down) { 
            snake.direction = snake.directionNum.up;
        } else if (ev.which == 39 && snake.direction != snake.directionNum.left) { 
            snake.direction = snake.directionNum.right;
        } else if (ev.which == 40 && snake.direction != snake.directionNum.up) { 
            snake.direction = snake.directionNum.down;
        }
    }
    this.start();
}

//开始游戏
Game.prototype.start = function() {
    this.timer = setInterval(function() {
        snake.getNextPos();
    }, 200);
}

//暂停游戏
Game.prototype.pause = function() {
    clearInterval(this.timer)
}

//游戏结束
Game.prototype.over = function() {
    clearInterval(this.timer);
    alert('你的得分为:' + this.score)

    //游戏回到最初始的状态
    var snakeWrap = document.getElementById('snakeWrap');
    snakeWrap.innerHTML = '';

    snake = new Snake();
    game = new Game();

    var startBtnWrap = document.querySelector('.startBtn');
    startBtnWrap.style.display = 'block';
}

//开启游戏
game = new Game();
var startBtn = document.querySelector('.startBtn button');
startBtn.onclick = function() {
    startBtn.parentNode.style.display = 'none';
    game.init();
};

var snakeWrap = document.getElementById('snakeWrap');
var pauseBtn = document.querySelector('.pauseBtn button');
snakeWrap.onclick = function() {
    game.pause();
    pauseBtn.parentNode.style.display = 'block';
}

pauseBtn.onclick = function() {
    game.start();
    pauseBtn.parentNode.style.display = 'none';
}
