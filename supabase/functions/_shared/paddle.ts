export const PADDLE = Deno.env.get("PADDLE_ENV") === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
