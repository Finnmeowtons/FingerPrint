/**
 * Custom implementation for the FingerPrint
 * Reader and other JS functions
 * @authors Dahir Muhammad Dahir (dahirmuhammad3@gmail.com)
 * @date    2020-04-14 17:06:41
 * @version 1.0.0
 */


let currentFormat = Fingerprint.SampleFormat.Intermediate;

let FingerprintSdkTest = (function () {
    function FingerprintSdkTest() {
        let _instance = this;
        this.operationToRestart = null;
        this.acquisitionStarted = false;
        // instantiating the fingerprint sdk here
        this.sdk = new Fingerprint.WebApi;
        this.sdk.onDeviceConnected = function (e) {
            // Detects if the device is connected for which acquisition started
            showMessage("Scan Appropriate Finger on the Reader", "success");
        };
        this.sdk.onDeviceDisconnected = function (e) {
            // Detects if device gets disconnected - provides deviceUid of disconnected device
            showMessage("Device is Disconnected. Please Connect Back");
        };
        this.sdk.onCommunicationFailed = function (e) {
            // Detects if there is a failure in communicating with U.R.U web SDK
            showMessage("Communication Failed. Please Reconnect Device")
        };
        this.sdk.onSamplesAcquired = function (s) {
            // Sample acquired event triggers this function
            storeSample(s);
        };
        this.sdk.onQualityReported = function (e) {
            // Quality of sample acquired - Function triggered on every sample acquired
            //document.getElementById("qualityInputBox").value = Fingerprint.QualityCode[(e.quality)];
        }
    }

    // this is were finger print capture takes place
    FingerprintSdkTest.prototype.startCapture = function () {
        if (this.acquisitionStarted) // Monitoring if already started capturing
            return;
        let _instance = this;
        showMessage("");
        this.operationToRestart = this.startCapture;
        this.sdk.startAcquisition(currentFormat, "").then(function () {
            _instance.acquisitionStarted = true;

            //Disabling start once started
            //disableEnableStartStop();

        }, function (error) {
            showMessage(error.message);
        });
    };

    FingerprintSdkTest.prototype.stopCapture = function () {
        if (!this.acquisitionStarted) //Monitor if already stopped capturing
            return;
        let _instance = this;
        showMessage("");
        this.sdk.stopAcquisition().then(function () {
            _instance.acquisitionStarted = false;

            //Disabling stop once stopped
            //disableEnableStartStop();

        }, function (error) {
            showMessage(error.message);
        });
    };

    FingerprintSdkTest.prototype.getInfo = function () {
        let _instance = this;
        return this.sdk.enumerateDevices();
    };

    FingerprintSdkTest.prototype.getDeviceInfoWithID = function (uid) {
        let _instance = this;
        return this.sdk.getDeviceInfo(uid);
    };

    return FingerprintSdkTest;
})();


class Reader {
    constructor() {
        this.reader = new FingerprintSdkTest();
        this.selectFieldID = null;
        this.currentStatusField = null;
        /**
         * @type {Hand}
         */
        this.currentHand = null;
    }

    readerSelectField(selectFieldID) {
        this.selectFieldID = selectFieldID;
    }

    setStatusField(statusFieldID) {
        this.currentStatusField = statusFieldID;
    }

    displayReader() {
        let readers = this.reader.getInfo();  // grab available readers here
        let id = this.selectFieldID;
        let selectField = document.getElementById(id);
        selectField.innerHTML = `<option>Select Fingerprint Reader</option>`;
        readers.then(function (availableReaders) {  // when promise is fulfilled
            if (availableReaders.length > 0) {
                showMessage("");
                for (let reader of availableReaders) {
                    selectField.innerHTML += `<option value="${reader}" selected>${reader}</option>`;
                }
            }
            else {
                showMessage("Please Connect the Fingerprint Reader");
            }
        })
            .catch(error => {
                console.error("Error communicating with fingerprint reader:", error);
                showMessage("Error: Could not communicate with fingerprint reader. Please check the connection and try again."); // Display a user-friendly message
            });
    }
}

