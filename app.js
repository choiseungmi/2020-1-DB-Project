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
var moment = require('moment');
app.use(express.static('views'));
// app.use(express.static('views/statepage/vendor'));
// app.set('views', './views/statepage');
app.engine('html', require('ejs').renderFile);
// app.set('view engine', 'html')
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
oracledb.autoCommit = true;

//쿠키와 세션을 미들웨어로 등록
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
  res.redirect('statepage/login.html');
})

app.get('/signup', (req, res) => {
  res.render('register.ejs');
})
app.post("/signup", function(request, response) {
  //오라클에 접속해서 insert문을 실행한다.
  var id = request.body.id;
  var name = request.body.name;
  var email = request.body.email;
  var password = request.body.password;
  var password2 = request.body.password2;
  var address = request.body.address;
  var tel = request.body.tel;
  // 쿼리문 실행
  if (password == password2) {
    conn.execute(`select name
                  from officer
                  order by manage_num`,
      function(err, result) {
        if (err) {
          console.log("등록중 에러가 발생했어요!!", err);
          response.writeHead(500, {
            "ContentType": "text/html"
          });
          response.end("fail!!");
        } else {
          if (result.rows.length > 0) {
            var officer = result.rows[0][0];
            conn.execute(`insert into accounts(user_id, name, email, password, address, start_date, end_date, state, tel, officer_name)
                        values('${id}', '${name}', '${email}', '${password}','${address}', SYSDATE, SYSDATE+14, 1,'${tel}','${officer}')`,
              function(err, result) {
                if (err) {
                  console.log("등록중 에러가 발생했어요!!", err);
                  response.writeHead(500, {
                    "ContentType": "text/html"
                  });
                  response.end("fail!!");
                } else {
                  conn.execute(`update officer
                              set manage_num=manage_num+1
                              where name='${officer}'`,
                    function(err, result) {
                      if (err) {
                        console.log("등록중 에러가 발생했어요!!", err);
                        response.writeHead(500, {
                          "ContentType": "text/html"
                        });
                        response.end("fail!!");
                      } else {
                        console.log("result : ", result);
                        response.redirect("/");
                      }
                    });
                }
              });

          }
        }
      });

    // conn.commit();
  } else {
    response.send('<script type="text/javascript">alert("비밀번호가 일치하지 않습니다. 다시 입력해주세요");location.href="/signup";</script>');
  }
});

app.get("/emergency", function(request, response) {
  if (request.session.user) {
    response.render('emergency.ejs', {
      name: request.session.user.name,
      hospital: null
    });
  } else {
    response.redirect('/');
  }
  // conn.commit();
});
app.post("/emergency", function(request, response) {
  // 쿼리문 실행
  if (request.session.user) {
    var name = request.session.user.name;
    conn.execute(`select name
                  from hospital
                  where area in (select address from accounts where name='${name}') and room <> 0
                  order by (maximum-waiting)*room DESC`, function(err, result) {
      if (err) {
        response.writeHead(500, {
          "ContentType": "text/html"
        });
        response.end("fail!!");
      } else {
        console.log(result);
        if (result.rows.length > 0) {
          var hospital = result.rows[0][0];
          conn.execute(`update hospital
                        set room=room-1
                        where name='${hospital}'`,
            function(err, result) {
              if (err) {
                response.writeHead(500, {
                  "ContentType": "text/html"
                });
                response.end("fail!!");
              }
            });
          response.render('emergency.ejs', {
            name: name,
            hospital: hospital
          });
        } else {
          response.render('emergency.ejs', {
            name: name,
            hospital: "병원이 없습니다"
          });
        }
      }
    });
  } else {
    response.redirect('/');
  }
  // conn.commit();
});

app.get("/product", function(request, response) {
  if (request.session.user) {
    response.render('product.ejs', {
      name: request.session.user.name,
      message: null
    });
  } else {
    response.redirect('/');
  }
});
app.post("/product", function(request, response) {
  var products = request.body.pro;
  // 쿼리문 실행
  if (request.session.user) {
    for (pro in products) {
      conn.execute(`update storage
                  set num=num-1
                  where area in (select address from accounts where name='${request.session.user.name}')
                  and product='${pro}'`,
        function(err, result) {
          if (err) {
            response.writeHead(500, {
              "ContentType": "text/html"
            });
            response.end("fail!!");
          } else {
            console.log(pro);
            console.log(products[products.length - 1]);
            if (pro == products[products.length - 1]) {
              response.render('product.ejs', {
                name: request.session.user.name,
                message: '요청되었습니다.'
              });
            }
          }
        });
    }
    response.render('product.ejs', {
      name: request.session.user.name,
      message: '요청되었습니다.'
    });
  } else {
    response.redirect('/');
  }
  // conn.commit();
});

app.post('/login', (req, res) => {
  var id = req.body.ID
  var password = req.body.password;
  if (req.session.user) {
    console.log('이미 로그인 되어 있음');
    res.render('detail.ejs', {
      name: req.session.user.name,
      start_date: req.session.user.start_date,
      end_date: req.session.user.end_date,
      address: req.session.user.address,
      address: req.session.user.officer
    });
  } else {
    conn.execute(`select password, name, TO_CHAR(start_date, 'YYYY-MM-DD'), TO_CHAR(end_date, 'YYYY-MM-DD'), address, officer_name from accounts where user_id='${id}'`, function(err, result) {
      if (err) {
        res.writeHead(404, {
          "ContentType": "text/html"
        });
        res.render('statepage/404.html');
      } else {
        if (result.rows.length > 0) {
          if (password == trim(result.rows[0][0])) {
            req.session.user = {
              id: id,
              pw: password,
              name: result.rows[0][1],
              start_date: result.rows[0][2],
              end_date: result.rows[0][3],
              address: result.rows[0][4],
              officer: result.rows[0][5],
              authorized: true
            };
            res.render('detail.ejs', {
              name: result.rows[0][1],
              start_date: result.rows[0][2],
              end_date: result.rows[0][3],
              address: result.rows[0][4],
              officer: result.rows[0][5]
            });
          } else {
            res.render('index.ejs', {
              message: '비밀번호가 틀렸습니다'
            });
          }
        } else {
          res.render('index.ejs', {
            message: '존재하지 않는 아이디입니다'
          });
          res.end("fail!!");
        }
        // console.log(result.metaData);  //테이블 스키마
        //         console.log(result.rows);
      }
    });
  }
})
router.route('/detail').get(
  function(req, res) {
    //세션정보는 req.session 에 들어 있다
    if (req.session.user) //세션에 유저가 있다면
    {
      res.render('detail.ejs', {
        name: req.session.user.name,
        start_date: req.session.user.start_date,
        end_date: req.session.user.end_date,
        address: req.session.user.address,
        address: req.session.user.officer
      });
    } else {
      res.redirect('/');
    }
  }
);


router.route('/logout').get( //설정된 쿠키정보를 본다
  function(req, res) {
    if (req.session.user) {
      console.log('로그아웃 처리');
      req.session.destroy(
        function(err) {
          if (err) {
            console.log('세션 삭제시 에러');
            return;
          }
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

app.use('/', router); //라우트 미들웨어 등록


app.all('*',
  function(req, res) {
    res.status(404).redirect('statepage/404.html');
  }
);

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
