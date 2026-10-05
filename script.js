function onScanSuccess(decodedText) {

    console.log("สแกนได้:", decodedText);

    document.getElementById("isbn").value = decodedText;

    document.getElementById("scan-result").innerText =
        "สแกนสำเร็จ ISBN: " + decodedText;

    // หยุดการสแกนหลังจากอ่านได้
    html5QrcodeScanner.clear();
}

function onScanFailure(error) {
    // ไม่ต้องแสดงอะไรระหว่างที่ยังสแกนไม่เจอ
}

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


document.getElementById("saveButton").addEventListener("click", function () {

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

    alert("บันทึกข้อมูลเรียบร้อยแล้ว");
});