class Hand {
    constructor() {
        this.id = 0;
        this.index_finger = [];
        this.middle_finger = [];
    }

    addIndexFingerSample(sample) {
        this.index_finger.push(sample);
    }

    addMiddleFingerSample(sample) {
        this.middle_finger.push(sample);
    }

    generateFullHand() {
        let id = this.id;
        let index_finger = this.index_finger;
        let middle_finger = this.middle_finger;
        return JSON.stringify({ id, index_finger, middle_finger });
    }
}

let myReader = new Reader();

function beginEnrollment() {
    setReaderSelectField("enrollReaderSelect");
    myReader.setStatusField("enrollmentStatusField");
}

function originalBeginIdentification() {
    clearCapture();
    setReaderSelectField("verifyReaderSelect");
    myReader.setStatusField("verifyIdentityStatusField");
}

function checkUserId() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    userIDVerify = urlParams.get('no');
    console.log("yey");

    // Check if userIDVerify is found and not empty
    if (userIDVerify !== null && userIDVerify !== "") {
        setReaderSelectField("verifyReaderSelect");
        myReader.setStatusField("verifyIdentityStatusField");
        console.log("userIDVerify from query string:", userIDVerify);
        fetch(`php/fetch_fingerprint_data.php?no=${userIDVerify}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
                return response.json();
            })
            .then(data => {
                if (data === "User not found") {
                    console.log("User Not Found", userIDVerify)
                    return;
                } else {
                    console.log(data);
                    document.getElementById("fullnameDisplay").textContent = data.fullname;
                    document.getElementById("userIDVerify").value = data.user_no;
                    document.getElementById("userIDVerify2").value = data.id;
                    document.getElementById("userIDEnroll").value = data.id;
                    if (data.indexfinger == null){
                        console.log('gogogo');
                        document.getElementById("createEnrollmentButton").style.display = "inline";
                        console.log("Not Registered")
                        
                    } else {
                        document.getElementById("registeredButton").style.display = "inline";
                        myReader.currentHand = new Hand();
                        console.log("Registered")
                        myReader.currentHand.id = data.user_no;
                    sleep(200).then(() => {
                        myReader.reader.startCapture();
                    });


                    waitForFingerData();
                    }
                }
            })
            .catch(error => {
                console.error("Error fetching fingerprint data:", error);
            });
    } else {
        console.log("userIDVerify parameter missing in query string.");
    }
}

function beginIdentification() {

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    userIDVerify = urlParams.get('no');
    console.log("yey");

    // Check if userIDVerify is found and not empty
    if (userIDVerify !== null && userIDVerify !== "") {
        setReaderSelectField("verifyReaderSelect");
        myReader.setStatusField("verifyIdentityStatusField");
        console.log("userIDVerify from query string:", userIDVerify);
        fetch(`php/fetch_fingerprint_data.php?no=${userIDVerify}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }
                return response.json();
            })
            .then(data => {
                if (data === "User not found") {
                    console.log("User Not Found", userIDVerify)
                    return;
                } else {
                    console.log($data);
                    console.log($data);
                    document.getElementById("fullnameDisplay").textContent = data.fullname;
                    document.getElementById("userIDVerify").value = data.user_no;
                    document.getElementById("userIDVerify2").value = data.id;
                    document.getElementById("userIDEnroll").value = data.id;

                    myReader.currentHand = new Hand();


                    myReader.currentHand.id = userIDVerify;
                    sleep(200).then(() => {
                        myReader.reader.startCapture();
                    });


                    waitForFingerData();

                    document.getElementById("createEnrollmentButton").addEventListener('click', () => {
                        if (controller) {
                            console.log("Abort")
                            controller.abort();
                        }
                    });

                }
            })
            .catch(error => {
                console.error("Error fetching fingerprint data:", error);
            });
    } else {
        console.log("userIDVerify parameter missing in query string.");
    }

}

function setReaderSelectField(fieldName) {
    myReader.readerSelectField(fieldName);
    myReader.displayReader();
}

