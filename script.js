let html5QrCode;
let cameras = [];
let currentCameraIndex = 0;
let isScanning = false;
let lastScannedISBN = "";


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

        // เลือกกล้องหลัง
        currentCameraIndex = cameras.findIndex(camera => {

            const label = camera.label.toLowerCase();

            return (
                label.includes("back") ||
                label.includes("rear") ||
                label.includes("environment")
            );

        });

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

    html5QrCode =
        new Html5Qrcode("reader");


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

    console.log("================================");
    console.log("BARCODE:", decodedText);
    console.log("================================");


    // เอาเฉพาะตัวเลข และ X
    const isbn =
        decodedText
            .replace(/[^0-9Xx]/g, "")
            .toUpperCase();


    console.log("ISBN:", isbn);


    // ป้องกันสแกนซ้ำ
    if (isbn === lastScannedISBN) {
        return;
    }

    lastScannedISBN = isbn;


    // แสดง ISBN
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


    // ตรวจ ISBN
    if (
        isbn.length !== 10 &&
        isbn.length !== 13
    ) {

        document.getElementById("scan-result").innerText =
            "⚠️ บาร์โค้ดนี้ไม่ใช่ ISBN: " + isbn;

        return;
    }


    // ค้นหา
    searchBook(isbn);
}


// =====================================
// ระบบค้นหาหลัก
// =====================================

async function searchBook(isbn) {

    console.log("");
    console.log("================================");
    console.log("🔎 SEARCH ISBN:", isbn);
    console.log("================================");


    clearBookData();


    document.getElementById("scan-result").innerText =
        "🔎 กำลังค้นหาหนังสือ...";


    // =================================
    // วิธีที่ 1
    // Open Library ISBN API
    // =================================

    const result1 =
        await searchOpenLibraryISBN(isbn);


    if (result1) {

        console.log(
            "✅ พบจาก Open Library ISBN API"
        );

        fillOpenLibraryData(
            result1,
            isbn
        );

        document.getElementById("scan-result").innerText =
            "✅ พบข้อมูลหนังสือแล้ว";

        return;
    }


    // =================================
    // วิธีที่ 2
    // Open Library Search API
    // =================================

    document.getElementById("scan-result").innerText =
        "🌐 กำลังค้นหาฐานข้อมูลหนังสือเพิ่มเติม...";


    const result2 =
        await searchOpenLibrarySearch(isbn);


    if (result2) {

        console.log(
            "✅ พบจาก Open Library Search API"
        );

        fillOpenLibrarySearchData(
            result2,
            isbn
        );

        document.getElementById("scan-result").innerText =
            "✅ พบข้อมูลหนังสือแล้ว";

        return;
    }


    // =================================
    // วิธีที่ 3
    // Open Library API Books
    // =================================

    document.getElementById("scan-result").innerText =
        "🌐 กำลังตรวจสอบ ISBN อีกครั้ง...";


    const result3 =
        await searchOpenLibraryBooksAPI(isbn);


    if (result3) {

        console.log(
            "✅ พบจาก Open Library Books API"
        );

        fillOpenLibraryData(
            result3,
            isbn
        );

        document.getElementById("scan-result").innerText =
            "✅ พบข้อมูลหนังสือแล้ว";

        return;
    }


    // =================================
    // ไม่พบ
    // =================================

    document.getElementById("scan-result").innerText =
        "⚠️ ยังไม่พบข้อมูล ISBN นี้";


    console.log(
        "❌ ไม่พบ ISBN:",
        isbn
    );
}


// =====================================
// Open Library ISBN API
// =====================================

async function searchOpenLibraryISBN(isbn) {

    try {

        const url =
            "https://openlibrary.org/isbn/" +
            encodeURIComponent(isbn) +
            ".json";


        console.log(
            "Open Library ISBN:",
            url
        );


        const response =
            await fetch(url);


        if (!response.ok) {

            console.log(
                "ISBN API HTTP:",
                response.status
            );

            return null;
        }


        const data =
            await response.json();


        console.log(
            "ISBN API DATA:",
            data
        );


        return data;

    } catch (error) {

        console.error(
            "ISBN API ERROR:",
            error
        );

        return null;
    }
}


