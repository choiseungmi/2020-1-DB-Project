const http = require("http");
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const server = http.createServer(app);
const fs = require("fs");
const oracledb = require("oracledb");
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
app.use(express.static('views'));
// app.set('views', './views/statepage');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html')
require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({
  extended: false
})); //post에서bodyparser로 받기 위함

var router = express.Router();

// 오라클 접속
oracledb.getConnection({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  connectString: process.env.CONNECTSTR //oracle설치할때 지정한 이름(파일명으로 확인가능)
}, function(err, con) {
  if (err) {
    console.log("접속이 실패했습니다.", err);
  }
  conn = con;
});

//쿠키와 세션을 미들웨어로 등록한다
app.use(cookieParser());

//세션 환경 세팅
app.use(expressSession({
  secret: 'my key', //이때의 옵션은 세션에 세이브 정보를 저장할때 할때 파일을 만들꺼냐
  //아니면 미리 만들어 놓을꺼냐 등에 대한 옵션들임
  resave: true,
  saveUninitialized: true
}));

app.use(function(req, res, next) {
     res.locals.user = req.session.user;
     next();
});

app.get('/', (req, res) => {
  res.render('index.ejs', {
    message: ''
  });
})
app.get('/login', (req, res) => {
  res.render('statepage/login.html');
})

app.get("/signup", function(req, res) {
  res.render('register.ejs');
})
app.post("/singup", function(request, response) {
  console.log(request.body);
  //오라클에 접속해서 insert문을 실행한다.
  var id = request.body.id;
  var name = request.body.name;
  var email = request.body.email;
  var password = request.body.password;
  var address = request.body.address;

  // 쿼리문 실행
  conn.execute(`insert into accounts(user_id, name, email, password, address) values('${id}', '${name}', '${email}', '${password}','${address}')`, function(err, result) {
    if (err) {
      console.log("등록중 에러가 발생했어요!!", err);
      response.writeHead(500, {
        "ContentType": "text/html"
      });
      response.end("fail!!");
    } else {
      console.log("result : ", result);
      response.writeHead(200, {
        "ContentType": "text/html"
      });
      response.end("success!!");
    }
  });

});

app.post('/login', (req, res) => {
  var id = req.body.ID
  var password = req.body.password;

  if (req.session.user) {
    console.log('이미 로그인 되어 있음');
    res.render('detail.ejs');
  } else {
    conn.execute(`select password, name from accounts where user_id='${id}'`, function(err, result) {
      if (err) {
        console.log("로그인 중 에러가 발생했어요!!", err);
        console.log("fail: " + id + password);
        res.writeHead(400, {
          "ContentType": "text/html"
        });
        res.render('statepage/404.html');
      } else {
        console.log(result, result.rows.length);
        console.log("output:", result.rows, trim(password));
        if (result.rows.length > 0) {
          if (password == trim(result.rows[0][0])) {
            req.session.user =
                {
                    id: id,
                    pw: password,
                    name: result.rows[0][1],
                    authorized: true
                };
            res.render('detail.ejs');
            console.log("sucess: " + id + password);
            console.log(req.session.user['name']);
          } else {
            console.log("wrong: " + id + password);
            res.render('index.ejs', {
              message: '비밀번호가 틀렸습니다'
            });
          }
        } else {
          res.render('index.ejs', {
            message: '존재하지 않는 아이디입니다'
          });
          res.end("fail!!");
          console.log("0<user: " + id + password);
        }
        // console.log(result.metaData);  //테이블 스키마
        //         console.log(result.rows);
      }
    });
  }
})
router.route('/detail').get(
  function(req, res) {
    console.log('/process/product  라우팅 함수 실행');

    //세션정보는 req.session 에 들어 있다
    if (req.session.user) //세션에 유저가 있다면
    {
      res.render('detail.ejs');
    } else {
      res.redirect('/');

    }
  }
);


router.route('/logout').get( //설정된 쿠키정보를 본다
  function(req, res) {
    console.log('/process/loginout 라우팅 함수호출 됨');

    if (req.session.user) {
      console.log('로그아웃 처리');
      req.session.destroy(
        function(err) {
          if (err) {
            console.log('세션 삭제시 에러');
            return;
          }
          console.log('세션 삭제 성공');
          //파일 지정시 제일 앞에 / 를 붙여야 root 즉 public 안에서부터 찾게 된다
          res.redirect('/');
        }
      ); //세션정보 삭제

    } else {
      console.log('로긴 안되어 있음');
      res.redirect('/');
    }



  }
);


//라우터 미들웨어 등록하는 구간에서는 라우터를 모두  등록한 이후에 다른 것을 세팅한다
//그렇지 않으면 순서상 라우터 이외에 다른것이 먼저 실행될 수 있다
app.use('/', router); //라우트 미들웨어를 등록한다


app.all('*',
  function(req, res) {
    res.status(404).send('<h1> 요청 페이지 없음 </h1>');
  }
);
//
// //웹서버를 app 기반으로 생성
// var appServer = http.createServer(app);
// appServer.listen(app.get('port'),
//     function () {
//         console.log('express 웹서버 실행' + app.get('port'));
//     }
// );
function trim(value) {
  value = value.replace(/\s+/, ""); //왼쪽 공백제거
  value = value.replace(/\s+$/g, ""); //오른쪽 공백제거
  value = value.replace(/\n/g, ""); //행바꿈제거
  value = value.replace(/\r/g, ""); //엔터제거
  return value;
}
app.set('port', (process.env.HOST || 5000));

app.listen(app.get('port'), () => {
  console.log('running on port', app.get('port'));
})
