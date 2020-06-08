<?php
include_once ('../config.php');
$mysqli = new mysqli($DB['host'], $DB['id'], $DB['pw'], $DB['db']);
if (mysqli_connect_error()) {
    exit('Connect Error (' . mysqli_connect_errno() . ') '. mysqli_connect_error());
}

extract($_POST);

echo $user_id. '<br />';
echo $user_pass. '<br />';
echo $user_pass2. '<br />';
echo $user_email. '<br />';


$mysqli->close($mysqli);
?> 