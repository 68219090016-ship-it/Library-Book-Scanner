// ==================================================
// ตัวแปรระบบกล้อง
// ==================================================

let html5QrCode;

let cameras = [];

let currentCameraIndex = 0;

let isScanning = false;


// ==================================================
// เริ่มต้นระบบกล้อง
// ==================================================

async function startCamera() {

    try {

        console.log("กำลังค้นหากล้อง...");


        // ขอรายการกล้อง

        cameras =
            await Html5Qrcode.getCameras();


        console.log(
            "พบกล้อง:",
            cameras
        );


        // ------------------------------------------
        // ตรวจสอบว่ามีกล้องหรือไม่
        // ------------------------------------------

        if (
            !cameras ||
            cameras.length === 0
        ) {

            document.getElementById(
                "scan-result"
            ).innerText =
                "❌ ไม่พบกล้อง";

            return;
        }


        // ------------------------------------------
        // แสดงจำนวนกล้องใน Console
        // ------------------------------------------

        console.log(
            "จำนวนกล้อง:",
            cameras.length
        );


        // ------------------------------------------
        // พยายามเลือกกล้องหลัง
        // ------------------------------------------

        currentCameraIndex =
            cameras.findIndex(
                camera => {

                    const label =
                        camera.label.toLowerCase();

                    return (
                        label.includes("back") ||
                        label.includes("rear") ||
                        label.includes("environment")
                    );
                }
            );


        // ถ้าไม่พบกล้องหลัง
        // ใช้กล้องตัวแรก

        if (
            currentCameraIndex === -1
        ) {

            currentCameraIndex = 0;
        }


        console.log(
            "เลือกกล้อง:",
            cameras[currentCameraIndex]
        );


        // ------------------------------------------
        // เริ่มสแกน
        // ------------------------------------------

        startScanning();


    } catch (error) {

        console.error(
            "Camera Error:",
            error
        );


        document.getElementById(
            "scan-result"
        ).innerText =
            "❌ ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้กล้อง";
    }
}



// ==================================================
// เริ่มระบบสแกน
// ==================================================

function startScanning() {

    // ------------------------------------------
    // ตรวจสอบกล้อง
    // ------------------------------------------

    if (
        !cameras ||
        cameras.length === 0
    ) {

        return;
    }


    // ------------------------------------------
    // ถ้ามีระบบเก่าอยู่
    // ให้ล้างก่อน
    // ------------------------------------------

    if (html5QrCode) {

        try {

            html5QrCode.clear();

        } catch (error) {

            console.log(
                "Clear camera:",
                error
            );
        }
    }


    // ------------------------------------------
    // สร้างระบบสแกนใหม่
    // ------------------------------------------

    html5QrCode =
        new Html5Qrcode("reader");


    // ------------------------------------------
    // เลือกกล้อง
    // ------------------------------------------

    const cameraId =
        cameras[currentCameraIndex].id;


    console.log(
        "กำลังเปิดกล้อง:",
        cameraId
    );


    // ------------------------------------------
    // เริ่มกล้อง
    // ------------------------------------------

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

    )

    .then(() => {

        isScanning = true;


        document.getElementById(
            "scan-result"
        ).innerText =
            "📷 กำลังสแกน...";


        console.log(
            "เปิดกล้องสำเร็จ"
        );

    })

    .catch(error => {

        console.error(
            "Start Camera Error:",
            error
        );


        isScanning = false;


        document.getElementById(
            "scan-result"
        ).innerText =
            "❌ ไม่สามารถเปิดกล้องได้";
    });
}



// ==================================================
// เมื่อสแกนบาร์โค้ดสำเร็จ
// ==================================================

