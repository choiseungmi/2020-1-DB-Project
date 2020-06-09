const http = require("http");
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const server = http.createServer(app);
const fs = require("fs");
const oracledb = require("oracledb");
// app.use(express.static('views/statepage'));
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
// var router = express.Router();
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


app.get('/', (req, res) => {
  res.render('index.ejs',{message:''});
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
  // var sql = "SELECT password FROM accounts where id=tester";
  conn.execute(`select password from accounts where user_id='${id}'`, function(err, result) {
    if (err) {
      console.log("로그인 중 에러가 발생했어요!!", err);
      console.log("fail: " + id + password);
      res.writeHead(400, {
        "ContentType": "text/html"
      });
      res.render('statepage/404.html');
    } else {
      console.log(result, result.rows.length);
      console.log("output:", result.rows[0], trim(password));
      if (result.rows.length > 0) {
        if (password == trim(result.rows[0][0])) {
          res.render('detail.ejs');
          console.log("sucess: " + id + password);
        } else {
          console.log("wrong: " + id + password);
          res.render('index.ejs',{message:'비밀번호가 틀렸습니다'});
        }
      } else {
        res.render('index.ejs',{message:'존재하지 않는 아이디입니다'});
        res.end("fail!!");
        console.log("0<user: " + id + password);
      }
      // console.log(result.metaData);  //테이블 스키마
      //         console.log(result.rows);
    }
  });

})

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
