// endtpoints
const uniqueIDEndPoint = "unique id API Gatways";
const uploadPartsEnd = "upload parts end point api gateways"
const completePartEndPoint = "complete parts end point api getways"
const presinedURLEnd = "get presined url end point API GATEWAYS"

const file = document.getElementById("uploadFile");
const btn = document.getElementById("btn");
const image = document.getElementById("image");
let computeSize = 6 * 1024 * 1024 //6MB
btn.onclick = async function () {
    const filedata = file.files[0];
    const fileType = file.files[0].type;
    const fileName = file.files[0].name;
    const fileSize = file.files[0].size;
    const chuncks = await createChuncks(filedata, computeSize, fileSize);
    const { fileID, UploadId } = await getUniqueID(fileName, fileType);
    await getPresinedURLForEachParts(chuncks, fileID, UploadId);
}



async function createChuncks(file, computeSize, fileSize) {
    console.log({ file, computeSize, fileSize });
    let startPinter = 0;
    let endPointer = fileSize;
    let blob;
    const chuncks = [];
    //take a files chuncks
    while (startPinter < endPointer) {
        let newStartPinter = startPinter + computeSize;
        blob = file.slice(startPinter, newStartPinter)
        chuncks.push(blob);
        startPinter = newStartPinter;
    }
    return chuncks;
}


async function getUniqueID(fileName, fileType) {
    const res = await fetch(uniqueIDEndPoint, {
        method: "POST",
        body: JSON.stringify({ type: fileType, fileName: fileName }),
    })
    const result = await res.json();
    return {
        fileID: result.Key,
        UploadId: result.UploadId
    };
}

async function getPresinedURLForEachParts(chuncks, fileName, uploadId) {
    let presinedURLStore = [];
    let completePartsWithEtags = [];
    // console.log()

    //get presined url for each parts
    for (var i = 0; i < chuncks.length; i++) {
        const res = await fetch(presinedURLEnd, {
            method: "POST",
            body: JSON.stringify({
                fileName,
                uploadId,
                partNumber: i + 1
            })
        })
        const result = await res.json();
        presinedURLStore.push({ part: i + 1, url: result.url })
    }

    //upload blob data on presined URL
    for (var j = 0; j < presinedURLStore.length; j++) {
        const res = await fetch(presinedURLStore[j].url, {
            method: "PUT",
            body: chuncks[j]
        })
        const ETagHeader = res.headers.get("ETag");
        const uploadPartWithETags = {
            ETag: ETagHeader,
            PartNumber: j + 1
        }
        completePartsWithEtags.push(uploadPartWithETags);
    }
    //now upload complete parts of file
    await completeParts(completePartsWithEtags, fileName, uploadId);
}


async function completeParts(complete, fileName, uploadId) {
    const res = await fetch(completePartEndPoint, {
        method: "POST",
        body: JSON.stringify({ parts: complete, fileKey: fileName, uploadId: uploadId })
    })
    const result = await res.json();
    console.log({ result });
}