async function onScanSuccess(decodedText) {

    console.log(
        "สแกนได้:",
        decodedText
    );


    // ------------------------------------------
    // ทำความสะอาด ISBN
    // ------------------------------------------

    const isbn =
        decodedText
            .replace(/[-\s]/g, "")
            .trim();


    console.log(
        "ISBN:",
        isbn
    );


    // ------------------------------------------
    // แสดง ISBN
    // ------------------------------------------

    document.getElementById(
        "isbn"
    ).value = isbn;


    // ------------------------------------------
    // แสดงสถานะ
    // ------------------------------------------

    document.getElementById(
        "scan-result"
    ).innerText =
        "🔎 กำลังค้นหาข้อมูลหนังสือ...";


    // ------------------------------------------
    // หยุดกล้อง
    // ------------------------------------------

    if (
        html5QrCode &&
        isScanning
    ) {

        try {

            await html5QrCode.stop();


            isScanning = false;


            console.log(
                "หยุดกล้องแล้ว"
            );

        } catch (error) {

            console.error(
                "Stop Camera Error:",
                error
            );
        }
    }


    // ------------------------------------------
    // ตรวจสอบ ISBN
    // ------------------------------------------

    if (
        isbn.length !== 10 &&
        isbn.length !== 13
    ) {

        document.getElementById(
            "scan-result"
        ).innerText =
            "❌ บาร์โค้ดนี้ไม่ใช่ ISBN";


        alert(
            "บาร์โค้ดนี้ไม่ใช่ ISBN\n\n" +
            "ค่าที่อ่านได้: " +
            isbn
        );


        return;
    }


    // ==================================================
    // ค้นหาข้อมูลจาก Google Books
    // ==================================================

    try {

        const url =
            "https://www.googleapis.com/books/v1/volumes?q=isbn:" +
            encodeURIComponent(isbn);


        console.log(
            "กำลังค้นหา:",
            url
        );


        // ------------------------------------------
        // ส่งคำขอ
        // ------------------------------------------

        const response =
            await fetch(url);


        // ------------------------------------------
        // ตรวจสอบการเชื่อมต่อ
        // ------------------------------------------

        if (!response.ok) {

            throw new Error(
                "ไม่สามารถเชื่อมต่อ Google Books ได้"
            );
        }


        // ------------------------------------------
        // อ่านข้อมูล JSON
        // ------------------------------------------

        const data =
            await response.json();


        console.log(
            "ข้อมูลจาก Google Books:",
            data
        );


        // ------------------------------------------
        // ตรวจสอบข้อมูล
        // ------------------------------------------

        if (
            !data.items ||
            data.items.length === 0
        ) {

            document.getElementById(
                "scan-result"
            ).innerText =
                "❌ ไม่พบข้อมูลหนังสือ";


            alert(
                "ไม่พบข้อมูลหนังสือ\n\n" +
                "ISBN: " +
                isbn
            );


            return;
        }


        // ------------------------------------------
        // ข้อมูลหนังสือ
        // ------------------------------------------

        const book =
            data.items[0];


        const info =
            book.volumeInfo || {};


        const sale =
            book.saleInfo || {};


        console.log(
            "รายละเอียดหนังสือ:",
            info
        );


        // ==================================================
        // ชื่อหนังสือ
        // ==================================================

        document.getElementById(
            "title"
        ).value =
            info.title ||
            "ไม่มีข้อมูล";


        // ==================================================
        // ผู้แต่ง
        // ==================================================

        document.getElementById(
            "author"
        ).value =

            info.authors
                ? info.authors.join(", ")
                : "ไม่มีข้อมูล";


        // ==================================================
        // สำนักพิมพ์
        // ==================================================

        document.getElementById(
            "publisher"
        ).value =
            info.publisher ||
            "ไม่มีข้อมูล";


        // ==================================================
        // ปีที่พิมพ์
        // ==================================================

        document.getElementById(
            "year"
        ).value =
            info.publishedDate ||
            "ไม่มีข้อมูล";


        // ==================================================
        // จำนวนหน้า
        // ==================================================

        document.getElementById(
            "pages"
        ).value =

            info.pageCount
                ? info.pageCount + " หน้า"
                : "ไม่มีข้อมูล";


        // ==================================================
        // หมวดหมู่
        // ==================================================

        document.getElementById(
            "category"
        ).value =

            info.categories
                ? info.categories.join(", ")
                : "ไม่มีข้อมูล";


        // ==================================================
        // ราคา
        // ==================================================

        if (
            sale.listPrice &&
            sale.listPrice.amount
        ) {

            document.getElementById(
                "price"
            ).value =

                sale.listPrice.amount +
                " " +
                (
                    sale.listPrice.currencyCode ||
                    ""
                );

        } else {

            document.getElementById(
                "price"
            ).value =
                "ไม่มีข้อมูล";
        }


        // ==================================================
        // สำเร็จ
        // ==================================================

        document.getElementById(
            "scan-result"
        ).innerText =
            "✅ พบข้อมูลหนังสือแล้ว";


    } catch (error) {

        console.error(
            "Book API Error:",
            error
        );


        document.getElementById(
            "scan-result"
        ).innerText =
            "❌ ไม่สามารถค้นหาข้อมูลหนังสือได้";


        alert(
            "เกิดข้อผิดพลาดในการค้นหาข้อมูล\n\n" +
            error.message
        );
    }
}



