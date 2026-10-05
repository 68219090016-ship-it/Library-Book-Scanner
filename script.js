```javascript
// ============================================
// ตัวแปรระบบ
// ============================================

let scanner = null;

let cameras = [];

let currentCamera = 0;

let scanning = false;


// ============================================
// เริ่มต้นระบบ
// ============================================

async function startSystem() {

    try {

        cameras = await Html5Qrcode.getCameras();


        // ไม่พบกล้อง

        if (cameras.length === 0) {

            document.getElementById("scan-result").innerText =
                "❌ ไม่พบกล้องในอุปกรณ์";

            return;
        }


        // ========================================
        // หาตำแหน่งกล้องหลัง
        // ========================================

        const backCamera =
            cameras.findIndex(camera => {

                const name =
                    camera.label.toLowerCase();

                return (
                    name.includes("back") ||
                    name.includes("rear") ||
                    name.includes("environment")
                );

            });


        // ถ้ามีกล้องหลังให้ใช้กล้องหลัง

        if (backCamera !== -1) {

            currentCamera = backCamera;

        }


        // เริ่มกล้อง

        startScanner();


    } catch (error) {

        console.error(error);

        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถเข้าถึงกล้องได้";

    }

}


// ============================================
// เปิดกล้อง
// ============================================

async function startScanner() {

    try {


        // ถ้ามี scanner เดิม

        if (scanner) {

            try {

                await scanner.clear();

            } catch (error) {

                console.log(error);

            }

        }


        // สร้าง scanner

        scanner =
            new Html5Qrcode("reader");


        // เลือกกล้อง

        const cameraId =
            cameras[currentCamera].id;


        // เริ่มกล้อง

        await scanner.start(

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

        );


        scanning = true;


        document.getElementById("scan-result").innerText =
            "📷 กำลังสแกนบาร์โค้ด...";


    } catch (error) {

        console.error(error);

        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถเปิดกล้องได้";

    }

}


// ============================================
// เมื่อสแกนสำเร็จ
// ============================================

async function onScanSuccess(decodedText) {


    console.log(
        "สแกนได้:",
        decodedText
    );


    // ========================================
    // ทำความสะอาด ISBN
    // ========================================

    const isbn =
        decodedText
            .replace(/[-\s]/g, "")
            .trim();


    // แสดง ISBN

    document.getElementById("isbn").value =
        isbn;


    document.getElementById("scan-result").innerText =
        "🔎 กำลังค้นหาข้อมูลหนังสือ...";


    // ========================================
    // หยุดกล้อง
    // ========================================

    if (scanner && scanning) {

        try {

            await scanner.stop();

            scanning = false;

        } catch (error) {

            console.log(error);

        }

    }


    // ========================================
    // ค้นหาข้อมูล Google Books
    // ========================================

    try {


        const url =
            "https://www.googleapis.com/books/v1/volumes?q=isbn:" +
            encodeURIComponent(isbn);


        const response =
            await fetch(url);


        const data =
            await response.json();


        console.log(
            "Google Books:",
            data
        );


        // ========================================
        // ไม่พบข้อมูล
        // ========================================

        if (
            !data.items ||
            data.items.length === 0
        ) {


            document.getElementById("scan-result").innerText =
                "❌ ไม่พบข้อมูลหนังสือ";


            alert(
                "ไม่พบข้อมูลหนังสือ\n\n" +
                "ISBN: " + isbn
            );


            return;

        }


        // ========================================
        // รับข้อมูล
        // ========================================

        const book =
            data.items[0];


        const info =
            book.volumeInfo || {};


        const sale =
            book.saleInfo || {};


        // ========================================
        // ชื่อหนังสือ
        // ========================================

        document.getElementById("title").value =
            info.title || "";


        // ========================================
        // ผู้แต่ง
        // ========================================

        document.getElementById("author").value =

            info.authors
                ? info.authors.join(", ")
                : "";


        // ========================================
        // สำนักพิมพ์
        // ========================================

        document.getElementById("publisher").value =
            info.publisher || "";


        // ========================================
        // ปีที่พิมพ์
        // ========================================

        document.getElementById("year").value =
            info.publishedDate || "";


        // ========================================
        // จำนวนหน้า
        // ========================================

        document.getElementById("pages").value =
            info.pageCount || "";


        // ========================================
        // หมวดหมู่
        // ========================================

        document.getElementById("category").value =

            info.categories
                ? info.categories.join(", ")
                : "";


        // ========================================
        // ราคา
        // ========================================

        if (
            sale.listPrice &&
            sale.listPrice.amount
        ) {


            const amount =
                sale.listPrice.amount;


            const currency =
                sale.listPrice.currencyCode || "";


            document.getElementById("price").value =
                amount + " " + currency;


        } else {


            document.getElementById("price").value =
                "ไม่มีข้อมูล";


        }


        // ========================================
        // แสดงผลสำเร็จ
        // ========================================

        document.getElementById("scan-result").innerText =
            "✅ พบข้อมูลหนังสือแล้ว";


        console.log(
            "ข้อมูลหนังสือ:",
            info
        );


    } catch (error) {


        console.error(
            "เกิดข้อผิดพลาด:",
            error
        );


        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถค้นหาข้อมูลได้";


        alert(
            "เกิดข้อผิดพลาดในการค้นหาข้อมูลหนังสือ"
        );

    }

}


// ============================================
// ตอนยังสแกนไม่เจอ
// ============================================

function onScanFailure(error) {

    // ไม่ต้องทำอะไร

}


// ============================================
// ปุ่มสลับกล้อง
// ============================================

document
    .getElementById("switchCamera")
    .addEventListener(
        "click",
        async function () {


            // ====================================
            // มีกล้องเดียว
            // ====================================

            if (cameras.length < 2) {

                alert(
                    "อุปกรณ์นี้มีกล้องเพียงตัวเดียว"
                );

                return;

            }


            // ====================================
            // หยุดกล้องปัจจุบัน
            // ====================================

            if (scanner && scanning) {

                try {

                    await scanner.stop();

                    scanning = false;

                } catch (error) {

                    console.log(error);

                }

            }


            // ====================================
            // เปลี่ยนกล้อง
            // ====================================

            currentCamera++;


            if (
                currentCamera >=
                cameras.length
            ) {

                currentCamera = 0;

            }


            document.getElementById("scan-result").innerText =
                "🔄 กำลังเปลี่ยนกล้อง...";


            // ====================================
            // เปิดกล้องใหม่
            // ====================================

            startScanner();

        }
    );


// ============================================
// ปุ่มบันทึก
// ============================================

document
    .getElementById("saveButton")
    .addEventListener(
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


            // ตรวจสอบ ISBN

            if (!book.isbn) {

                alert(
                    "กรุณาสแกน ISBN ก่อน"
                );

                return;

            }


            alert(
                "💾 บันทึกข้อมูลเรียบร้อยแล้ว\n\n" +

                "ISBN: " +
                book.isbn +

                "\nชื่อหนังสือ: " +
                book.title
            );

        }
    );


// ============================================
// เริ่มระบบทันที
// ============================================

startSystem();
```
