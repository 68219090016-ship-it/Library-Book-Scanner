```javascript
// ========================================
// ระบบสแกนหนังสือ
// ========================================

let scanner = null;

// กล้องปัจจุบัน
let currentCamera = "environment";

// กำลังสแกนหรือไม่
let scanning = false;


// ========================================
// เริ่มกล้อง
// ========================================

async function startCamera() {

    try {

        // ถ้ามี scanner เดิม
        if (scanner) {

            try {

                await scanner.stop();

            } catch (error) {

                console.log(error);

            }

            try {

                await scanner.clear();

            } catch (error) {

                console.log(error);

            }

        }


        // สร้างตัวสแกนใหม่

        scanner =
            new Html5Qrcode("reader");


        // เปิดกล้อง
        await scanner.start(

            {
                facingMode: currentCamera
            },

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

        console.error(
            "Camera Error:",
            error
        );


        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถเปิดกล้องได้";


        alert(
            "ไม่สามารถเปิดกล้องได้\n\n" +
            "กรุณาอนุญาตให้เว็บไซต์ใช้กล้อง"
        );

    }

}


// ========================================
// สแกนสำเร็จ
// ========================================

async function onScanSuccess(decodedText) {

    console.log(
        "ISBN:",
        decodedText
    );


    // ลบขีดและช่องว่าง
    const isbn =
        decodedText
            .replace(/[-\s]/g, "")
            .trim();


    // ใส่ ISBN

    document.getElementById("isbn").value =
        isbn;


    document.getElementById("scan-result").innerText =
        "🔎 กำลังค้นหาข้อมูลหนังสือ...";


    // ====================================
    // หยุดกล้อง
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
    // ค้นหา Google Books
    // ====================================

    try {


        const url =
            "https://www.googleapis.com/books/v1/volumes?q=isbn:" +
            encodeURIComponent(isbn);


        const response =
            await fetch(url);


        const data =
            await response.json();


        console.log(
            "ข้อมูลจาก Google Books:",
            data
        );


        // ไม่พบข้อมูล

        if (
            !data.items ||
            data.items.length === 0
        ) {

            document.getElementById("scan-result").innerText =
                "❌ ไม่พบข้อมูลหนังสือ";

            alert(
                "ไม่พบข้อมูลหนังสือ\nISBN: " +
                isbn
            );

            return;
        }


        // ====================================
        // ข้อมูลหนังสือ
        // ====================================

        const item =
            data.items[0];

        const info =
            item.volumeInfo || {};

        const sale =
            item.saleInfo || {};


        // ชื่อ

        document.getElementById("title").value =
            info.title || "";


        // ผู้แต่ง

        document.getElementById("author").value =
            info.authors
                ? info.authors.join(", ")
                : "";


        // สำนักพิมพ์

        document.getElementById("publisher").value =
            info.publisher || "";


        // ปี

        document.getElementById("year").value =
            info.publishedDate || "";


        // จำนวนหน้า

        document.getElementById("pages").value =
            info.pageCount || "";


        // หมวดหมู่

        document.getElementById("category").value =
            info.categories
                ? info.categories.join(", ")
                : "";


        // ราคา

        if (
            sale.listPrice &&
            sale.listPrice.amount
        ) {

            document.getElementById("price").value =
                sale.listPrice.amount +
                " " +
                (sale.listPrice.currencyCode || "");

        } else {

            document.getElementById("price").value =
                "ไม่มีข้อมูล";

        }


        // สำเร็จ

        document.getElementById("scan-result").innerText =
            "✅ พบข้อมูลหนังสือแล้ว";


    } catch (error) {

        console.error(error);

        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถค้นหาข้อมูลได้";

    }

}


// ========================================
// ยังสแกนไม่เจอ
// ========================================

function onScanFailure(error) {

    // ไม่ต้องแสดงอะไร

}


// ========================================
// ปุ่มสลับกล้อง
// ========================================

document
    .getElementById("switchCamera")
    .addEventListener(
        "click",
        async function () {


            // ถ้ากำลังสแกนอยู่
            if (scanner && scanning) {

                try {

                    await scanner.stop();

                    scanning = false;

                } catch (error) {

                    console.log(error);

                }

            }


            // ====================================
            // สลับกล้อง
            // ====================================

            if (currentCamera === "environment") {

                currentCamera = "user";

            } else {

                currentCamera = "environment";

            }


            document.getElementById("scan-result").innerText =
                "🔄 กำลังเปลี่ยนกล้อง...";


            // เปิดกล้องใหม่

            startCamera();

        }
    );


// ========================================
// บันทึกข้อมูล
// ========================================

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


            if (!book.isbn) {

                alert(
                    "กรุณาสแกน ISBN ก่อน"
                );

                return;

            }


            console.log(
                "ข้อมูลหนังสือ:",
                book
            );


            alert(
                "💾 บันทึกข้อมูลเรียบร้อยแล้ว\n\n" +
                "ISBN: " + book.isbn +
                "\nชื่อหนังสือ: " + book.title
            );

        }
    );


// ========================================
// เริ่มระบบ
// ========================================

startCamera();
```
