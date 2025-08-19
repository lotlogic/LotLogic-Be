"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var houseDesign1, houseDesign2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting database seeding...');
                    // Create sample estate
                    return [4 /*yield*/, prisma.estate.upsert({
                            where: { id: 3 },
                            update: {},
                            create: {
                                id: 3,
                                name: 'Canberra Heights Estate',
                                logoUrl: 'http://localhost:3000/estates/canberra-heights-logo.png',
                                themeColor: '#2F5D62',
                                email: 'info@canberraheights.com',
                                phone: '+61 2 6123 4567',
                                address: 'Canberra Heights, ACT 2600'
                            }
                        })];
                case 1:
                    // Create sample estate
                    _a.sent();
                    return [4 /*yield*/, prisma.zoningRule.upsert({
                            where: { code: 'RZ1' },
                            update: {
                                name: 'Residential Zone 1',
                                type: 'Residential',
                                isOverlay: false,
                                minFrontSetback_m: 4,
                                minRearSetback_m: 3,
                                minSideSetback_m: 3,
                                minFSR: 0.5,
                                maxFSR: 0.65,
                                maxStoreys: 2,
                                maxBuildingHeight_m: 8.5,
                                appliesToZones: ['RZ1']
                            },
                            create: {
                                code: 'RZ1',
                                name: 'Residential Zone 1',
                                type: 'Residential',
                                isOverlay: false,
                                minFrontSetback_m: 4,
                                minRearSetback_m: 3,
                                minSideSetback_m: 3,
                                minFSR: 0.5,
                                maxFSR: 0.65,
                                maxStoreys: 2,
                                maxBuildingHeight_m: 8.5,
                                appliesToZones: ['RZ1']
                            }
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.zoningRule.upsert({
                            where: { code: 'RZ2' },
                            update: {
                                name: 'Residential Zone 2',
                                type: 'Residential',
                                isOverlay: false,
                                minFrontSetback_m: 4,
                                minRearSetback_m: 3,
                                minSideSetback_m: 3,
                                minFSR: 0.5,
                                maxFSR: 0.5,
                                maxStoreys: 2,
                                maxBuildingHeight_m: 8.5,
                                appliesToZones: ['RZ2']
                            },
                            create: {
                                code: 'RZ2',
                                name: 'Residential Zone 2',
                                type: 'Residential',
                                isOverlay: false,
                                minFrontSetback_m: 4,
                                minRearSetback_m: 3,
                                minSideSetback_m: 3,
                                minFSR: 0.5,
                                maxFSR: 0.5,
                                maxStoreys: 2,
                                maxBuildingHeight_m: 8.5,
                                appliesToZones: ['RZ2']
                            }
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.zoningRule.upsert({
                            where: { code: 'RZ3' },
                            update: {
                                name: 'Residential Zone 3',
                                type: 'Residential',
                                isOverlay: false,
                                minFrontSetback_m: 10,
                                minRearSetback_m: 3,
                                minSideSetback_m: 3,
                                minFSR: 0.5,
                                maxFSR: 0.65,
                                maxStoreys: 2,
                                maxBuildingHeight_m: 9.5,
                                appliesToZones: ['RZ3']
                            },
                            create: {
                                code: 'RZ3',
                                name: 'Residential Zone 3',
                                type: 'Residential',
                                isOverlay: false,
                                minFrontSetback_m: 10,
                                minRearSetback_m: 3,
                                minSideSetback_m: 3,
                                minFSR: 0.5,
                                maxFSR: 0.65,
                                maxStoreys: 2,
                                maxBuildingHeight_m: 9.5,
                                appliesToZones: ['RZ3']
                            }
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.zoningRule.upsert({
                            where: { code: 'RZ4' },
                            update: {
                                name: 'Residential Zone 4',
                                type: 'ZONE',
                                isOverlay: false,
                                minFrontSetback_m: 6,
                                minRearSetback_m: 3,
                                minSideSetback_m: 3,
                                minFSR: 0.5,
                                maxFSR: 0.8,
                                maxStoreys: 2,
                                maxBuildingHeight_m: 12.5,
                                appliesToZones: ['RZ4']
                            },
                            create: {
                                code: 'RZ4',
                                name: 'Residential Zone 4',
                                type: 'ZONE',
                                isOverlay: false,
                                minFrontSetback_m: 6,
                                minRearSetback_m: 3,
                                minSideSetback_m: 3,
                                minFSR: 0.5,
                                maxFSR: 0.8,
                                maxStoreys: 2,
                                maxBuildingHeight_m: 12.5,
                                appliesToZones: ['RZ4']
                            }
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.zoningRule.upsert({
                            where: { code: 'RZ5' },
                            update: {
                                name: 'Residential Zone 5',
                                type: 'ZONE',
                                isOverlay: false,
                                minFrontSetback_m: 6,
                                minSideSetback_m: 3,
                                minRearSetback_m: 3,
                                minFSR: 0.5,
                                maxFSR: 0.8,
                                maxStoreys: 2,
                                maxBuildingHeight_m: 21.5,
                                appliesToZones: ['RZ5']
                            },
                            create: {
                                code: 'RZ5',
                                name: 'Residential Zone 5',
                                type: 'ZONE',
                                isOverlay: false,
                                minFrontSetback_m: 6,
                                minSideSetback_m: 3,
                                minRearSetback_m: 3,
                                minFSR: 0.5,
                                maxFSR: 0.8,
                                maxStoreys: 2,
                                maxBuildingHeight_m: 21.5,
                                appliesToZones: ['RZ5']
                            }
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.houseDesign.create({
                            data: {
                                name: 'Modern 3BR House',
                                floorplanUrl: 'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/images/floorplan1.jpeg',
                                bedrooms: 3,
                                bathrooms: 2,
                                garages: 1,
                                areaSqm: 150.0,
                                minLotWidth: 12.0,
                                minLotDepth: 15.0,
                                rumpus: false,
                                alfresco: true,
                                pergola: false
                            }
                        })];
                case 7:
                    houseDesign1 = _a.sent();
                    return [4 /*yield*/, prisma.houseDesign.create({
                            data: {
                                name: 'Compact 2BR House',
                                floorplanUrl: 'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/images/floorplan2.jpeg',
                                bedrooms: 2,
                                bathrooms: 1,
                                garages: 1,
                                areaSqm: 100.0,
                                minLotWidth: 10.0,
                                minLotDepth: 12.0,
                                rumpus: false,
                                alfresco: false,
                                pergola: true
                            }
                        })];
                case 8:
                    houseDesign2 = _a.sent();
                    // Create sample builder
                    return [4 /*yield*/, prisma.builder.create({
                            data: {
                                name: 'Canberra Builders Pty Ltd',
                                email: 'info@canberrabuilders.com.au',
                                phone: '+61 2 6123 4567'
                            }
                        })];
                case 9:
                    // Create sample builder
                    _a.sent();
                    // Create sample facades
                    return [4 /*yield*/, prisma.facade.create({
                            data: {
                                label: 'Modern Facade',
                                imageUrl: 'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/images/brick.jpg',
                                houseDesignId: houseDesign1.id
                            }
                        })];
                case 10:
                    // Create sample facades
                    _a.sent();
                    return [4 /*yield*/, prisma.facade.create({
                            data: {
                                label: 'Traditional Facade',
                                imageUrl: '/facades/traditional-facade.jpg',
                                houseDesignId: houseDesign2.id
                            }
                        })];
                case 11:
                    _a.sent();
                    console.log('✅ Sample data created successfully!');
                    console.log('✅ Created possible houseDesigns');
                    // sample house designs
                    // const bedrooms = [3, 4];
                    // const bathrooms = [1, 2, 3];
                    // const garages = [1, 2, 3];
                    // const rumpusOptions = [true, false];
                    // const alfrescoOptions = [true, false];
                    // const pergolaOptions = [true, false];
                    // for (const br of bedrooms) {
                    //   for (const ba of bathrooms) {
                    //     for (const ga of garages) {
                    //       for (const rumpus of rumpusOptions) {
                    //         for (const alfresco of alfrescoOptions) {
                    //           for (const pergola of pergolaOptions) {
                    //             await prisma.houseDesign.create({
                    //               data: {
                    //                 name: `${br}BR ${ba}BA ${ga}GA House`,
                    //                 floorplanUrl: 'https://loglogic-assets.s3.ap-southeast-2.amazonaws.com/images/floorplan1.jpeg',
                    //                 bedrooms: br,
                    //                 bathrooms: ba,
                    //                 garages: ga,
                    //                 areaSqm: Math.floor(Math.random() * (1000 - 200 + 1)) + 200,
                    //                 minLotWidth: 12.0,
                    //                 minLotDepth: 15.0,
                    //                 rumpus,
                    //                 alfresco,
                    //                 pergola
                    //               }
                    //             });
                    //           }
                    //         }
                    //       }
                    //     }
                    //   }
                    // }
                    // for (const br of bedrooms) {
                    //   for (const ba of bathrooms) {
                    //     for (const ga of garages) {
                    //       for (const rumpus of rumpusOptions) {
                    //         for (const alfresco of alfrescoOptions) {
                    //           for (const pergola of pergolaOptions) {
                    //             await prisma.houseDesign.create({
                    //               data: {
                    //                 name: `${br}BR ${ba}BA ${ga}GA House`,
                    //                 floorplanUrl: '/floorplans/floorplan.png',
                    //                 bedrooms: br,
                    //                 bathrooms: ba,
                    //                 garages: ga,
                    //                 areaSqm: Math.floor(Math.random() * (1000 - 200 + 1)) + 200,
                    //                 minLotWidth: 12.0,
                    //                 minLotDepth: 15.0,
                    //                 rumpus,
                    //                 alfresco,
                    //                 pergola
                    //               }
                    //             });
                    //           }
                    //         }
                    //       }
                    //     }
                    //   }
                    // }
                    console.log('✅ Sample data created successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
})
    .finally(function () {
    prisma.$disconnect();
});
