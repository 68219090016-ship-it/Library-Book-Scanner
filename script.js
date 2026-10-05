```javascript
let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let isScanning = false;


// ===============================
// เริ่มต้นระบบกล้อง
// ===============================

async function startCamera() {

    try {

        cameras = await Html5Qrcode.getCameras();

        if (cameras.length === 0) {

            document.getElementById("scan-result").innerText =
                "❌ ไม่พบกล้อง";

            return;
        }

        // พยายามเลือกกล้องหลังเป็นกล้องเริ่มต้น
        currentCameraIndex = cameras.findIndex(camera =>
            camera.label.toLowerCase().includes("back") ||
            camera.label.toLowerCase().includes("rear") ||
            camera.label.toLowerCase().includes("environment")
        );

        if (currentCameraIndex === -1) {
            currentCameraIndex = 0;
        }

        startScanning();

    } catch (error) {

        console.error(error);

        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้กล้อง";
    }
}


// ===============================
// เริ่มสแกน
// ===============================

function startScanning() {

    if (html5QrCode) {
        html5QrCode.clear();
    }

    html5QrCode = new Html5Qrcode("reader");

    const cameraId = cameras[currentCameraIndex].id;

    html5QrCode.start(

        cameraId,

        {
            fps: 10,

            qrbox: {
                width: 300,
                height: 150
            }
        },

        onScanSuccess,

        onScanFailure

    ).then(() => {

        isScanning = true;

        document.getElementById("scan-result").innerText =
            "📷 กำลังสแกน...";

    }).catch(error => {

        console.error(error);

        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถเปิดกล้องได้";
    });
}


// ===============================
// เมื่อสแกนสำเร็จ
// ===============================

function onScanSuccess(decodedText) {

    console.log("สแกนได้:", decodedText);

    document.getElementById("isbn").value = decodedText;

    document.getElementById("scan-result").innerText =
        "✅ สแกนสำเร็จ ISBN: " + decodedText;


    // หยุดกล้อง
    if (html5QrCode && isScanning) {

        html5QrCode.stop().then(() => {

            isScanning = false;

        }).catch(error => {

            console.error(error);

        });
    }
}


// ===============================
// ระหว่างสแกน
// ===============================

function onScanFailure(error) {
    // ไม่ต้องแสดงข้อความ
}


// ===============================
// ปุ่มสลับกล้อง
// ===============================

document.getElementById("switchCamera").addEventListener(
    "click",
    async function () {

        if (cameras.length < 2) {

            alert("อุปกรณ์นี้มีกล้องเพียงตัวเดียว");

            return;
        }

        try {

            if (html5QrCode && isScanning) {

                await html5QrCode.stop();

                isScanning = false;
            }

            // เปลี่ยนกล้อง
            currentCameraIndex++;

            if (currentCameraIndex >= cameras.length) {
                currentCameraIndex = 0;
            }

            document.getElementById("scan-result").innerText =
                "🔄 กำลังเปลี่ยนกล้อง...";

            startScanning();

        } catch (error) {

            console.error(error);

            alert("ไม่สามารถสลับกล้องได้");
        }
    }
);


// ===============================
// เริ่มระบบ
// ===============================

startCamera();


// ===============================
// บันทึกข้อมูลหนังสือ
// ===============================

document.getElementById("saveButton").addEventListener(
    "click",
    function () {

        const book = {

            isbn: document.getElementById("isbn").value,

            title: document.getElementById("title").value,

            author: document.getElementById("author").value,

            publisher: document.getElementById("publisher").value,

            year: document.getElementById("year").value,

            price: document.getElementById("price").value,

            pages: document.getElementById("pages").value,

            category: document.getElementById("category").value
        };


        console.log("ข้อมูลหนังสือ:", book);

        alert("💾 บันทึกข้อมูลเรียบร้อยแล้ว");
    }
);
```
