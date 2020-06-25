# DB_Project_2020-1
# 병원-자가격리자-담당공무원 네트워크
작성자 choiseungmi/rollingman1

자가격리자 DB를 이용하여 응급상황요청, 구호물품요청, 통계보기의 기능을 수행하는 인터페이스를 가지고 있습니다.

# DB_Project_2020-1
# Hospital-owner-self-career network
By choiseungmi/rollingman1

It has an interface that performs the functions of emergency request, relief goods request, and statistical view using the self-isolator DB.

accounts table
---------------
```
CREATE TABLE accounts (
	user_id	CHAR(50) primary key,
	name CHAR(50),
	email CHAR(50) NOT NULL,
	password CHAR(100) NOT NULL,
	address CHAR(50),
	start_date DATE,
	end_date DATE,
	state NUMBER,
	tel CHAR(15),
	officer_name CHAR(50),
	constraint pk_manage foreign key (officer_name) REFERENCES officer(name),
	CHECK (end_date >= start_date + (INTERVAL '14' DAY))
);
```
stat table
---------------
```
CREATE TABLE STAT (
  area CHAR(50) NOT NULL,
  corona_num INT default 0,
  isol_num INT default 0,
  nisol_num INT default 0,
  PRIMARY KEY(area)
);
// corona_num : 확진자수, isol_num : 격리자수, nisol_num:격리해제수
```
hospital table
---------------
```
CREATE TABLE HOSPITAL(
  name CHAR(10) NOT NULL,
  area CHAR(50),
  maximum int DEFAULT 0,
  waiting int DEFAULT 0,
  room int DEFAULT 0,
  PRIMARY KEY(name)
);
```
officer table
---------------
```
CREATE TABLE officer(
  name CHAR(50) not null primary key,
  area CHAR(50),
  TEL CHAR(15),
  department CHAR(15),
  manage_num NUMBER DEFAULT 0
);
```
storage table
---------------
```
CREATE TABLE storage(
  id CHAR(50) primary key,
  area CHAR(50),
  product CHAR(50),
  num NUMBER default 0
);
```
management table
---------------
```
CREATE TABLE management(
office_name CHAR(50) unsigned NOT NULL,  
isolation_name CHAR(50) unsigned NOT NULL,  
FOREIGN KEY(office_name) REFERENCES officer(name) ON UPDATE CASCADE ON DELETE CASCADE,
FOREIGN KEY(isolation_name) REFERENCES accounts(name) ON UPDATE CASCADE ON DELETE CASCADE);
);
```
