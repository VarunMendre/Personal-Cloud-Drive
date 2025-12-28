import { getSignedUrl } from "@aws-sdk/cloudfront-signer";


const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;
const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
const dateLessThan = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // any Date constructor compatible

const distributionName = process.env.CLOUDFRONT_DOMAIN;

export const createCloudFrontSignedGetUrl = ({key, filename}) => {
  const url = `${distributionName}/${key}?response-content-disposition=${encodeURIComponent(`attachment;filename="${filename || 'file'}"`)}`;
  
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
