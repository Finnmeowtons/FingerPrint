<?php
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "fingerprint";

    $conn = new mysqli($servername, $username, $password, $dbname);


    // Get user ID from query string parameter
$userNo = isset($_GET['no']) ? intval($_GET['no']) : null;

if ($userNo === null) {
    die("Missing user ID parameter");
}

// Use a prepared statement to prevent SQL injection
$stmt = $conn->prepare("
    SELECT u.user_no, u.user_id, u.user_lname, u.user_fname, u.user_mname,
           ef.fp_indexfinger, ef.fp_middlefinger 
    FROM users u
    LEFT JOIN employee_fingerprint ef ON u.user_no = ef.user_no
    WHERE u.user_no = ?
");

$stmt->bind_param("i", $userNo);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode([
        'user_no' => $row['user_no'],
        'id' => $row['user_id'],
        'fullname' => $row['user_lname'] . ', ' . $row['user_fname'] . ' ' . $row['user_mname'],
        'indexfinger' => $row['fp_indexfinger'], // Access index finger data
        'middlefinger' => $row['fp_middlefinger']  // Access middle finger data
    ]);
} else {
    echo json_encode(["error" => "User not found"]);
}

$stmt->close();
$conn->close();