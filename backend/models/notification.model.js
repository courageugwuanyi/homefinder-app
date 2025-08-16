import mongoose from 'mongoose';

const notificationConfigSchema = new mongoose.Schema({
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RealEstateAgent',
        required: true
    },
    rentNew: { type: Boolean, default: true },
    saleNew: { type: Boolean, default: true },
    rentUpdate: { type: Boolean, default: false },
    recommendations: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    extras: { type: Boolean, default: false }
}, {
    timestamps: true
});

const NotificationConfig = mongoose.model('NotificationConfig', notificationConfigSchema);

export default NotificationConfig;