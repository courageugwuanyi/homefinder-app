import axios from 'axios';
import {GOOGLE_API_KEY} from "../config/env.js";

const geocodeMiddleware = async (req, res, next) => {
    try {
        const { state, city, streetAddress } = req.body;
        if (!state || !city || !streetAddress)  {
            const error = new Error("state, city, and street address are required.");
            error.statusCode = 400;
            throw error;
        }

        const address = `${streetAddress}, ${city}, ${state}`;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;

        const response = await axios.get(url);
        const data = response.data;

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            req.body.coordinates = { lat, lng };

            next();
        } else {
            const error = new Error("No results found!.");
            error.statusCode = 404;
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

export default geocodeMiddleware;