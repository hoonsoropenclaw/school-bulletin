// Vercel Blob 適配器
// 上傳用 @vercel/blob(SDK 會自己讀 BLOB_READ_WRITE_TOKEN)
// 本地 dev 無 token 時,給 fallback(只在記憶體存,生產用不到)

export const HAS_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