function showMessage(message, message_type = "error") {
    let types = new Map();
    types.set("success", "my-text7 my-pri-color text-bold");
    types.set("error", "text-danger");
    let statusFieldID = myReader.currentStatusField;
    if (statusFieldID) {
        let statusField = document.getElementById(statusFieldID);
        statusField.innerHTML = `<p class="my-text7 my-pri-color my-3 ${types.get(message_type)} font-weight-bold">${message}</p>`;
    }
}

function beginCapture() {
    if (!readyForEnroll()) {
        return;
    }
    myReader.currentHand = new Hand();
    storeUserID();  // for current user in Hand instance
    myReader.reader.startCapture();
    showNextNotEnrolledItem();
}

function captureForIdentify() {
    if (!readyForIdentify()) {
        return;
    }

    sleep(200).then(() => {


        myReader.currentHand = new Hand();
        storeUserID();
        sleep(200).then(() => {
            myReader.reader.startCapture();
            showNextNotEnrolledItem();
        });
    });
}

/**
 * @returns {boolean}
 */
function readyForEnroll() {
    return ((document.getElementById("userIDEnroll").value !== "") && (document.getElementById("enrollReaderSelect").value !== "Select Fingerprint Reader"));
}

/**
* @returns {boolean}
*/
async function readyForIdentify() {
    await sleep(200);
    const value = (document.getElementById("userIDVerify").value !== "") && (document.getElementById("verifyReaderSelect").value !== "Select Fingerprint Reader");
    return value;

}

function clearCapture() {
    clearInputs();
    clearPrints();
    clearHand();
    myReader.reader.stopCapture();
    document.getElementById("userDetails").innerHTML = "";
}

function clearCapture2() {
    clearPrints();
    clearHand();
    document.getElementById("userDetails").innerHTML = "yo";
}

function clearInputs() {
    document.getElementById("userIDEnroll").value = "";
    document.getElementById("userIDVerify").value = "";
    //let id = myReader.selectFieldID;
    //let selectField = document.getElementById(id);
    //selectField.innerHTML = `<option>Select Fingerprint Reader</option>`;
}

function clearPrints() {
    let indexFingers = document.getElementById("indexFingers");
    let middleFingers = document.getElementById("middleFingers");
    let verifyFingers = document.getElementById("verificationFingers");

    if (indexFingers) {
        for (let indexfingerElement of indexFingers.children) {
            indexfingerElement.innerHTML = `<span class="icon icon-indexfinger-not-enrolled" title="not_enrolled"></span>`;
        }
    }

    if (middleFingers) {
        for (let middlefingerElement of middleFingers.children) {
            middlefingerElement.innerHTML = `<span class="icon icon-middlefinger-not-enrolled" title="not_enrolled"></span>`;
        }
    }

    if (verifyFingers) {
        for (let finger of verifyFingers.children) {
            finger.innerHTML = `<span class="icon icon-indexfinger-not-enrolled" title="not_enrolled"></span>`;
        }
    }
}

function clearHand() {
    myReader.currentHand = null;
}

function showSampleCaptured() {

    let nextElementID = getNextNotEnrolledID();
    let markup = null;
    if (nextElementID.startsWith("index") || nextElementID.startsWith("verification")) {
        markup = `<span class="icon icon-indexfinger-enrolled" title="enrolled"></span>`;
    }

    if (nextElementID.startsWith("middle")) {
        markup = `<span class="icon icon-middlefinger-enrolled" title="enrolled"></span>`;
    }

    if (nextElementID !== "" && markup) {
        let nextElement = document.getElementById(nextElementID);
        nextElement.innerHTML = markup;
    }
}

function showNextNotEnrolledItem() {
    let nextElementID = getNextNotEnrolledID();
    let markup = null;
    if (nextElementID.startsWith("index") || nextElementID.startsWith("verification")) {
        markup = `<span class="icon capture-indexfinger" title="not_enrolled"></span>`;
    }

    if (nextElementID.startsWith("middle")) {
        markup = `<span class="icon capture-middlefinger" title="not_enrolled"></span>`;
    }

    if (nextElementID !== "" && markup) {
        let nextElement = document.getElementById(nextElementID);
        nextElement.innerHTML = markup;
    }
}

