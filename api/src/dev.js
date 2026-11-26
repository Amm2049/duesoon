// Local development only (npm run dev). Vercel does not use this file (SPEC D-37).
const app = require("./index");

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`DueSoon API running at http://localhost:${PORT}`));
