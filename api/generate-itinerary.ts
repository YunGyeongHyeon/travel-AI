import app from "../server/vercel-handler.js";

export default app;

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false,
  },
};
