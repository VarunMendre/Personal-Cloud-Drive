import { OAuth2Client } from "google-auth-library";

const clientId =
  "341508182755-lcdl3f8mjnntpk1f9amuoa4i36vl6st5.apps.googleusercontent.com";

const client = new OAuth2Client({
  clientId,
});

export async function verifyIdToken(idToken) {
  const loginTicket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const userData = loginTicket.getPayload();
  return userData;
}
