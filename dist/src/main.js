"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const path_1 = require("path");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useStaticAssets((0, path_1.join)(__dirname, '..', '..', 'public'), {
        setHeaders: (res) => {
            res.set('Access-Control-Allow-Origin', '*');
            res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
    });
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await app.listen(port);
    console.log(`🚀 Server is running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map