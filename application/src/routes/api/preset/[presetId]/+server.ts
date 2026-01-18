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

export const GET: RequestHandler = async ({ params }) => {
	try {
		await connectDB();
		const { presetId } = params;

		if (!presetId) {
			return json({ error: 'Preset ID is required' }, { status: 400 });
		}

		const preset = await Preset.findById(presetId);

		if (!preset) {
			return json({ error: 'Preset not found' }, { status: 404 });
		}

		return json(preset, { status: 200 });
	} catch (error) {
		console.error('Error fetching preset:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		await connectDB();
		const { presetId } = params;

		if (!presetId) {
			return json({ error: 'Preset ID is required' }, { status: 400 });
		}

		const body = await request.json();

		const preset = await Preset.findByIdAndUpdate(presetId, body, {
			new: true,
			runValidators: true
		});

		if (!preset) {
			return json({ error: 'Preset not found' }, { status: 404 });
		}

		return json(preset, { status: 200 });
	} catch (error) {
		console.error('Error updating preset:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await connectDB();
		const { presetId } = params;

		if (!presetId) {
			return json({ error: 'Preset ID is required' }, { status: 400 });
		}

		const preset = await Preset.findByIdAndDelete(presetId);

		if (!preset) {
			return json({ error: 'Preset not found' }, { status: 404 });
		}

		return json({ message: 'Preset deleted successfully', preset }, { status: 200 });
	} catch (error) {
		console.error('Error deleting preset:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
