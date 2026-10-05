let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let isScanning = false;


// =====================================
// เริ่มต้นกล้อง
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
            "❌ ไม่สามารถเปิดกล้องได้";
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
// สแกนสำเร็จ
// =====================================

async function onScanSuccess(decodedText) {

    console.log("สแกนได้:", decodedText);


    // เอาเฉพาะตัวเลข
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


    // เริ่มค้นหา
    searchBook(isbn);
}



// =====================================
// ค้นหาหนังสือ
// =====================================

async function searchBook(isbn) {

    console.log("เริ่มค้นหา ISBN:", isbn);


    // =================================
    // วิธีที่ 1
    // ISBN API
    // =================================

    try {

        document.getElementById("scan-result").innerText =
            "🔎 กำลังค้นหาข้อมูลหนังสือ...";


        const isbnURL =
            "https://openlibrary.org/isbn/" +
            encodeURIComponent(isbn) +
            ".json";


        console.log(
            "ISBN API:",
            isbnURL
        );


        const response =
            await fetch(isbnURL);


        if (response.ok) {

            const book =
                await response.json();


            console.log(
                "พบข้อมูลจาก ISBN API:",
                book
            );


            fillBookData(book, isbn);

            document.getElementById("scan-result").innerText =
                "✅ พบข้อมูลหนังสือแล้ว";

            return;
        }


        console.log(
            "ISBN API ไม่พบข้อมูล"
        );


    } catch (error) {

        console.log(
            "ISBN API Error:",
            error
        );
    }



    // =================================
    // วิธีที่ 2
    // Search API
    // =================================

    try {

        document.getElementById("scan-result").innerText =
            "🔎 กำลังค้นหาจากฐานข้อมูลสำรอง...";


        const searchURL =
            "https://openlibrary.org/search.json" +
            "?q=" +
            encodeURIComponent(isbn) +
            "&limit=1";


        console.log(
            "Search API:",
            searchURL
        );


        const response =
            await fetch(searchURL);


        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }


        const data =
            await response.json();


        console.log(
            "Search API:",
            data
        );


        if (
            !data.docs ||
            data.docs.length === 0
        ) {

            document.getElementById("scan-result").innerText =
                "⚠️ ไม่พบข้อมูลหนังสือ ISBN: " +
                isbn;

            return;
        }


        const book =
            data.docs[0];


        fillSearchBookData(
            book,
            isbn
        );


        document.getElementById("scan-result").innerText =
            "✅ พบข้อมูลหนังสือแล้ว";


    } catch (error) {

        console.error(
            "Search API Error:",
            error
        );


        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถค้นหาข้อมูลหนังสือได้";
    }
}



// =====================================
// ใส่ข้อมูลจาก ISBN API
// =====================================

function fillBookData(book, isbn) {

    console.log(
        "กำลังใส่ข้อมูล:",
        book
    );


    // ISBN
    document.getElementById("isbn").value =
        isbn;


    // ชื่อหนังสือ
    document.getElementById("title").value =
        book.title || "";


    // ผู้แต่ง
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


    // สำนักพิมพ์
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


    // ปีที่พิมพ์
    if (book.publish_date) {

        document.getElementById("year").value =
            book.publish_date;

    } else {

        document.getElementById("year").value =
            "";
    }


    // จำนวนหน้า
    document.getElementById("pages").value =
        book.number_of_pages || "";


    // หมวดหมู่
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


    // ราคา
    document.getElementById("price").value =
        "ไม่พบข้อมูลราคา";
}



// =====================================
// ใส่ข้อมูลจาก Search API
// =====================================

function fillSearchBookData(book, isbn) {

    console.log(
        "ข้อมูลจาก Search API:",
        book
    );


    // ISBN
    document.getElementById("isbn").value =
        isbn;


    // ชื่อหนังสือ
    document.getElementById("title").value =
        book.title || "";


    // ผู้แต่ง
    if (
        book.author_name &&
        book.author_name.length > 0
    ) {

        document.getElementById("author").value =
            book.author_name.join(", ");

    } else {

        document.getElementById("author").value =
            "";
    }


    // สำนักพิมพ์
    if (
        book.publisher &&
        book.publisher.length > 0
    ) {

        document.getElementById("publisher").value =
            book.publisher[0];

    } else {

        document.getElementById("publisher").value =
            "";
    }


    // ปีที่พิมพ์
    document.getElementById("year").value =
        book.first_publish_year || "";


    // จำนวนหน้า
    if (
        book.number_of_pages_median
    ) {

        document.getElementById("pages").value =
            book.number_of_pages_median;

    } else {

        document.getElementById("pages").value =
            "";
    }


    // หมวดหมู่
    if (
        book.subject &&
        book.subject.length > 0
    ) {

        document.getElementById("category").value =
            book.subject
                .slice(0, 5)
                .join(", ");

    } else {

        document.getElementById("category").value =
            "";
    }


    // ราคา
    document.getElementById("price").value =
        "ไม่พบข้อมูลราคา";
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