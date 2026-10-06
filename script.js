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


    // เอาเฉพาะตัวเลขและ X
    const isbn =
        decodedText.replace(/[^0-9Xx]/g, "");


    console.log("ISBN:", isbn);


    // ใส่ ISBN
    document.getElementById("isbn").value =
        isbn;


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

    console.log("=================================");
    console.log("เริ่มค้นหา ISBN:", isbn);
    console.log("=================================");


    document.getElementById("scan-result").innerText =
        "🔎 กำลังค้นหาหนังสือทั่วโลก...";


    // ล้างข้อมูลเก่าก่อน
    clearBookData();


    // =================================
    // แหล่งที่ 1
    // Open Library Search API
    // =================================

    try {

        console.log("กำลังค้นหา Open Library...");


        const openLibraryURL =
            "https://openlibrary.org/search.json" +
            "?q=" +
            encodeURIComponent("isbn:" + isbn) +
            "&fields=" +
            encodeURIComponent(
                "key,title,author_name,publisher,first_publish_year," +
                "publish_year,number_of_pages_median,subject,isbn,cover_i"
            ) +
            "&limit=10";


        console.log(
            "Open Library URL:",
            openLibraryURL
        );


        const response =
            await fetch(openLibraryURL);


        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }


        const data =
            await response.json();


        console.log(
            "Open Library:",
            data
        );


        if (
            data.docs &&
            data.docs.length > 0
        ) {

            // พยายามหาเล่มที่มี ISBN ตรงกัน
            let book =
                findExactISBNBook(
                    data.docs,
                    isbn
                );


            // ถ้าหา ISBN ตรงไม่ได้
            // ใช้ผลลัพธ์อันดับแรก
            if (!book) {
                book = data.docs[0];
            }


            console.log(
                "พบหนังสือจาก Open Library:",
                book
            );


            fillOpenLibraryData(
                book,
                isbn
            );


            document.getElementById("scan-result").innerText =
                "✅ พบข้อมูลหนังสือแล้ว";


            return;
        }


        console.log(
            "Open Library ไม่พบข้อมูล"
        );

    } catch (error) {

        console.error(
            "Open Library Error:",
            error
        );
    }


    // =================================
    // แหล่งที่ 2
    // Google Books API
    // =================================

    try {

        document.getElementById("scan-result").innerText =
            "🌐 กำลังค้นหาจากฐานข้อมูลสำรอง...";


        console.log(
            "กำลังค้นหา Google Books..."
        );


        const googleURL =
            "https://www.googleapis.com/books/v1/volumes" +
            "?q=isbn:" +
            encodeURIComponent(isbn) +
            "&maxResults=10";


        console.log(
            "Google Books URL:",
            googleURL
        );


        const response =
            await fetch(googleURL);


        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );
        }


        const data =
            await response.json();


        console.log(
            "Google Books:",
            data
        );


        if (
            data.items &&
            data.items.length > 0
        ) {

            let book =
                findGoogleISBNBook(
                    data.items,
                    isbn
                );


            if (!book) {
                book = data.items[0];
            }


            console.log(
                "พบหนังสือจาก Google Books:",
                book
            );


            fillGoogleBookData(
                book,
                isbn
            );


            document.getElementById("scan-result").innerText =
                "✅ พบข้อมูลหนังสือแล้ว";


            return;
        }


        console.log(
            "Google Books ไม่พบข้อมูล"
        );


    } catch (error) {

        console.error(
            "Google Books Error:",
            error
        );
    }


    // =================================
    // ไม่พบข้อมูล
    // =================================

    document.getElementById("scan-result").innerText =
        "⚠️ ไม่พบข้อมูลหนังสือ ISBN: " + isbn;

}


// =====================================
// ตรวจสอบ ISBN จาก Open Library
// =====================================

function findExactISBNBook(books, isbn) {

    const cleanISBN =
        isbn.replace(/[^0-9Xx]/g, "").toUpperCase();


    for (const book of books) {

        if (
            !book.isbn ||
            !Array.isArray(book.isbn)
        ) {
            continue;
        }


        const found =
            book.isbn.some(bookISBN => {

                return bookISBN
                    .replace(/[^0-9Xx]/g, "")
                    .toUpperCase() === cleanISBN;

            });


        if (found) {
            return book;
        }
    }


    return null;
}


// =====================================
// ตรวจสอบ ISBN จาก Google Books
// =====================================

function findGoogleISBNBook(books, isbn) {

    const cleanISBN =
        isbn.replace(/[^0-9Xx]/g, "").toUpperCase();


    for (const item of books) {

        if (!item.volumeInfo) {
            continue;
        }


        const identifiers =
            item.volumeInfo.industryIdentifiers;


        if (!identifiers) {
            continue;
        }


        const found =
            identifiers.some(identifier => {

                return identifier.identifier
                    .replace(/[^0-9Xx]/g, "")
                    .toUpperCase() === cleanISBN;

            });


        if (found) {
            return item;
        }
    }


    return null;
}


// =====================================
// ใส่ข้อมูลจาก Open Library
// =====================================

function fillOpenLibraryData(book, isbn) {

    console.log(
        "กำลังใส่ข้อมูล Open Library:",
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
    if (book.first_publish_year) {

        document.getElementById("year").value =
            book.first_publish_year;

    } else if (
        book.publish_year &&
        book.publish_year.length > 0
    ) {

        document.getElementById("year").value =
            Math.min(...book.publish_year);

    } else {

        document.getElementById("year").value =
            "";
    }


    // จำนวนหน้า
    document.getElementById("pages").value =
        book.number_of_pages_median || "";


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
// ใส่ข้อมูลจาก Google Books
// =====================================

function fillGoogleBookData(book, isbn) {

    console.log(
        "กำลังใส่ข้อมูล Google Books:",
        book
    );


    const info =
        book.volumeInfo || {};


    // ISBN
    document.getElementById("isbn").value =
        isbn;


    // ชื่อหนังสือ
    document.getElementById("title").value =
        info.title || "";


    // ผู้แต่ง
    if (
        info.authors &&
        info.authors.length > 0
    ) {

        document.getElementById("author").value =
            info.authors.join(", ");

    } else {

        document.getElementById("author").value =
            "";
    }


    // สำนักพิมพ์
    document.getElementById("publisher").value =
        info.publisher || "";


    // ปีที่พิมพ์
    document.getElementById("year").value =
        info.publishedDate || "";


    // จำนวนหน้า
    document.getElementById("pages").value =
        info.pageCount || "";


    // หมวดหมู่
    if (
        info.categories &&
        info.categories.length > 0
    ) {

        document.getElementById("category").value =
            info.categories.join(", ");

    } else {

        document.getElementById("category").value =
            "";
    }


    // ราคา
    let priceText =
        "ไม่พบข้อมูลราคา";


    if (
        book.saleInfo &&
        book.saleInfo.listPrice &&
        book.saleInfo.listPrice.amount
    ) {

        const price =
            book.saleInfo.listPrice.amount;

        const currency =
            book.saleInfo.listPrice.currencyCode || "";


        priceText =
            price + " " + currency;
    }


    document.getElementById("price").value =
        priceText;
}


// =====================================
// ล้างข้อมูลหนังสือเก่า
// =====================================

function clearBookData() {

    document.getElementById("title").value =
        "";

    document.getElementById("author").value =
        "";

    document.getElementById("publisher").value =
        "";

    document.getElementById("year").value =
        "";

    document.getElementById("price").value =
        "";

    document.getElementById("pages").value =
        "";

    document.getElementById("category").value =
        "";
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