const mongoose = require('mongoose');

const houseSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    address: String,
    attorneyName: String,
    auctionNumber: String,
    bath: Number,
    checks: {
        "3129": Boolean,
        svs: Boolean,
        ok: Boolean
    },
    contactEmail: String,
    coords: {
        latitude: String,
        longitude: String
    },
    cost: Number,
    costTax: Number,
    defendantName: String,
    docketNumber: String,
    firmName: String,
    isBank: Boolean,
    isDuplicate: Boolean,
    isFC: Boolean,
    isPP: Boolean,
    judgment: Number,
    lastSoldDate: Date,
    lastSoldPrice: Number,
    municipality: String,
    plaintiffName: String,
    ppDate: Date,
    reasonForPP: String,
    rooms: Number,
    saleDate: Date,
    saleStatus: String,
    saleType: String,
    sqft: Number,
    taxAssessment: Number,
    yearBuilt: Number,
    zillowAddress: String,
    zillowEstimate: Number,
    zillowID: String,
    zillowLink: String
});

module.exports = mongoose.model('House', houseSchema);