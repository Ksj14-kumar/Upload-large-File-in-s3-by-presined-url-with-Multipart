module.exports.ContentType = (key) => {
    console.log({ key });
    const content = {
        "jpg": "image/jpg",
        "png": "image/png",
        "jpeg": "image/jpeg",
        "svg": "image/svg",
        "webp": "image/webp",
        "mp4": "video/mp4",
    }

    let value;
    for (var i in content) {
        // console.log(i);
        if (i === key) {
            value = content[i];
            break;
        }
    }

    return value;


    // const isTrue = Object.hasOwn(content, key)
    // if (isTrue) {
    //     return content[key];
    // }
    // else {
    //     throw new Error("type not match");
    // }
    // const getType =  ?  : "null"
    // return getType;
}