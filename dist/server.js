import app from './app';
import { ENV } from './config/env';
app.listen(ENV.PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${ENV.PORT}`);
});
