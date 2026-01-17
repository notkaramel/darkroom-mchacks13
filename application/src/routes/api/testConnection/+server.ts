import { log } from 'console';
import mongoose from 'mongoose';
import { MONGO_USERNAME, MONGO_PASSWORD } from '$env/static/private';

const uri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@darkroom-cluster.ffcj3de.mongodb.net/?appName=darkroom-cluster`;

export const GET = async () => {
	log(MONGO_USERNAME, MONGO_PASSWORD);
	log(uri);
    try {
        await mongoose.connect(uri);
        return new Response('Connected to MongoDB Atlas', { status: 200 });
    } catch (error) {
        return new Response('Error connecting to MongoDB', { status: 500 });
    }
}