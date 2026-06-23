/**
 * Builds and exports the Conductor client from environment variables.
 * Reads: CONDUCTOR_SERVER_URL, CONDUCTOR_AUTH_KEY, CONDUCTOR_AUTH_SECRET.
 * Falls back to http://localhost:8080/api for the server URL when the env var is unset.
 */
import { orkesConductorClient } from "@io-orkes/conductor-javascript";
import "dotenv/config";

const serverUrl =
  process.env.CONDUCTOR_SERVER_URL ?? "http://localhost:8080/api";

const keyId = process.env.CONDUCTOR_AUTH_KEY;
const keySecret = process.env.CONDUCTOR_AUTH_SECRET;

const authConfig =
  keyId && keySecret ? { keyId, keySecret } : {};

export async function createClient() {
  return orkesConductorClient({ serverUrl, ...authConfig });
}
