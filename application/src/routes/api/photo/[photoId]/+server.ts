import mongoose from 'mongoose';
import { MONGO_USERNAME, MONGO_PASSWORD } from '$env/static/private';
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
		const { photoId } = params;

		if (!photoId) {
			return json({ error: 'Photo ID is required' }, { status: 400 });
		}

		const photo = await Photo.findOne({ photoId });

		if (!photo) {
			return json({ error: 'Photo not found' }, { status: 404 });
		}

		//Return actual image bytes
		return new Response(photo.file, {
			headers: {
				'Content-Type': 'image/jpeg',
				'Cache-Control': 'no-store'
			}
		});

	} catch (error) {
		console.error('Error fetching photo:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		await connectDB();
		const { photoId } = params;

		if (!photoId) {
			return json({ error: 'Photo ID is required' }, { status: 400 });
		}

		const body = await request.json();

		// Only update the changes field
		const photo = await Photo.findOneAndUpdate(
			{ photoId },
			{ $set: { changes: body.changes || body } },
			{
				new: true,
				runValidators: true
			}
		);

		if (!photo) {
			return json({ error: 'Photo not found' }, { status: 404 });
		}

		return json(
			{
				photoId: photo.photoId,
				changes: photo.changes,
				message: 'Photo changes updated successfully'
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error updating photo:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await connectDB();
		const { photoId } = params;

		if (!photoId) {
			return json({ error: 'Photo ID is required' }, { status: 400 });
		}

		const photo = await Photo.findOneAndDelete({ photoId });

		if (!photo) {
			return json({ error: 'Photo not found' }, { status: 404 });
		}

		return json({ message: 'Photo deleted successfully', photoId: photo.photoId }, { status: 200 });
	} catch (error) {
		console.error('Error deleting photo:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
