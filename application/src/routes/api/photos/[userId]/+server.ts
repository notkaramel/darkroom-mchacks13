import mongoose from 'mongoose';
import { MONGO_USERNAME, MONGO_PASSWORD } from '$env/static/private';
import { User } from '$lib/models/User';
import { Photo } from '$lib/models/Photo';
import { json, type RequestHandler } from '@sveltejs/kit';

const uri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@darkroom-cluster.ffcj3de.mongodb.net/?appName=darkroom-cluster`;

async function connectDB() {
	if (mongoose.connection.readyState === 0) {
		await mongoose.connect(uri);
	}
}

export const GET: RequestHandler = async ({ params }) => {
	try {
		await connectDB();
		const { userId } = params;

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Find user by username (userId)
		const user = await User.findOne({ username: userId });

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// If user has no photos, return empty array
		if (!user.photos || user.photos.length === 0) {
			return json({ photos: [] }, { status: 200 });
		}

		// Fetch all photos that match the photoIds in the user's photos array
		const photos = await Photo.find({ photoId: { $in: user.photos } });

		// Return photos without the file buffer (too large for JSON response)
		const photosData = photos.map((photo) => ({
			photoId: photo.photoId,
			changes: photo.changes,
			fileSize: photo.file.length,
			createdAt: photo.createdAt,
			updatedAt: photo.updatedAt
		}));

		return json({ photos: photosData }, { status: 200 });
	} catch (error) {
		console.error('Error fetching user photos:', error);
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
	}
};