/**
 * @returns {string}
 */
function getNextNotEnrolledID() {
    let indexFingers = document.getElementById("indexFingers");
    let middleFingers = document.getElementById("middleFingers");
    let verifyFingers = document.getElementById("verificationFingers");

    let enrollUserId = document.getElementById("userIDEnroll").value;
    let verifyUserId = document.getElementById("userIDVerify").value;

    let indexFingerElement = findElementNotEnrolled(indexFingers);
    let middleFingerElement = findElementNotEnrolled(middleFingers);
    let verifyFingerElement = findElementNotEnrolled(verifyFingers);

    //assumption is that we will always start with
    //indexfinger and run down to middlefinger
    if (indexFingerElement !== null && enrollUserId !== "") {
        return indexFingerElement.id;
    }

    if (middleFingerElement !== null && enrollUserId !== "") {
        return middleFingerElement.id;
    }

    if (verifyFingerElement !== null && verifyUserId !== "") {
        return verifyFingerElement.id;
    }

    return "";
}

/**
 * 
 * @param {Element} element
 * @returns {Element}
 */
function findElementNotEnrolled(element) {
    if (element) {
        for (let fingerElement of element.children) {
            if (fingerElement.firstElementChild.title === "not_enrolled") {
                return fingerElement;
            }
        }
    }

    return null;
}

function storeUserID() {
    let enrollUserId = document.getElementById("userIDVerify").value;
    let identifyUserId = document.getElementById("userIDVerify").value;
    myReader.currentHand.id = enrollUserId !== "" ? enrollUserId : identifyUserId;
}

function storeSample(sample) {
    let samples = JSON.parse(sample.samples);
    let sampleData = samples[0].Data;
    let nextElementID = getNextNotEnrolledID();

    if (nextElementID.startsWith("index") || nextElementID.startsWith("verification")) {
        myReader.currentHand.addIndexFingerSample(sampleData);
        showSampleCaptured();
        showNextNotEnrolledItem();
        return;
    }

    if (nextElementID.startsWith("middle")) {

        myReader.currentHand.addMiddleFingerSample(sampleData);
        showSampleCaptured();
        showNextNotEnrolledItem();
    }
}

function serverEnroll() {
    if (!readyForEnroll()) {
        return;
    }

    let data = myReader.currentHand.generateFullHand();
    let successMessage = "Enrollment Successful!";
    let failedMessage = "Enrollment Failed!";
    let payload = `data=${data}`;
    console.log(payload);
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            console.log(this.responseText)
            if (this.responseText === "success") {
                showMessage(successMessage, "success");
                console.log("YEY")
                sleep(2000).then(() => {
                window.location.reload()
                });
            }
            else {
                showMessage(`${failedMessage} ${this.responseText}`);
            }
        }
    };

    xhttp.open("POST", "src/core/enroll.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(payload);
}

function serverIdentify() {

    let data = myReader.currentHand.generateFullHand();
    let detailElement = document.getElementById("userDetails");
    let successMessage = "Identification Successful!";
    let failedMessage = "Identification Failed!. Try again";
    let payload = `data=${data}`;
    console.log(payload);
    let xhttp = new XMLHttpRequest();

    xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            if (this.responseText !== null && this.responseText !== "") {
                let response = JSON.parse(this.responseText);
                if (response !== "failed" && response !== null) {
                    document.getElementById("failedVerification").style.display = "none";
                    document.getElementById("verified").style.display = "block";
                    console.log("SUCCESS")
                }
                else {
                    
                    document.getElementById("failedVerification").style.display = "block";
                    console.log('fail'); // Log or display the error message
                    
                    clearCapture();
                    checkUserId(); // Or handle the error as needed
                }
            }
        }
    };
    xhttp.open("POST", "src/core/verify.php", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(payload);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForFingerData() {
    while (myReader.currentHand.index_finger.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    serverIdentify();
}
