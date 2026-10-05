```javascript
// ========================================
// เมื่อสแกน ISBN สำเร็จ
// ========================================

async function onScanSuccess(decodedText) {

    console.log("สแกนได้:", decodedText);


    // ========================================
    // ทำความสะอาด ISBN
    // ========================================

    const isbn = decodedText
        .replace(/[-\s]/g, "")
        .trim();


    // แสดง ISBN

    document.getElementById("isbn").value = isbn;


    document.getElementById("scan-result").innerText =
        "🔎 กำลังค้นหาข้อมูลหนังสือ...";


    // ========================================
    // หยุดการสแกน
    // ========================================

    html5QrcodeScanner.clear();


    // ========================================
    // ค้นหาข้อมูลจาก Google Books
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
            "ข้อมูลจาก Google Books:",
            data
        );


        // ========================================
        // ตรวจสอบว่าพบหนังสือหรือไม่
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
        // ดึงข้อมูลหนังสือ
        // ========================================

        const bookData =
            data.items[0];


        const info =
            bookData.volumeInfo || {};


        const sale =
            bookData.saleInfo || {};


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

            document.getElementById("price").value =

                sale.listPrice.amount +
                " " +
                (
                    sale.listPrice.currencyCode || ""
                );

        } else {

            document.getElementById("price").value =
                "ไม่มีข้อมูล";

        }


        // ========================================
        // สำเร็จ
        // ========================================

        document.getElementById("scan-result").innerText =
            "✅ พบข้อมูลหนังสือแล้ว";


    } catch (error) {


        console.error(
            "เกิดข้อผิดพลาด:",
            error
        );


        document.getElementById("scan-result").innerText =
            "❌ ไม่สามารถค้นหาข้อมูลหนังสือได้";


        alert(
            "เกิดข้อผิดพลาดในการค้นหาข้อมูล"
        );

    }

}


// ========================================
// ระหว่างสแกน
// ========================================

function onScanFailure(error) {

    // ไม่ต้องแสดงอะไร

}


// ========================================
// ระบบกล้องเดิมของคุณ
// ========================================

const html5QrcodeScanner = new Html5QrcodeScanner(

    "reader",

    {

        fps: 10,

        qrbox: {

            width: 300,

            height: 150

        }

    },

    false

);


html5QrcodeScanner.render(

    onScanSuccess,

    onScanFailure

);


// ========================================
// ปุ่มบันทึก
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


            console.log(
                "ข้อมูลหนังสือ:",
                book
            );


            alert(
                "💾 บันทึกข้อมูลเรียบร้อยแล้ว"
            );

        }
    );
```
