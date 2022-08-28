
const AWS = require("aws-sdk");
const { detection } = require("./DetectFile");
const { ContentType } = require("./getContenttype");
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
// const FileType = process.env.fileType;
// const fileExtension = FileType.split(",")



module.exports.getSignedURL1 = async (event) => {
    console.log({ event });
    try {
        if (!event.queryStringParameters || !event.queryStringParameters.projectId) {
            throw new Error("parameter key is missing")
        }
        console.log(event.queryStringParameters)
        const name = event.queryStringParameters.projectId;
        console.log({ name })
        const getExtension = name?.split(".")[1];
        console.log("get extension of query paramater", { getExtension });
        console.log("gettype ", ContentType(getExtension));

        const type = ContentType(getExtension);
        if (!type) {
            throw new Error("invalid type formate")
        }
        const params = {
            Bucket: BucketName,
            Key: `${uuid}.${getExtension}`,
            // Key: key,
            // Expires: 60 * 5,
            ContentType: `${type}`,
        }
        // const id = Math.floor(Math.random() * 300);
        // const params = {
        //     Bucket: BucketName,
        //     Key: `${id}`
        // }

        console.log({ params });
        const url = s3.getSignedUrl("putObject", params);
        // const url =await s3.createMultipartUpload(params).promise();
        return {
            statusCode: 200,
            body: JSON.stringify(url),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
        }
    } catch (err) {
        console.log("error occured durign signed url", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "something error occured" + err }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }
    }
}
module.exports.executionPayload = async (event, context) => {
    console.log({ event });
    console.log({ context });
    try {
        const s3Event = event.Records[0].s3;
        console.log({ s3Event });
        console.log("bucket details", s3Event.bucket);
        console.log("Object  details", s3Event.object);
        const params = {
            Bucket: s3Event.bucket.name,
            Key: s3Event.object.key,
        };
        console.log({ params });
        let data = await s3.getObject(params).promise();
        console.log("Data ", data)
        const getContentType = data.ContentType;
        const result = detection(data.Body, getContentType);
        console.log("check fileType by detection", { result });
        console.log("buffer data", data.Body);
        // const isMatching = getContentType === result.mime ? true : false;
        // // const isMatching = fileExtension.includes(result?.ext) ? true : false;
        // console.log({ isMatching });
        // if (!isMatching) {
        //     //remove the item from buckets if not match
        //     const params = {
        //         Bucket: s3Event.bucket.name,
        //         Key: s3Event.object.key,
        //     };

        //     const deleteObject = await s3.deleteObject(params).promise();
        //     console.log({ deleteObject });
        //     return "success"
        // }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "0" }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }
    } catch (err) {
        console.log("error occured", err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "something error occured" }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }
    }
}


//get the file by name
module.exports.getFile = async (event) => {
    console.log("getObjects", { event });
    try {
        if (!event.pathParameters || !event.pathParameters.ID) {
            throw new Error("parameter key is missing");
        }
        const fileName = event.pathParameters.ID;
        console.log({ fileName });
        const params = {
            Bucket: BucketName,
            Key: fileName,
            Expires: 60 * 5
        }
        // const result = await s3.getObject(params).promise();
        const result = s3.getSignedUrl("getObject", params)
        console.log({ result });
        if (!result) {
            throw new Error("data not exits")
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ result }),
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }
    } catch (err) {
        console.log("err", err);
        throw new Error({ message: "something error occured", err })

    }
}