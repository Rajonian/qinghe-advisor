declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    CONFIG_ENCRYPTION_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
