let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let isScanning = false;


// =====================================
// เริ่มต้นระบบกล้อง
// =====================================

async function startCamera() {

    try {

        cameras = await Html5Qrcode.getCameras();

        if (cameras.length === 0) {

            document.getElementById("scan-result").innerText =
                "❌ ไม่พบกล้อง";

            return;
        }

        // เลือกกล้องหลัง
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


// =====================================
// เริ่มสแกน
// =====================================

function startScanning() {

    if (html5QrCode) {

        try {
            html5QrCode.clear();
        } catch (e) {
            console.log(e);
        }
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


// =====================================
// เมื่อสแกนสำเร็จ
// =====================================

async function onScanSuccess(decodedText) {

    console.log("สแกนได้:", decodedText);

    // เอาเฉพาะตัวเลข
    let isbn = decodedText.replace(/[^0-9Xx]/g, "");

    console.log("ISBN:", isbn);

    document.getElementById("isbn").value = isbn;

    document.getElementById("scan-result").innerText =
        "🔎 กำลังค้นหาข้อมูลหนังสือ...";


    // หยุดกล้อง
    if (html5QrCode && isScanning) {

        try {

            await html5QrCode.stop();

            isScanning = false;

        } catch (error) {

            console.log(error);

        }
    }


    // ค้นหาข้อมูลหนังสือ
    searchBook(isbn);
}


// =====================================
// ค้นหาหนังสือจาก Google Books
// =====================================

async function searchBook(isbn) {

    try {

        console.log("กำลังค้นหา ISBN:", isbn);


        const url =
            "https://www.googleapis.com/books/v1/volumes" +
            "?q=isbn:" +
            encodeURIComponent(isbn) +
            "&maxResults=1";


        console.log("API URL:", url);


        const response = await fetch(url);


        console.log("HTTP Status:", response.status);


        if (!response.ok) {

            throw new Error(
                "HTTP Error " + response.status
            );
        }


        const data = await response.json();


        console.log("Google Books:", data);


        if (
            !data.items ||
            data.items.length === 0
        ) {

            document.getElementById("scan-result").innerText =
                "⚠️ ไม่พบข้อมูลหนังสือ ISBN: " + isbn;

            return;
        }


        const book = data.items[0].volumeInfo;


        // =====================================
        // ใส่ข้อมูลลงช่อง
        // =====================================

        document.getElementById("title").value =
            book.title || "";


        document.getElementById("author").value =
            book.authors
                ? book.authors.join(", ")
                : "";


        document.getElementById("publisher").value =
            book.publisher || "";


        document.getElementById("year").value =
            book.publishedDate || "";


        document.getElementById("pages").value =
            book.pageCount || "";


        document.getElementById("category").value =
            book.categories
                ? book.categories.join(", ")
                : "";


        // =====================================
        // ราคา
        // =====================================

        if (
            data.items[0].saleInfo &&
            data.items[0].saleInfo.listPrice
        ) {

            const price =
                data.items[0].saleInfo.listPrice;

            document.getElementById("price").value =
                price.amount + " " + price.currencyCode;

        } else {

            document.getElementById("price").value =
                "ไม่พบข้อมูลราคา";
        }


        document.getElementById("scan-result").innerText =
            "✅ พบข้อมูลหนังสือแล้ว";


    } catch (error) {

        console.error(
            "Google Books Error:",
            error
        );


        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถเชื่อมต่อ Google Books ได้";

    }
}


// =====================================
// ระหว่างสแกน
// =====================================

function onScanFailure(error) {

    // ไม่ต้องแสดงข้อความ
}


// =====================================
// ปุ่มสลับกล้อง
// =====================================

const switchCameraButton =
    document.getElementById("switchCamera");


if (switchCameraButton) {

    switchCameraButton.addEventListener(
        "click",
        async function () {

            if (cameras.length < 2) {

                alert(
                    "อุปกรณ์นี้มีกล้องเพียงตัวเดียว"
                );

                return;
            }


            try {

                if (
                    html5QrCode &&
                    isScanning
                ) {

                    await html5QrCode.stop();

                    isScanning = false;
                }


                currentCameraIndex++;


                if (
                    currentCameraIndex >=
                    cameras.length
                ) {

                    currentCameraIndex = 0;
                }


                document.getElementById("scan-result").innerText =
                    "🔄 กำลังเปลี่ยนกล้อง...";


                startScanning();


            } catch (error) {

                console.error(error);

                alert(
                    "ไม่สามารถสลับกล้องได้"
                );
            }

        }
    );
}


// =====================================
// เริ่มระบบ
// =====================================

startCamera();


// =====================================
// ปุ่มบันทึก
// =====================================

document.getElementById("saveButton").addEventListener(
    "click",
    function () {

        const book = {

            isbn:
                document.getElementById("isbn").value,

            title:
                document.getElementById("title").value,

            author:
                document.getElementById("author").value,

            publisher:
                document.getElementById("publisher").value,

            year:
                document.getElementById("year").value,

            price:
                document.getElementById("price").value,

            pages:
                document.getElementById("pages").value,

            category:
                document.getElementById("category").value
        };


        console.log(
            "ข้อมูลหนังสือ:",
            book
        );


        alert(
            "💾 บันทึกข้อมูลเรียบร้อยแล้ว"
        );
    }
);
