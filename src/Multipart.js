const AWS = require("aws-sdk");
const uuid = require("uuid").v4();


let options = {};
if (process.env.IS_OFFLINE) {
    options = {
        s3ForcePathStyle: true,
        accessKeyId: "S3RVER", // This specific key is required when working offline
        secretAccessKey: "S3RVER",
        endpoint: new AWS.Endpoint("http://localhost:4569"),

    }
}
const s3 = new AWS.S3(options);
const BucketName = process.env.bucket_name;
const ownFiletype = process.env.fileType;




const badRequest = (body) => {
    return {
        statusCode: 400,
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    }
}

const success = (body) => {
    return {
        statusCode: 200,
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        }
    }
}
module.exports.getmultipartID = async (event) => {
    console.log({ event });
    try {
        if (!event.body) {
            throw new Error("body data is missing");
        }
        const parseBody = JSON.parse(event.body);
        const fileType = parseBody.type;
        const fileName = parseBody.fileName;
        if (!fileType || !fileName) {
            throw new Error("missing something");
        }
        //check file type is matching
        const fileTypeMatching = ownFiletype.split(",");
        if (!fileTypeMatching.includes(fileType)) {
            throw new Error("file type mismatch");
        }
        console.log({ id })
        const ttl = 20 * 60 * 1000 // 20 minutes
        const time = Date.now() + ttl;
        const ext = fileType?.split("/")[1]
        const params = {
            Bucket: BucketName,
            Key: `${uuid}.${ext}`,
            Expires: time,
            ContentType: fileType
        }
        const result = await s3.createMultipartUpload(params).promise();
        console.log("get upload Id result", { result });
        if (!result) {
            return badRequest({ message: "Something error occured during get uploadId" })
        }
        return success({ Key: result.Key, UploadId: result.UploadId });
    } catch (err) {
        console.log("error on get multipart Id", err);
        throw new Error("something error occured", err);
    }
}


module.exports.getPresinedURL = async (event) => {
    console.log({ event });
    try {
        if (!event.body) {
            throw new Error("body data is missing");
        }
        const parseData = JSON.parse(event.body);
        console.log({ parseData })
        const fileKey = parseData.fileName;
        const partNumber = parseData.partNumber;
        const UploadID = parseData.uploadId;
        if (!fileKey || !partNumber || !UploadID) {
            throw new Error("something missing");
        }
        const params = {
            Bucket: BucketName,
            Key: fileKey,
            PartNumber: partNumber,
            UploadId: UploadID,
        }
        console.log({ params });
        const result = await s3.getSignedUrl("uploadPart", params);
        console.log("upload parts ", result);
        if (!result) {
            return badRequest({ message: "something error occured" });
        }
        return success({ url: result });

    } catch (err) {
        throw new Error("something error occuredd", err);

    }
}
// complete upload
module.exports.completeUploadMultipart = async (event) => {
    console.log(event);
    try {
        if (!event.body) {
            throw new Error("body data is missing")
        }
        const parseBody = JSON.parse(event.body);
        const fileKey = parseBody.fileKey;
        const id = parseBody.uploadId;
        const parts = parseBody.parts;
        if (!fileKey || !id || !parts) {
            throw new Error("something is missing")
        }
        const params = {
            Bucket: BucketName,
            Key: fileKey,
            UploadId: id,
            MultipartUpload: {
                Parts: parts
            }
        }
        const result = await s3.completeMultipartUpload(params).promise().catch(err => {
            console.log(err)
            throw new Error("something error occured", err);
        });
        console.log("complete file upload", result);
        if (!result) {
            return badRequest({ message: "something error occured" })
        }
        return success({ result: result.Location });
    } catch (err) {
        console.log("error on complete parts upload", { err })
        throw new Error("something error occured", err);

    }
}
