<?php
    $servername = "localhost";
    $username = "root";
    $password = "";
    $dbname = "fingerprint";

    $conn = new mysqli($servername, $username, $password, $dbname);


// Retrieve user_id from form
$user_id = $_POST['userIDVerify2'];

// Prepare and execute SQL statement to get user_no
$sql = "SELECT user_no FROM users WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $user_id);
$stmt->execute();
$result = $stmt->get_result();
print_r($result);
// Check if user exists
if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $user_no = $row['user_no'];

    // Redirect to fingerprint page with user_no
    header("Location: http://127.0.0.1/fingerprint/?no=" . $user_no);
    exit;
} else {
    echo "User not found.";
}

$stmt->close();
$conn->close();
