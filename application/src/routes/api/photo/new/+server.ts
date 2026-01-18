import mongoose from 'mongoose';
import { MONGO_USERNAME, MONGO_PASSWORD } from '$env/static/private';
import { PUBLIC_DEMO_USER } from '$env/static/public';
import { Photo } from '$lib/models/Photo';
import { json, type RequestHandler } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { User } from '$lib/models/User';
import { Buffer } from 'node:buffer';

const uri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@darkroom-cluster.ffcj3de.mongodb.net/?appName=darkroom-cluster`;

async function connectDB() {
	if (mongoose.connection.readyState === 0) {
		await mongoose.connect(uri);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		await connectDB();

		// Get userId from request body (or use PUBLIC_DEMO_USER as default)
		const formData = await request.formData();
		const bodyUserId = formData.get('userId')?.toString();
		const userId = bodyUserId || PUBLIC_DEMO_USER;
		
		if (!userId) {
			return json({ error: 'userId is required' }, { status: 400 });
		}

		// Get the image file from FormData
		const file = formData.get('file') as File | null;
		if (!file) {
			return json({ error: 'Image file is required' }, { status: 400 });
		}

		const arrayBuffer = await file.arrayBuffer();
		const imageBuffer = Buffer.from(arrayBuffer);

		if (imageBuffer.length === 0) {
			return json({ error: 'Image buffer is required' }, { status: 400 });
		}

		// Generate a unique photoId
		const photoId = randomUUID();

		// Create photo with default changes (all zeros)
		const photo = new Photo({
			photoId,
			file: imageBuffer,
			changes: {
				basic: {
					brightness: 0,
					contrast: 0,
					highlight: 0,
					shadow: 0
				},
				color: {
					temperature: 0,
					tint: 0,
					vibrance: 0,
					saturation: 0
				},
				hsl: {
					red: { hue: 0, saturation: 0, luminance: 0 },
					orange: { hue: 0, saturation: 0, luminance: 0 },
					yellow: { hue: 0, saturation: 0, luminance: 0 },
					green: { hue: 0, saturation: 0, luminance: 0 },
					cyan: { hue: 0, saturation: 0, luminance: 0 },
					blue: { hue: 0, saturation: 0, luminance: 0 },
					purple: { hue: 0, saturation: 0, luminance: 0 },
					magenta: { hue: 0, saturation: 0, luminance: 0 }
				},
				lens_corrections: {
					distortion: 0,
					chromatic_aberration: 0,
					vignetting: 0
				},
				transform: {
					rotate: 0,
					vertical: 0,
					horizontal: 0,
					perspective: 0
				}
			}
		});

		await photo.save();

		// ADD PHOTO TO USER
		const user = await User.findOneAndUpdate(
			{ username: userId },
			{ $addToSet: { photos: photoId } }, //prevents duplicates from happening
			{ new: true }
		);

		if (!user) {
			//rollback: remove photo if the user does not exist
			await Photo.deleteOne({ photoId });
			return json({ error: 'User not found(upload rolled back)' }, { status: 404 });
		}

		return json(
			{ photoId: photo.photoId, message: 'Photo uploaded successfully' },
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating photo:', error);
		if (error instanceof Error && error.name === 'ValidationError') {
			return json({ error: 'Validation error', details: error.message }, { status: 400 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
