import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RealEstateAgent',
        required: true
    },
    properties: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property'
    }]
}, {
    timestamps: true
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;