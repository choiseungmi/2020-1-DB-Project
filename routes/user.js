const express = require('express');
const router = express.Router();
const oracle = require('../oracle.js');
//
// const sql = "select *  from accounts";
//
//
// router.get('/sign_up', function(req, res, next) {
//   res.render("register.html");
// });
//
//
// router.post("/sign_up", function(req, res, next) {
//   let body = req.body;
//
//   const sql = "insert accounts (user_id, name, email, password, address) value (" || body.id || ", " || body.userName || ", " || body.userEmail || ", " || body.password || ", null)"
//   oracle.queryObject(sql, {}, {})
//     .then(function(result) {
//       console.log(result.rows[0]);
//     })
//     .catch(function(err) {
//       next(err);
//     })
//     .then(result => {
//       res.redirect("/");
//     })
//     .catch(err => {
//       console.log(err)
//     })
// })
//
// module.exports = router;


exports.register = function (req, res) {
    // console.log("req", req.body);
    var today = new Date();
    var users = {
        "user_id": req.body.id,
        "name": req.body.last_name,
        "email": req.body.email,
        "password": req.body.password,
        "address": today
    }
    const sql = "insert accounts (user_id, name, email, password, address) value ("||users|| ", null)";
     oracle.queryObject(sql, {}, {})
       .then(function(result) {
         console.log(result.rows[0]);
       })
       .catch(function(err) {
         next(err);
       })
       .then(result => {
         res.redirect("/");
       })
       .catch(err => {
         console.log(err)
       });
}

exports.login = function (req, res) {
  res.redirect("/login");
    var id = req.body.ID;
    var password = req.body.password;
    const sql = "SELECT password FROM accounts where id="||id;
    oracle.queryObject(sql, {}, {})
      .then(function(result) {
        if(result==password){
          res.send({
              "code": 200,
              "success": "login sucessfull"
          });
          console.log("success");
        }
        else{
          res.send({
              "code": 400,
              "failed": "error ocurred"
          })
          console.log("fail");
        }
      })
      .catch(function(err) {
        next(err);
      })
      .then(result => {
        res.redirect("/");
      })
      .catch(err => {
        console.log(err)
      });
}
