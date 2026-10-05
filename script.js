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


        // พยายามเลือกกล้องหลัง
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
        } catch (error) {
            console.log(error);
        }
    }


    html5QrCode = new Html5Qrcode("reader");


    const cameraId =
        cameras[currentCameraIndex].id;


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


    // เอาเฉพาะตัวเลขและ X
    const isbn =
        decodedText.replace(/[^0-9Xx]/g, "");


    console.log("ISBN:", isbn);


    // ใส่ ISBN
    document.getElementById("isbn").value =
        isbn;


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


    // ตรวจสอบ ISBN
    if (
        isbn.length !== 10 &&
        isbn.length !== 13
    ) {

        document.getElementById("scan-result").innerText =
            "⚠️ ISBN ไม่ถูกต้อง: " + isbn;

        return;
    }


    // ค้นหาหนังสือ
    searchOpenLibrary(isbn);
}



// =====================================
// ค้นหาหนังสือจาก Open Library
// =====================================

async function searchOpenLibrary(isbn) {

    try {

        console.log(
            "กำลังค้นหา Open Library:",
            isbn
        );


        const url =
            "https://openlibrary.org/api/books" +
            "?bibkeys=ISBN:" +
            encodeURIComponent(isbn) +
            "&format=json" +
            "&jscmd=data";


        console.log("API URL:", url);


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "HTTP Error " +
                response.status
            );
        }


        const data =
            await response.json();


        console.log(
            "Open Library:",
            data
        );


        const book =
            data["ISBN:" + isbn];


        // =====================================
        // ไม่พบหนังสือ
        // =====================================

        if (!book) {

            document.getElementById("scan-result").innerText =
                "⚠️ ไม่พบข้อมูลหนังสือ ISBN: " +
                isbn;

            return;
        }


        // =====================================
        // ชื่อหนังสือ
        // =====================================

        document.getElementById("title").value =
            book.title || "";


        // =====================================
        // ผู้แต่ง
        // =====================================

        if (
            book.authors &&
            book.authors.length > 0
        ) {

            document.getElementById("author").value =
                book.authors
                    .map(author => author.name)
                    .join(", ");

        } else {

            document.getElementById("author").value =
                "";
        }


        // =====================================
        // สำนักพิมพ์
        // =====================================

        if (
            book.publishers &&
            book.publishers.length > 0
        ) {

            document.getElementById("publisher").value =
                book.publishers
                    .map(publisher => publisher.name)
                    .join(", ");

        } else {

            document.getElementById("publisher").value =
                "";
        }


        // =====================================
        // ปีที่พิมพ์
        // =====================================

        document.getElementById("year").value =
            book.publish_date || "";


        // =====================================
        // จำนวนหน้า
        // =====================================

        document.getElementById("pages").value =
            book.number_of_pages || "";


        // =====================================
        // หมวดหมู่
        // =====================================

        if (
            book.subjects &&
            book.subjects.length > 0
        ) {

            document.getElementById("category").value =
                book.subjects
                    .slice(0, 5)
                    .map(subject => subject.name)
                    .join(", ");

        } else {

            document.getElementById("category").value =
                "";
        }


        // =====================================
        // ราคา
        // =====================================

        document.getElementById("price").value =
            "กรุณากรอกราคา";


        // =====================================
        // สำเร็จ
        // =====================================

        document.getElementById("scan-result").innerText =
            "✅ พบข้อมูลหนังสือแล้ว";


    } catch (error) {

        console.error(
            "Open Library Error:",
            error
        );


        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถเชื่อมต่อ Open Library ได้";
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
// ปุ่มบันทึกข้อมูล
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
