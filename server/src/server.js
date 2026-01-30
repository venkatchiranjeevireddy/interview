import 'dotenv/config';
import app from './app.js';

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Auth server listening on port ${port}`);
});
