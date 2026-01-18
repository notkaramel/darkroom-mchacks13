import mongoose from 'mongoose';
import { MONGO_USERNAME, MONGO_PASSWORD } from '$env/static/private';
import { Preset } from '$lib/models/Preset';
import { json, type RequestHandler } from '@sveltejs/kit';

const uri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@darkroom-cluster.ffcj3de.mongodb.net/?appName=darkroom-cluster`;

async function connectDB() {
	if (mongoose.connection.readyState === 0) {
		await mongoose.connect(uri);
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		await connectDB();
		const body = await request.json();

		const preset = new Preset(body);
		await preset.save();

		return json(preset, { status: 201 });
	} catch (error) {
		console.error('Error creating preset:', error);
		if (error instanceof Error && error.name === 'ValidationError') {
			return json({ error: 'Validation error', details: error.message }, { status: 400 });
		}
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
