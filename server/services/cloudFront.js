import { getSignedUrl } from "@aws-sdk/cloudfront-signer";


const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;
const keyPairId = "K1Z0NXWPQ270K1";
const dateLessThan = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // any Date constructor compatible

const distributionName = `https://d1ckynu1o8h8wy.cloudfront.net`;

export const createCloudFrontSignedGetUrl = ({key}) => {
  const url = `${distributionName}/${key}?response-content-disposition=${encodeURIComponent('attachment;filename="text123.jpg"')}`;
  const signedUrl = getSignedUrl({
    url,
    keyPairId,
    dateLessThan,
    privateKey,
  });

  return signedUrl;
};

// openssl genrsa -out private_key.pem 2048
// openssl rsa -in private_key.pem -pubout -out public_key.pem