// =====================================
// Open Library Search API
// =====================================

async function searchOpenLibrarySearch(isbn) {

    try {

        const url =
            "https://openlibrary.org/search.json" +
            "?q=" +
            encodeURIComponent(isbn) +
            "&limit=20";


        console.log(
            "Search API:",
            url
        );


        const response =
            await fetch(url);


        if (!response.ok) {

            console.log(
                "Search API HTTP:",
                response.status
            );

            return null;
        }


        const data =
            await response.json();


        console.log(
            "Search DATA:",
            data
        );


        if (
            !data.docs ||
            data.docs.length === 0
        ) {

            return null;
        }


        // พยายามหา ISBN ตรง
        const exact =
            findExactISBN(
                data.docs,
                isbn
            );


        if (exact) {

            return exact;
        }


        // ถ้าไม่มี ISBN ตรง
        // ใช้ผลลัพธ์แรก
        return data.docs[0];

    } catch (error) {

        console.error(
            "Search API ERROR:",
            error
        );

        return null;
    }
}


// =====================================
// Open Library Books API
// =====================================

async function searchOpenLibraryBooksAPI(isbn) {

    try {

        const url =
            "https://openlibrary.org/api/books" +
            "?bibkeys=ISBN:" +
            encodeURIComponent(isbn) +
            "&format=json" +
            "&jscmd=data";


        console.log(
            "Books API:",
            url
        );


        const response =
            await fetch(url);


        if (!response.ok) {

            return null;
        }


        const data =
            await response.json();


        console.log(
            "Books API DATA:",
            data
        );


        const key =
            "ISBN:" + isbn;


        if (!data[key]) {

            return null;
        }


        return data[key];

    } catch (error) {

        console.error(
            "Books API ERROR:",
            error
        );

        return null;
    }
}


// =====================================
// หา ISBN ที่ตรงกัน
// =====================================

function findExactISBN(books, isbn) {

    const cleanISBN =
        isbn
            .replace(/[^0-9Xx]/g, "")
            .toUpperCase();


    for (const book of books) {

        if (
            !book.isbn ||
            !Array.isArray(book.isbn)
        ) {

            continue;
        }


        for (const bookISBN of book.isbn) {

            const cleanBookISBN =
                String(bookISBN)
                    .replace(/[^0-9Xx]/g, "")
                    .toUpperCase();


            if (
                cleanBookISBN ===
                cleanISBN
            ) {

                return book;
            }
        }
    }


    return null;
}


// =====================================
// ใส่ข้อมูลจาก ISBN API
// =====================================

function fillOpenLibraryData(book, isbn) {

    console.log(
        "📚 BOOK DATA:",
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
                .map(author => {

                    return author.name || "";

                })
                .filter(name => name !== "")
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
                .map(publisher => {

                    return publisher.name || "";

                })
                .filter(name => name !== "")
                .join(", ");

    } else {

        document.getElementById("publisher").value =
            "";
    }


    // ปี
    document.getElementById("year").value =
        book.publish_date || "";


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
                .slice(0, 8)
                .map(subject => {

                    return subject.name || "";

                })
                .filter(name => name !== "")
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

function fillOpenLibrarySearchData(book, isbn) {

    console.log(
        "📚 SEARCH BOOK:",
        book
    );


    // ISBN
    document.getElementById("isbn").value =
        isbn;


    // ชื่อ
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


    // ปี
    document.getElementById("year").value =
        book.first_publish_year || "";


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
                .slice(0, 8)
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
// ล้างข้อมูลเก่า
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
// Scan Failure
// =====================================

function onScanFailure(error) {

    // ไม่ต้องแสดงข้อความ
}


// =====================================
// สลับกล้อง
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

const saveButton =
    document.getElementById("saveButton");


if (saveButton) {

    saveButton.addEventListener(
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
}