// https://base64.guru/standards/base64url
export const encodeBase64url = (string: string | Buffer) => {
    return Buffer.from(string)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
};

export const decodeBase64url = (base64url: string) => {
    return Buffer.from(
        base64url +
            "==="
                .slice((base64url.length + 3) % 4)
                .replace(/-/g, "+")
                .replace(/_/g, "/"),
        "base64"
    ).toString();
};