// ==================================================
// ระหว่างกำลังสแกน
// ==================================================

function onScanFailure(error) {

    // ไม่ต้องแสดงอะไร

}



// ==================================================
// ปุ่มสลับกล้อง
// ==================================================

document
    .getElementById("switchCamera")
    .addEventListener(
        "click",
        async function () {


            // --------------------------------------
            // ตรวจสอบจำนวนกล้อง
            // --------------------------------------

            if (
                cameras.length < 2
            ) {

                alert(
                    "อุปกรณ์นี้มีกล้องเพียงตัวเดียว"
                );

                return;
            }


            try {

                // ----------------------------------
                // หยุดกล้องปัจจุบัน
                // ----------------------------------

                if (
                    html5QrCode &&
                    isScanning
                ) {

                    await html5QrCode.stop();

                    isScanning = false;
                }


                // ----------------------------------
                // เปลี่ยนกล้อง
                // ----------------------------------

                currentCameraIndex++;


                if (
                    currentCameraIndex >=
                    cameras.length
                ) {

                    currentCameraIndex = 0;
                }


                // ----------------------------------
                // แสดงสถานะ
                // ----------------------------------

                document.getElementById(
                    "scan-result"
                ).innerText =
                    "🔄 กำลังเปลี่ยนกล้อง...";


                // ----------------------------------
                // เปิดกล้องใหม่
                // ----------------------------------

                startScanning();


            } catch (error) {

                console.error(
                    "Switch Camera Error:",
                    error
                );


                alert(
                    "ไม่สามารถสลับกล้องได้"
                );
            }
        }
    );



// ==================================================
// เริ่มระบบเมื่อเปิดหน้าเว็บ
// ==================================================

startCamera();



// ==================================================
// ปุ่มบันทึกข้อมูล
// ==================================================

document
    .getElementById("saveButton")
    .addEventListener(
        "click",
        function () {


            // --------------------------------------
            // เก็บข้อมูล
            // --------------------------------------

            const book = {

                isbn:
                    document.getElementById(
                        "isbn"
                    ).value,

                title:
                    document.getElementById(
                        "title"
                    ).value,

                author:
                    document.getElementById(
                        "author"
                    ).value,

                publisher:
                    document.getElementById(
                        "publisher"
                    ).value,

                year:
                    document.getElementById(
                        "year"
                    ).value,

                price:
                    document.getElementById(
                        "price"
                    ).value,

                pages:
                    document.getElementById(
                        "pages"
                    ).value,

                category:
                    document.getElementById(
                        "category"
                    ).value
            };


            // --------------------------------------
            // แสดงใน Console
            // --------------------------------------

            console.log(
                "ข้อมูลหนังสือ:",
                book
            );


            // --------------------------------------
            // ตรวจสอบ ISBN
            // --------------------------------------

            if (
                book.isbn === ""
            ) {

                alert(
                    "กรุณาสแกนบาร์โค้ดหนังสือก่อน"
                );

                return;
            }


            // --------------------------------------
            // บันทึก
            // --------------------------------------

            alert(
                "💾 บันทึกข้อมูลเรียบร้อยแล้ว\n\n" +
                "ISBN: " +
                book.isbn
            );

        }
    );