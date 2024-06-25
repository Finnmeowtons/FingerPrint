<?php
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "fingerprint";

    $conn = new mysqli($servername, $username, $password, $dbname);


    echo $_GET['no'];
    $no =  $_GET['no'];
    $sql = "select * from users where id='$no'";

    $result = $conn->query($sql);
    if($result){
        echo "Hiii";
    }

    if ($result->num_rows > 0) {
        // output data of each row
        while($row = $result->fetch_assoc()) {
          echo "<br>id: " . $row["id"]. "<br>user name: " . $row["username"]. "<br>full name " . $row["fullname"]. "<br>";
        }
        $result -> free_result();
    } else {
        echo "0 results";
    }


    $conn->close();
?>