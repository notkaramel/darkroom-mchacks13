import mongoose from 'mongoose';
import { MONGO_USERNAME,MONGO_PASSWORD } from '$env/static/private';
import { Photo } from '$lib/models/Photo';
import { error } from '@sveltejs/kit';

const uri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@darkroom-cluster.ffcj3de.mongodb.net/darkroom?retryWrites=true&w=majority&appName=darkroom-cluster`;

async function connectDB() { 
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
    }
}

export const GET = async ({ params }) => {
    await connectDB();

    const { photoId } = params; 
    if (!photoId) throw error(400, 'Photo ID is required');

    const photo = await Photo.findOne ({ photoId }).select('file');
    if(!photo?.file) throw error (404, 'Photo not found');

    return new Response (photo.file, {
        headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public,max-age=3600'
        }
    });
};

