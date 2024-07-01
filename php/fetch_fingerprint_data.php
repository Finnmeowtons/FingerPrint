<?php
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "fingerprint";

    $conn = new mysqli($servername, $username, $password, $dbname);


    // Get user ID from query string parameter
$userId = isset($_GET['no']) ? intval($_GET['no']) : null;

if ($userId === null) {
    die("Missing user ID parameter");
}

// Execute SQL query directly (no prepared statement)
$sql = "SELECT * FROM users WHERE id = $userId";
$result = $conn->query($sql);

// Fetch result
$row = $result->fetch_assoc();

if ($row) {
    echo json_encode($row);
    $response = [
        'id' => $row['id'],
        'fullname' => $row['fullname'],
        'username' => $row['username'],
        'indexfinger' => $row['indexfinger'],
        'middlefinger' => $row['middlefinger']
    ];
} else {
    echo json_encode("User not found");
}

$conn->close();