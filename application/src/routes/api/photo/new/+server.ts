import mongoose from 'mongoose';
import { MONGO_USERNAME, MONGO_PASSWORD } from '$env/static/private';
import { Photo } from '$lib/models/Photo';
import { json, type RequestHandler } from '@sveltejs/kit';
import { randomUUID } from 'crypto';

const uri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@darkroom-cluster.ffcj3de.mongodb.net/?appName=darkroom-cluster`;

async function connectDB() {
	if (mongoose.connection.readyState === 0) {
		await mongoose.connect(uri);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		await connectDB();

		// Get the image buffer from the request
		const arrayBuffer = await request.arrayBuffer();
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

		return json({ photoId: photo.photoId, message: 'Photo uploaded successfully' }, { status: 201 });
	} catch (error) {
		console.error('Error creating photo:', error);
		if (error instanceof Error && error.name === 'ValidationError') {
			return json({ error: 'Validation error', details: error.message }, { status: 400 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
